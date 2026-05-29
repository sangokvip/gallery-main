-- Admin session and member management RPCs
-- Run after create_admin_system.sql and database/create_member_center_tables.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admin_sessions (
  session_token_hash TEXT PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_username_time ON admin_login_attempts(username, attempted_at DESC);

ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;

ALTER TABLE message_replies
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

DROP FUNCTION IF EXISTS verify_admin_password(TEXT);
CREATE OR REPLACE FUNCTION verify_admin_password(input_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'is_valid',
    EXISTS (
      SELECT 1
      FROM admins
      WHERE is_active = true
        AND password_hash IS NOT NULL
        AND crypt(input_password, password_hash) = password_hash
    )
  );
END;
$$;

DROP FUNCTION IF EXISTS change_admin_password(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION change_admin_password(input_session_token_hash TEXT, current_password TEXT, new_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_row admins%ROWTYPE;
BEGIN
  SELECT a.* INTO admin_row
  FROM admins a
  JOIN admin_sessions s ON s.admin_id = a.id
  WHERE s.session_token_hash = input_session_token_hash
    AND s.expires_at > timezone('utc'::text, now())
    AND a.is_active = true
  LIMIT 1;

  IF admin_row.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', '管理员会话无效或已过期');
  END IF;

  IF crypt(current_password, admin_row.password_hash) <> admin_row.password_hash THEN
    RETURN jsonb_build_object('success', false, 'error', '当前密码错误');
  END IF;

  IF length(COALESCE(new_password, '')) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', '新密码至少8位');
  END IF;

  UPDATE admins
  SET password_hash = crypt(new_password, gen_salt('bf')),
      updated_at = timezone('utc'::text, now())
  WHERE id = admin_row.id;

  DELETE FROM admin_sessions WHERE admin_id = admin_row.id;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION create_admin_session(
  input_username TEXT,
  input_password TEXT,
  input_session_token_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_row admins%ROWTYPE;
  clean_username TEXT := lower(trim(COALESCE(input_username, '')));
  failed_count INTEGER;
BEGIN
  IF clean_username = ''
    OR COALESCE(input_password, '') = ''
    OR input_session_token_hash IS NULL
    OR input_session_token_hash !~ '^[a-f0-9]{64}$'
  THEN
    RAISE EXCEPTION '用户名或密码错误';
  END IF;

  DELETE FROM admin_login_attempts
  WHERE attempted_at < timezone('utc'::text, now()) - interval '1 day';

  SELECT count(*) INTO failed_count
  FROM admin_login_attempts
  WHERE username = clean_username
    AND success = false
    AND attempted_at > timezone('utc'::text, now()) - interval '15 minutes';

  IF failed_count >= 8 THEN
    RAISE EXCEPTION '登录尝试过多，请15分钟后再试';
  END IF;

  SELECT * INTO admin_row
  FROM admins
  WHERE lower(username) = clean_username AND is_active = true
  LIMIT 1;

  IF admin_row.id IS NULL THEN
    INSERT INTO admin_login_attempts (username, success) VALUES (clean_username, false);
    RAISE EXCEPTION '用户名或密码错误';
  END IF;

  IF admin_row.password_hash IS NULL OR crypt(input_password, admin_row.password_hash) <> admin_row.password_hash THEN
    INSERT INTO admin_login_attempts (username, success) VALUES (clean_username, false);
    RAISE EXCEPTION '用户名或密码错误';
  END IF;

  DELETE FROM admin_login_attempts WHERE username = clean_username;
  DELETE FROM admin_sessions WHERE expires_at <= timezone('utc'::text, now());

  INSERT INTO admin_sessions (session_token_hash, admin_id, role, expires_at)
  VALUES (input_session_token_hash, admin_row.id, admin_row.role, timezone('utc'::text, now()) + interval '8 hours')
  ON CONFLICT (session_token_hash) DO UPDATE
  SET admin_id = excluded.admin_id,
      role = excluded.role,
      expires_at = excluded.expires_at;

  UPDATE admins SET last_login = timezone('utc'::text, now()) WHERE id = admin_row.id;

  RETURN jsonb_build_object(
    'id', admin_row.id,
    'username', admin_row.username,
    'role', admin_row.role,
    'expires_at', timezone('utc'::text, now()) + interval '8 hours'
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_admin_session(input_session_token_hash TEXT)
RETURNS TABLE(admin_id UUID, username TEXT, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.username, s.role
  FROM admin_sessions s
  JOIN admins a ON a.id = s.admin_id
  WHERE s.session_token_hash = input_session_token_hash
    AND s.expires_at > timezone('utc'::text, now())
    AND a.is_active = true
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION require_admin(input_session_token_hash TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_admin UUID;
BEGIN
  SELECT admin_id INTO current_admin FROM get_admin_session(input_session_token_hash) LIMIT 1;
  IF current_admin IS NULL THEN
    RAISE EXCEPTION '管理员会话无效或已过期';
  END IF;
  RETURN current_admin;
END;
$$;

CREATE OR REPLACE FUNCTION member_admin_overview(input_session_token_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ignored UUID;
BEGIN
  ignored := require_admin(input_session_token_hash);
  RETURN jsonb_build_object(
    'totalMembers', (SELECT count(*) FROM member_profiles),
    'activeSubscriptions', (SELECT count(*) FROM member_subscriptions WHERE status IN ('active', 'trialing')),
    'pendingOrders', (SELECT count(*) FROM member_orders WHERE status = 'pending'),
    'activeShares', (SELECT count(*) FROM member_share_links WHERE is_active = true)
  );
END;
$$;

CREATE OR REPLACE FUNCTION member_admin_orders(input_session_token_hash TEXT, input_limit INTEGER DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ignored UUID;
BEGIN
  ignored := require_admin(input_session_token_hash);
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(o) ORDER BY o.created_at DESC)
    FROM (SELECT * FROM member_orders ORDER BY created_at DESC LIMIT input_limit) o
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION member_admin_members(input_session_token_hash TEXT, input_limit INTEGER DEFAULT 50, input_offset INTEGER DEFAULT 0)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ignored UUID;
BEGIN
  ignored := require_admin(input_session_token_hash);
  RETURN jsonb_build_object(
    'total', (SELECT count(*) FROM member_profiles),
    'members', COALESCE((
      SELECT jsonb_agg(
        to_jsonb(p) ||
        jsonb_build_object(
          'subscription', (
            SELECT to_jsonb(s)
            FROM member_subscriptions s
            WHERE s.account_id = p.account_id
            ORDER BY s.created_at DESC
            LIMIT 1
          ),
          'orders', COALESCE((
            SELECT jsonb_agg(to_jsonb(o) ORDER BY o.created_at DESC)
            FROM member_orders o
            WHERE o.account_id = p.account_id
          ), '[]'::jsonb)
        )
      )
      FROM (
        SELECT *
        FROM member_profiles
        ORDER BY created_at DESC
        LIMIT input_limit
        OFFSET input_offset
      ) p
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION apply_member_order_approval(
  input_order_id UUID,
  input_provider TEXT DEFAULT NULL,
  input_provider_ref TEXT DEFAULT NULL,
  input_admin_note TEXT DEFAULT '订单已开通',
  input_event_type TEXT DEFAULT 'member_order_approved'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_row member_orders%ROWTYPE;
  next_tier TEXT;
  next_ends_at TIMESTAMP WITH TIME ZONE;
  resolved_provider TEXT;
  resolved_provider_ref TEXT;
  was_already_approved BOOLEAN;
BEGIN
  SELECT * INTO order_row FROM member_orders WHERE id = input_order_id FOR UPDATE;
  IF order_row.id IS NULL THEN
    RAISE EXCEPTION '订单不存在';
  END IF;

  IF order_row.status IN ('canceled', 'refunded') THEN
    RAISE EXCEPTION '订单已取消或退款，不能审核通过';
  END IF;
  was_already_approved := order_row.status = 'approved';
  resolved_provider := COALESCE(NULLIF(input_provider, ''), order_row.provider, 'manual');
  resolved_provider_ref := COALESCE(NULLIF(input_provider_ref, ''), order_row.provider_ref, order_row.id::TEXT);

  next_tier := CASE order_row.plan_code
    WHEN 'basic_monthly' THEN 'basic'
    WHEN 'premium_monthly' THEN 'premium'
    WHEN 'lifetime' THEN 'lifetime'
    ELSE 'premium'
  END;
  next_ends_at := CASE WHEN order_row.plan_code = 'lifetime' THEN NULL ELSE timezone('utc'::text, now()) + interval '31 days' END;

  UPDATE member_orders
  SET status = 'approved',
      provider = resolved_provider,
      provider_ref = resolved_provider_ref,
      paid_at = COALESCE(paid_at, timezone('utc'::text, now())),
      reviewed_at = timezone('utc'::text, now()),
      admin_note = COALESCE(NULLIF(input_admin_note, ''), admin_note, '订单已开通')
  WHERE id = input_order_id;

  UPDATE member_profiles
  SET membership_tier = next_tier,
      updated_at = timezone('utc'::text, now())
  WHERE account_id = order_row.account_id;

  INSERT INTO member_subscriptions (account_id, plan_code, status, provider, provider_ref, starts_at, ends_at)
  VALUES (order_row.account_id, order_row.plan_code, 'active', resolved_provider, resolved_provider_ref, timezone('utc'::text, now()), next_ends_at)
  ON CONFLICT (provider, provider_ref) WHERE provider_ref IS NOT NULL DO UPDATE
  SET account_id = excluded.account_id,
      plan_code = excluded.plan_code,
      status = 'active',
      starts_at = member_subscriptions.starts_at,
      ends_at = excluded.ends_at,
      updated_at = timezone('utc'::text, now());

  IF NOT was_already_approved THEN
    INSERT INTO member_account_events (account_id, legacy_user_id_text, event_type, event_payload)
    VALUES (
      order_row.account_id,
      order_row.legacy_user_id_text,
      COALESCE(NULLIF(input_event_type, ''), 'member_order_approved'),
      jsonb_build_object(
        'order_id', order_row.id,
        'plan_code', order_row.plan_code,
        'tier', next_tier,
        'provider', resolved_provider,
        'provider_ref', resolved_provider_ref
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'order_id', order_row.id,
    'tier', next_tier,
    'idempotent', was_already_approved,
    'provider', resolved_provider,
    'provider_ref', resolved_provider_ref
  );
END;
$$;

CREATE OR REPLACE FUNCTION member_admin_approve_order(input_session_token_hash TEXT, input_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ignored UUID;
  approval_result JSONB;
BEGIN
  ignored := require_admin(input_session_token_hash);
  approval_result := apply_member_order_approval(
    input_order_id,
    'manual',
    input_order_id::TEXT,
    '后台手动审核通过',
    'admin_order_approved'
  );
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION member_admin_reject_order(input_session_token_hash TEXT, input_order_id UUID, input_note TEXT DEFAULT '后台手动拒绝')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ignored UUID;
  order_row member_orders%ROWTYPE;
BEGIN
  ignored := require_admin(input_session_token_hash);
  SELECT * INTO order_row FROM member_orders WHERE id = input_order_id FOR UPDATE;
  IF order_row.id IS NULL THEN
    RAISE EXCEPTION '订单不存在';
  END IF;
  IF order_row.status = 'approved' THEN
    RAISE EXCEPTION '订单已开通，不能拒绝';
  END IF;

  UPDATE member_orders
  SET status = 'rejected',
      reviewed_at = timezone('utc'::text, now()),
      admin_note = input_note
  WHERE id = input_order_id;

  INSERT INTO member_account_events (account_id, legacy_user_id_text, event_type, event_payload)
  VALUES (
    order_row.account_id,
    order_row.legacy_user_id_text,
    'admin_order_rejected',
    jsonb_build_object('order_id', order_row.id, 'note', input_note)
  );

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_message(input_session_token_hash TEXT, input_message_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ignored UUID;
BEGIN
  ignored := require_admin(input_session_token_hash);
  DELETE FROM messages WHERE id = input_message_id;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION admin_create_message(input_session_token_hash TEXT, input_text TEXT, input_original_text TEXT)
RETURNS messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ignored UUID;
  inserted_message messages%ROWTYPE;
  clean_text TEXT := left(trim(COALESCE(input_text, '')), 200);
  clean_original_text TEXT := left(trim(COALESCE(input_original_text, input_text, '')), 200);
BEGIN
  ignored := require_admin(input_session_token_hash);

  IF clean_text = '' THEN
    RAISE EXCEPTION '留言内容不能为空';
  END IF;

  INSERT INTO messages (user_id, text, original_text, created_at)
  VALUES ('admin', clean_text, clean_original_text, timezone('utc'::text, now()))
  RETURNING * INTO inserted_message;

  RETURN inserted_message;
END;
$$;

CREATE OR REPLACE FUNCTION admin_create_reply(
  input_session_token_hash TEXT,
  input_message_id UUID,
  input_text TEXT,
  input_original_text TEXT
)
RETURNS message_replies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ignored UUID;
  inserted_reply message_replies%ROWTYPE;
  clean_text TEXT := left(trim(COALESCE(input_text, '')), 200);
  clean_original_text TEXT := left(trim(COALESCE(input_original_text, input_text, '')), 200);
BEGIN
  ignored := require_admin(input_session_token_hash);

  IF clean_text = '' THEN
    RAISE EXCEPTION '回复内容不能为空';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM messages WHERE id = input_message_id) THEN
    RAISE EXCEPTION '消息不存在';
  END IF;

  INSERT INTO message_replies (message_id, user_id, text, original_text, is_admin, created_at)
  VALUES (input_message_id, 'admin', clean_text, clean_original_text, true, timezone('utc'::text, now()))
  RETURNING * INTO inserted_reply;

  RETURN inserted_reply;
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_reply(input_session_token_hash TEXT, input_reply_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ignored UUID;
BEGIN
  ignored := require_admin(input_session_token_hash);
  DELETE FROM message_replies WHERE id = input_reply_id;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION admin_toggle_message_pin(input_session_token_hash TEXT, input_message_id UUID, input_is_pinned BOOLEAN)
RETURNS messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ignored UUID;
  updated_message messages%ROWTYPE;
BEGIN
  ignored := require_admin(input_session_token_hash);

  UPDATE messages
  SET is_pinned = COALESCE(input_is_pinned, false)
  WHERE id = input_message_id
  RETURNING * INTO updated_message;

  IF updated_message.id IS NULL THEN
    RAISE EXCEPTION '消息不存在';
  END IF;

  RETURN updated_message;
END;
$$;

CREATE OR REPLACE FUNCTION admin_update_message_reaction_count(
  input_session_token_hash TEXT,
  input_message_id UUID,
  input_reaction_type TEXT,
  input_count INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ignored UUID;
  target_is_like BOOLEAN;
BEGIN
  ignored := require_admin(input_session_token_hash);

  IF input_reaction_type NOT IN ('likes', 'dislikes') THEN
    RAISE EXCEPTION '反应类型无效';
  END IF;

  IF input_count IS NULL OR input_count < 0 OR input_count > 10000 THEN
    RAISE EXCEPTION '反应数量无效';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM messages WHERE id = input_message_id) THEN
    RAISE EXCEPTION '消息不存在';
  END IF;

  target_is_like := input_reaction_type = 'likes';

  DELETE FROM message_reactions
  WHERE message_id = input_message_id
    AND is_like = target_is_like;

  INSERT INTO message_reactions (message_id, user_id, is_like)
  SELECT input_message_id, 'admin_adjust_' || input_reaction_type || '_' || gs::TEXT, target_is_like
  FROM generate_series(1, input_count) AS gs;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION verify_admin_password(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION change_admin_password(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_admin_session(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION require_admin(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION apply_member_order_approval(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_admin_session(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION member_admin_overview(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION member_admin_members(TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION member_admin_orders(TEXT, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION member_admin_approve_order(TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION member_admin_reject_order(TEXT, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_create_message(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_create_reply(TEXT, UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_delete_message(TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_delete_reply(TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_toggle_message_pin(TEXT, UUID, BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_update_message_reaction_count(TEXT, UUID, TEXT, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION create_admin_session(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION change_admin_password(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION apply_member_order_approval(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION member_admin_overview(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION member_admin_members(TEXT, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION member_admin_orders(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION member_admin_approve_order(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION member_admin_reject_order(TEXT, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_create_message(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_create_reply(TEXT, UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_message(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_reply(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_toggle_message_pin(TEXT, UUID, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_update_message_reaction_count(TEXT, UUID, TEXT, INTEGER) TO anon, authenticated;

COMMENT ON TABLE admin_sessions IS '后台管理员短期会话，前端只保存明文 token，数据库只保存 hash';
COMMENT ON TABLE admin_login_attempts IS '后台登录失败计数，用于数据库侧限速';
