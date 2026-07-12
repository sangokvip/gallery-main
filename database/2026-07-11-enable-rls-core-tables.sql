-- =============================================================================
-- 为核心敏感表启用 RLS，并提供配套的 SECURITY DEFINER RPC
-- 目标表：users / test_records / test_results
-- 作者：安全加固迁移  日期：2026-07-11
-- =============================================================================
--
-- 背景
--   目前前端用公开 anon key 直连读写这三张表，且表上没有任何 RLS。
--   任何人拿到 bundle 里的 anon key，即可 `select * from test_records` 拖走
--   全部测评隐私数据，或任意删改他人记录。这是最高优先级的安全漏洞。
--
-- 方案
--   1. 对三张表启用 RLS 且不为 anon/authenticated 添加任何直接访问策略
--      —— 直接的表级 SELECT/INSERT/UPDATE/DELETE 一律被拒。
--   2. 所有合法访问改走下面的 SECURITY DEFINER 函数（以函数属主身份绕过 RLS）：
--        · 匿名访客：凭 (user_id_text + claim_secret) 校验归属（沿用
--          member_identity_claims 里的 sha256 密钥哈希机制）。
--        · 分享：凭记录 UUID 的“能力式”只读（未知 UUID 无法枚举，等同旧行为）。
--        · 后台：凭 require_admin(session_token_hash) 校验管理员会话。
--        · 会员：已有的 get_member_records / get_member_profile_bundle 等
--          definer RPC 不受影响，继续可用。
--
-- 依赖（必须已存在于库中）
--   · 扩展 pgcrypto（digest 函数）——member center 迁移已启用。
--   · 表 member_identity_claims(legacy_user_id_text, claim_secret_hash)
--   · 函数 require_admin(TEXT) —— 见 create_admin_member_session.sql
--
-- ⚠️ 部署顺序：先在 Supabase 执行本 SQL，充分测试通过后，再部署配套的前端改动
--    （见 database/RLS-MIGRATION-RUNBOOK.md）。切勿只部署前端而不执行本 SQL。
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. 归属校验助手：匿名记录凭 claim_secret 验证归属
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_verify_legacy_claim(
  p_user_id_text TEXT,
  p_claim_secret TEXT
) RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM member_identity_claims c
    WHERE c.legacy_user_id_text = p_user_id_text
      AND c.claim_secret_hash = encode(digest(p_claim_secret, 'sha256'), 'hex')
  );
$$;

-- -----------------------------------------------------------------------------
-- A. 匿名访客 RPC（凭 user_id_text + claim_secret 校验归属）
-- -----------------------------------------------------------------------------

-- A1. 保存测评记录（upsert 用户 + 插入 record + 批量插入 results）
--     p_results 形如 [{"category":"性奴","item":"强奸","rating":"SSS"}, ...]
CREATE OR REPLACE FUNCTION app_save_test_record(
  p_user_id_text TEXT,
  p_nickname TEXT,
  p_test_type TEXT,
  p_claim_secret TEXT,
  p_report_data JSONB,
  p_results JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  new_record_id UUID;
BEGIN
  IF NOT app_verify_legacy_claim(p_user_id_text, p_claim_secret) THEN
    RAISE EXCEPTION 'invalid identity claim';
  END IF;

  INSERT INTO users (id, nickname, last_active)
  VALUES (p_user_id_text, COALESCE(NULLIF(p_nickname, ''), '匿名用户'), timezone('utc', now()))
  ON CONFLICT (id) DO UPDATE
    SET nickname = EXCLUDED.nickname,
        last_active = EXCLUDED.last_active;

  INSERT INTO test_records (user_id_text, test_type, report_data, created_at)
  VALUES (p_user_id_text, p_test_type, p_report_data, timezone('utc', now()))
  RETURNING id INTO new_record_id;

  INSERT INTO test_results (record_id, category, item, rating, created_at)
  SELECT new_record_id,
         r->>'category',
         r->>'item',
         r->>'rating',
         timezone('utc', now())
  FROM jsonb_array_elements(COALESCE(p_results, '[]'::jsonb)) AS r;

  RETURN jsonb_build_object('id', new_record_id);
END;
$$;

-- A2. 获取本人全部记录列表
CREATE OR REPLACE FUNCTION app_get_my_test_records(
  p_user_id_text TEXT,
  p_claim_secret TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT app_verify_legacy_claim(p_user_id_text, p_claim_secret) THEN
    RAISE EXCEPTION 'invalid identity claim';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at DESC)
    FROM (
      SELECT id, test_type, report_data, created_at, updated_at
      FROM test_records
      WHERE user_id_text = p_user_id_text
    ) t
  ), '[]'::jsonb);
END;
$$;

-- A3. 获取本人某类型最新记录（含明细 ratings）
CREATE OR REPLACE FUNCTION app_get_latest_test_record(
  p_user_id_text TEXT,
  p_test_type TEXT,
  p_claim_secret TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  rec test_records%ROWTYPE;
BEGIN
  IF NOT app_verify_legacy_claim(p_user_id_text, p_claim_secret) THEN
    RAISE EXCEPTION 'invalid identity claim';
  END IF;

  SELECT * INTO rec
  FROM test_records
  WHERE user_id_text = p_user_id_text AND test_type = p_test_type
  ORDER BY created_at DESC
  LIMIT 1;

  IF rec.id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', rec.id,
    'test_type', rec.test_type,
    'report_data', rec.report_data,
    'created_at', rec.created_at,
    'ratings', COALESCE((
      SELECT jsonb_object_agg(category || '-' || item, rating)
      FROM test_results WHERE record_id = rec.id
    ), '{}'::jsonb)
  );
END;
$$;

-- A4. 按 UUID 读取单条记录详情（能力式：用于查看/分享，知道 UUID 即视为授权）
--     注意：只能一次读一条、且必须已知 UUID，无法枚举全表——已堵住批量拖库。
CREATE OR REPLACE FUNCTION app_get_shared_test_record(
  p_record_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  rec test_records%ROWTYPE;
BEGIN
  SELECT * INTO rec FROM test_records WHERE id = p_record_id;
  IF rec.id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', rec.id,
    'test_type', rec.test_type,
    'report_data', rec.report_data,
    'created_at', rec.created_at,
    'user_id_text', rec.user_id_text,
    'ratings', COALESCE((
      SELECT jsonb_object_agg(category || '-' || item, rating)
      FROM test_results WHERE record_id = rec.id
    ), '{}'::jsonb)
  );
END;
$$;

-- A5. 更新本人记录
CREATE OR REPLACE FUNCTION app_update_test_record(
  p_record_id UUID,
  p_user_id_text TEXT,
  p_claim_secret TEXT,
  p_nickname TEXT,
  p_report_data JSONB,
  p_results JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  owner_id TEXT;
BEGIN
  IF NOT app_verify_legacy_claim(p_user_id_text, p_claim_secret) THEN
    RAISE EXCEPTION 'invalid identity claim';
  END IF;

  SELECT user_id_text INTO owner_id FROM test_records WHERE id = p_record_id;
  IF owner_id IS NULL OR owner_id <> p_user_id_text THEN
    RAISE EXCEPTION 'record not found or not owned by caller';
  END IF;

  UPDATE users
    SET nickname = COALESCE(NULLIF(p_nickname, ''), '匿名用户'),
        last_active = timezone('utc', now())
  WHERE id = p_user_id_text;

  UPDATE test_records
    SET report_data = p_report_data,
        updated_at = timezone('utc', now())
  WHERE id = p_record_id;

  DELETE FROM test_results WHERE record_id = p_record_id;

  INSERT INTO test_results (record_id, category, item, rating, created_at)
  SELECT p_record_id, r->>'category', r->>'item', r->>'rating', timezone('utc', now())
  FROM jsonb_array_elements(COALESCE(p_results, '[]'::jsonb)) AS r;

  RETURN jsonb_build_object('id', p_record_id);
END;
$$;

-- A6. 删除本人记录（含批量；test_results 由外键级联删除）
CREATE OR REPLACE FUNCTION app_delete_test_records(
  p_record_ids UUID[],
  p_user_id_text TEXT,
  p_claim_secret TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  IF NOT app_verify_legacy_claim(p_user_id_text, p_claim_secret) THEN
    RAISE EXCEPTION 'invalid identity claim';
  END IF;

  DELETE FROM test_records
  WHERE id = ANY(p_record_ids)
    AND user_id_text = p_user_id_text;   -- 仅能删自己的
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN jsonb_build_object('deleted', deleted_count);
END;
$$;

-- -----------------------------------------------------------------------------
-- B. 后台管理 RPC（凭 require_admin 校验管理员会话）
-- -----------------------------------------------------------------------------

-- B1. 仪表盘计数：总用户/总记录/今日用户/今日记录/各测评类型计数
CREATE OR REPLACE FUNCTION admin_dashboard_counts(
  input_session_token_hash TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  ignored UUID;
  today_start TIMESTAMPTZ := date_trunc('day', timezone('utc', now()));
BEGIN
  ignored := require_admin(input_session_token_hash);
  RETURN jsonb_build_object(
    'total_users', (SELECT count(*) FROM users),
    'total_records', (SELECT count(*) FROM test_records),
    'today_users', (SELECT count(*) FROM users WHERE created_at >= today_start),
    'today_records', (SELECT count(*) FROM test_records WHERE created_at >= today_start),
    'by_type', COALESCE((
      SELECT jsonb_object_agg(test_type, cnt)
      FROM (SELECT test_type, count(*) AS cnt FROM test_records GROUP BY test_type) g
    ), '{}'::jsonb)
  );
END;
$$;

-- B2. 记录列表（可按类型过滤 + 分页），返回记录 + 关联昵称
CREATE OR REPLACE FUNCTION admin_list_test_records(
  input_session_token_hash TEXT,
  input_test_type TEXT DEFAULT NULL,
  input_limit INTEGER DEFAULT 50,
  input_offset INTEGER DEFAULT 0
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  ignored UUID;
BEGIN
  ignored := require_admin(input_session_token_hash);
  RETURN jsonb_build_object(
    'total', (
      SELECT count(*) FROM test_records
      WHERE input_test_type IS NULL OR test_type = input_test_type
    ),
    'records', COALESCE((
      SELECT jsonb_agg(to_jsonb(t) ORDER BY t.created_at DESC)
      FROM (
        SELECT r.id, r.user_id_text, r.test_type, r.report_data,
               r.created_at, r.updated_at,
               u.nickname
        FROM test_records r
        LEFT JOIN users u ON u.id = r.user_id_text
        WHERE input_test_type IS NULL OR r.test_type = input_test_type
        ORDER BY r.created_at DESC
        LIMIT input_limit OFFSET input_offset
      ) t
    ), '[]'::jsonb)
  );
END;
$$;

-- B3. 记录明细（某条记录的全部 test_results）
CREATE OR REPLACE FUNCTION admin_get_test_record_detail(
  input_session_token_hash TEXT,
  input_record_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  ignored UUID;
BEGIN
  ignored := require_admin(input_session_token_hash);
  RETURN jsonb_build_object(
    'record', (
      SELECT to_jsonb(r) FROM test_records r WHERE r.id = input_record_id
    ),
    'results', COALESCE((
      SELECT jsonb_agg(to_jsonb(x) ORDER BY x.category)
      FROM (SELECT category, item, rating FROM test_results WHERE record_id = input_record_id) x
    ), '[]'::jsonb)
  );
END;
$$;

-- B4. 按 id 批量取用户昵称
CREATE OR REPLACE FUNCTION admin_get_users_by_ids(
  input_session_token_hash TEXT,
  input_ids TEXT[]
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  ignored UUID;
BEGIN
  ignored := require_admin(input_session_token_hash);
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object('id', id, 'nickname', nickname))
    FROM users WHERE id = ANY(input_ids)
  ), '[]'::jsonb);
END;
$$;

-- -----------------------------------------------------------------------------
-- C. 启用 RLS 并收回直接访问；仅授予 RPC 执行权
-- -----------------------------------------------------------------------------
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- 不为 anon/authenticated 添加任何行策略 => 直接表访问默认全拒。
-- SECURITY DEFINER 函数以属主身份运行，绕过 RLS，因此上面的 RPC 正常工作。
-- 额外收回表级权限，双保险：
REVOKE ALL ON users        FROM anon, authenticated;
REVOKE ALL ON test_records FROM anon, authenticated;
REVOKE ALL ON test_results FROM anon, authenticated;

-- 授予新 RPC 执行权（匿名 RPC 给 anon；后台 RPC 内部已用 require_admin 校验，
-- 沿用现有 member_admin_* 的“授予 anon、函数内校验会话”约定）
GRANT EXECUTE ON FUNCTION app_verify_legacy_claim(TEXT, TEXT)                       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_save_test_record(TEXT, TEXT, TEXT, TEXT, JSONB, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_get_my_test_records(TEXT, TEXT)                        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_get_latest_test_record(TEXT, TEXT, TEXT)               TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_get_shared_test_record(UUID)                           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_update_test_record(UUID, TEXT, TEXT, TEXT, JSONB, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_delete_test_records(UUID[], TEXT, TEXT)                TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_dashboard_counts(TEXT)                               TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_list_test_records(TEXT, TEXT, INTEGER, INTEGER)      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_test_record_detail(TEXT, UUID)                   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_users_by_ids(TEXT, TEXT[])                       TO anon, authenticated;

COMMIT;

-- =============================================================================
-- 回滚（如需临时恢复直连，仅用于应急，会重新打开漏洞）：
--   ALTER TABLE users        DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE test_records DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE test_results DISABLE ROW LEVEL SECURITY;
--   GRANT ALL ON users, test_records, test_results TO anon, authenticated;
-- =============================================================================
