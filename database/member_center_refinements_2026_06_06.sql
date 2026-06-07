-- Member center refinements: share accuracy, safer deletes, profile bundle, pair invites.
-- Run after database/member_center_full_deploy.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF to_regclass('public.member_share_links') IS NOT NULL THEN
    ALTER TABLE member_share_links DROP CONSTRAINT IF EXISTS member_share_links_record_id_fkey;
    ALTER TABLE member_share_links
      ADD CONSTRAINT member_share_links_record_id_fkey
      FOREIGN KEY (record_id) REFERENCES test_records(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS member_share_link_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID NOT NULL REFERENCES member_share_links(id) ON DELETE CASCADE,
  visitor_key_hash TEXT NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 1,
  first_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(share_id, visitor_key_hash)
);

CREATE INDEX IF NOT EXISTS idx_member_share_link_views_share ON member_share_link_views(share_id);
ALTER TABLE member_share_link_views ENABLE ROW LEVEL SECURITY;
REVOKE SELECT, INSERT, UPDATE, DELETE ON member_share_link_views FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS member_pair_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_token TEXT NOT NULL UNIQUE,
  requester_account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_legacy_user_id_text TEXT REFERENCES users(id) ON DELETE SET NULL,
  requester_record_id UUID REFERENCES test_records(id) ON DELETE SET NULL,
  relationship_mode TEXT NOT NULL DEFAULT 'masterSlave' CHECK (relationship_mode IN ('masterSlave', 'slaveSlave', 'masterMaster', 'partner')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'canceled', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS member_pair_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES member_pair_requests(id) ON DELETE SET NULL,
  requester_account_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responder_account_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_record_id UUID REFERENCES test_records(id) ON DELETE SET NULL,
  responder_record_id UUID REFERENCES test_records(id) ON DELETE SET NULL,
  relationship_mode TEXT NOT NULL DEFAULT 'masterSlave',
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_member_pair_requests_token ON member_pair_requests(invite_token);
CREATE INDEX IF NOT EXISTS idx_member_pair_requests_account ON member_pair_requests(requester_account_id);
CREATE INDEX IF NOT EXISTS idx_member_pair_reports_requester ON member_pair_reports(requester_account_id);
CREATE INDEX IF NOT EXISTS idx_member_pair_reports_responder ON member_pair_reports(responder_account_id);

ALTER TABLE member_pair_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_pair_reports ENABLE ROW LEVEL SECURITY;
REVOKE SELECT, INSERT, UPDATE, DELETE ON member_pair_requests FROM anon, authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON member_pair_reports FROM anon, authenticated;

DROP TRIGGER IF EXISTS update_member_pair_requests_updated_at ON member_pair_requests;
CREATE TRIGGER update_member_pair_requests_updated_at
  BEFORE UPDATE ON member_pair_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_member_center_timestamp();

CREATE OR REPLACE FUNCTION member_record_snapshot(input_record_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  record_row test_records%ROWTYPE;
  detail_rows JSONB;
BEGIN
  SELECT * INTO record_row
  FROM test_records
  WHERE id = input_record_id
  LIMIT 1;

  IF record_row.id IS NULL THEN
    RAISE EXCEPTION '测评记录不存在';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'record_id', tr.record_id,
    'category', tr.category,
    'item', tr.item,
    'rating', tr.rating
  ) ORDER BY tr.category, tr.item), '[]'::jsonb)
  INTO detail_rows
  FROM test_results tr
  WHERE tr.record_id = input_record_id;

  RETURN jsonb_build_object(
    'id', record_row.id,
    'user_id_text', record_row.user_id_text,
    'test_type', record_row.test_type,
    'report_data', record_row.report_data,
    'created_at', record_row.created_at,
    'updated_at', record_row.updated_at,
    'details', detail_rows
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_member_profile_bundle(
  input_legacy_user_id_text TEXT DEFAULT NULL,
  input_display_name TEXT DEFAULT NULL,
  input_claim_secret TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  current_account UUID := auth.uid();
  profile_row member_profiles%ROWTYPE;
  identity_link_error TEXT := NULL;
BEGIN
  IF current_account IS NULL THEN
    RAISE EXCEPTION '请先登录会员账号';
  END IF;

  profile_row := get_or_create_member_profile(NULL, input_display_name, NULL);

  IF profile_row.is_banned = true THEN
    RETURN jsonb_build_object(
      'profile', to_jsonb(profile_row),
      'identityLinkError', NULL,
      'subscription', NULL,
      'unlocks', '[]'::jsonb,
      'shareLinks', '[]'::jsonb,
      'orders', '[]'::jsonb,
      'devices', '[]'::jsonb,
      'identities', '[]'::jsonb,
      'isAuthenticated', true,
      'isBanned', true,
      'tablesReady', true
    );
  END IF;

  IF NULLIF(trim(COALESCE(input_legacy_user_id_text, '')), '') IS NOT NULL THEN
    BEGIN
      PERFORM link_member_identity(input_legacy_user_id_text, input_claim_secret, '当前身份');

      UPDATE member_profiles
      SET legacy_user_id_text = COALESCE(legacy_user_id_text, NULLIF(input_legacy_user_id_text, '')),
          updated_at = timezone('utc'::text, now())
      WHERE account_id = current_account
      RETURNING * INTO profile_row;
    EXCEPTION WHEN OTHERS THEN
      identity_link_error := SQLERRM;
    END;
  END IF;

  RETURN jsonb_build_object(
    'profile', to_jsonb(profile_row),
    'identityLinkError', identity_link_error,
    'subscription', (
      SELECT to_jsonb(ms)
      FROM member_subscriptions ms
      WHERE ms.account_id = current_account
      ORDER BY ms.created_at DESC
      LIMIT 1
    ),
    'unlocks', COALESCE((
      SELECT jsonb_agg(to_jsonb(mru) ORDER BY mru.created_at DESC)
      FROM member_report_unlocks mru
      WHERE mru.account_id = current_account
    ), '[]'::jsonb),
    'shareLinks', get_member_share_links(),
    'orders', COALESCE((
      SELECT jsonb_agg(to_jsonb(mo) ORDER BY mo.created_at DESC)
      FROM member_orders mo
      WHERE mo.account_id = current_account
    ), '[]'::jsonb),
    'devices', COALESCE((
      SELECT jsonb_agg(to_jsonb(md) ORDER BY md.created_at DESC)
      FROM member_devices md
      WHERE md.account_id = current_account
    ), '[]'::jsonb),
    'identities', COALESCE((
      SELECT jsonb_agg(to_jsonb(mil) ORDER BY mil.last_seen_at DESC)
      FROM member_identity_links mil
      WHERE mil.account_id = current_account
    ), '[]'::jsonb),
    'isAuthenticated', true,
    'tablesReady', true
  );
END;
$$;

CREATE OR REPLACE FUNCTION delete_member_record(input_record_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  current_account UUID := auth.uid();
  record_owner TEXT;
  deleted_count INTEGER;
BEGIN
  IF current_account IS NULL THEN
    RAISE EXCEPTION '请先登录账号';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM member_profiles
    WHERE account_id = current_account
      AND is_banned = true
  ) THEN
    RAISE EXCEPTION '账号已被封禁，无法删除记录';
  END IF;

  SELECT r.user_id_text INTO record_owner
  FROM test_records r
  WHERE r.id = input_record_id
    AND EXISTS (
      SELECT 1
      FROM member_identity_links mil
      WHERE mil.account_id = current_account
        AND mil.legacy_user_id_text = r.user_id_text
    )
  LIMIT 1;

  IF record_owner IS NULL THEN
    RAISE EXCEPTION '记录不存在或不属于当前账号';
  END IF;

  UPDATE member_share_links
  SET is_active = false,
      updated_at = timezone('utc'::text, now())
  WHERE account_id = current_account
    AND record_id = input_record_id
    AND is_active = true;

  DELETE FROM test_records
  WHERE id = input_record_id
    AND user_id_text = record_owner;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count = 0 THEN
    RAISE EXCEPTION '记录不存在或不属于当前账号';
  END IF;

  RETURN true;
END;
$$;

DROP FUNCTION IF EXISTS get_member_public_share(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_member_public_share(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION get_member_public_share(
  input_token TEXT,
  input_access_code TEXT DEFAULT NULL,
  input_viewer_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  link_row member_share_links%ROWTYPE;
  record_row test_records%ROWTYPE;
  detail_rows JSONB;
  clean_viewer_key TEXT := COALESCE(NULLIF(trim(input_viewer_key), ''), encode(gen_random_bytes(16), 'hex'));
  viewer_hash TEXT;
  aggregate_view_count INTEGER;
BEGIN
  SELECT * INTO link_row
  FROM member_share_links
  WHERE share_token = input_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > timezone('utc'::text, now()))
  LIMIT 1;

  IF link_row.id IS NULL THEN
    RAISE EXCEPTION '分享链接不存在或已失效';
  END IF;

  IF link_row.access_code_hash IS NOT NULL
     AND (input_access_code IS NULL OR crypt(input_access_code, link_row.access_code_hash) <> link_row.access_code_hash) THEN
    RETURN jsonb_build_object(
      'requiresAccessCode', true,
      'link', jsonb_build_object('title', link_row.title, 'expires_at', link_row.expires_at)
    );
  END IF;

  SELECT * INTO record_row FROM test_records WHERE id = link_row.record_id LIMIT 1;
  IF record_row.id IS NULL THEN
    RAISE EXCEPTION '分享报告不存在';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'category', category,
    'item', item,
    'rating', rating
  ) ORDER BY category, item), '[]'::jsonb)
  INTO detail_rows
  FROM test_results
  WHERE record_id = link_row.record_id;

  viewer_hash := encode(digest(link_row.id::text || ':' || clean_viewer_key, 'sha256'), 'hex');

  IF EXISTS (
    SELECT 1
    FROM member_share_link_views
    WHERE share_id = link_row.id
      AND visitor_key_hash = viewer_hash
  ) THEN
    UPDATE member_share_link_views
    SET view_count = view_count + 1,
        last_viewed_at = timezone('utc'::text, now())
    WHERE share_id = link_row.id
      AND visitor_key_hash = viewer_hash;

    aggregate_view_count := link_row.view_count;
  ELSE
    INSERT INTO member_share_link_views (share_id, visitor_key_hash)
    VALUES (link_row.id, viewer_hash);

    UPDATE member_share_links
    SET view_count = view_count + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = link_row.id
    RETURNING view_count INTO aggregate_view_count;
  END IF;

  RETURN jsonb_build_object(
    'requiresAccessCode', false,
    'link', jsonb_build_object(
      'id', link_row.id,
      'share_token', link_row.share_token,
      'record_id', link_row.record_id,
      'title', link_row.title,
      'hidden_sections', link_row.hidden_sections,
      'expires_at', link_row.expires_at,
      'is_active', link_row.is_active,
      'view_count', COALESCE(aggregate_view_count, link_row.view_count),
      'created_at', link_row.created_at
    ),
    'record', jsonb_build_object(
      'id', record_row.id,
      'test_type', record_row.test_type,
      'report_data', record_row.report_data,
      'created_at', record_row.created_at,
      'details', detail_rows
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION create_member_pair_request(
  input_legacy_user_id_text TEXT,
  input_record_id UUID,
  input_relationship_mode TEXT DEFAULT 'masterSlave',
  input_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  input_invite_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  current_account UUID := auth.uid();
  inserted_request member_pair_requests%ROWTYPE;
  clean_token TEXT := COALESCE(NULLIF(input_invite_token, ''), encode(gen_random_bytes(24), 'hex'));
  clean_mode TEXT := COALESCE(NULLIF(input_relationship_mode, ''), 'masterSlave');
BEGIN
  IF current_account IS NULL THEN
    RAISE EXCEPTION '请先登录会员账号';
  END IF;

  IF clean_mode NOT IN ('masterSlave', 'slaveSlave', 'masterMaster', 'partner') THEN
    RAISE EXCEPTION '关系模式无效';
  END IF;

  PERFORM ensure_member_record_owner(current_account, input_legacy_user_id_text, input_record_id);

  INSERT INTO member_pair_requests (
    invite_token,
    requester_account_id,
    requester_legacy_user_id_text,
    requester_record_id,
    relationship_mode,
    expires_at
  )
  VALUES (
    clean_token,
    current_account,
    input_legacy_user_id_text,
    input_record_id,
    clean_mode,
    COALESCE(input_expires_at, timezone('utc'::text, now()) + interval '14 days')
  )
  RETURNING * INTO inserted_request;

  RETURN to_jsonb(inserted_request);
END;
$$;

CREATE OR REPLACE FUNCTION get_member_pair_request(input_invite_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  request_row member_pair_requests%ROWTYPE;
  record_row test_records%ROWTYPE;
BEGIN
  SELECT * INTO request_row
  FROM member_pair_requests
  WHERE invite_token = input_invite_token
    AND status = 'open'
    AND (expires_at IS NULL OR expires_at > timezone('utc'::text, now()))
  LIMIT 1;

  IF request_row.id IS NULL THEN
    RAISE EXCEPTION '双人分析邀请不存在或已失效';
  END IF;

  SELECT * INTO record_row
  FROM test_records
  WHERE id = request_row.requester_record_id
  LIMIT 1;

  IF record_row.id IS NULL THEN
    RAISE EXCEPTION '邀请方测评记录不存在';
  END IF;

  RETURN jsonb_build_object(
    'id', request_row.id,
    'invite_token', request_row.invite_token,
    'relationship_mode', request_row.relationship_mode,
    'expires_at', request_row.expires_at,
    'created_at', request_row.created_at,
    'requester_record', jsonb_build_object(
      'id', record_row.id,
      'test_type', record_row.test_type,
      'created_at', record_row.created_at
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION accept_member_pair_request(
  input_invite_token TEXT,
  input_legacy_user_id_text TEXT,
  input_record_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  current_account UUID := auth.uid();
  request_row member_pair_requests%ROWTYPE;
  requester_snapshot JSONB;
  responder_snapshot JSONB;
  inserted_report member_pair_reports%ROWTYPE;
BEGIN
  IF current_account IS NULL THEN
    RAISE EXCEPTION '请先登录会员账号';
  END IF;

  SELECT * INTO request_row
  FROM member_pair_requests
  WHERE invite_token = input_invite_token
    AND status = 'open'
    AND (expires_at IS NULL OR expires_at > timezone('utc'::text, now()))
  LIMIT 1;

  IF request_row.id IS NULL THEN
    RAISE EXCEPTION '双人分析邀请不存在或已失效';
  END IF;

  PERFORM ensure_member_record_owner(current_account, input_legacy_user_id_text, input_record_id);

  requester_snapshot := member_record_snapshot(request_row.requester_record_id);
  responder_snapshot := member_record_snapshot(input_record_id);

  INSERT INTO member_pair_reports (
    request_id,
    requester_account_id,
    responder_account_id,
    requester_record_id,
    responder_record_id,
    relationship_mode,
    report_data
  )
  VALUES (
    request_row.id,
    request_row.requester_account_id,
    current_account,
    request_row.requester_record_id,
    input_record_id,
    request_row.relationship_mode,
    jsonb_build_object(
      'requester_record', requester_snapshot,
      'responder_record', responder_snapshot
    )
  )
  RETURNING * INTO inserted_report;

  UPDATE member_pair_requests
  SET status = 'completed',
      updated_at = timezone('utc'::text, now())
  WHERE id = request_row.id;

  RETURN jsonb_build_object(
    'id', inserted_report.id,
    'relationship_mode', inserted_report.relationship_mode,
    'created_at', inserted_report.created_at,
    'requester_record', requester_snapshot,
    'responder_record', responder_snapshot
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION member_record_snapshot(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_member_profile_bundle(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION delete_member_record(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_member_public_share(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION create_member_pair_request(TEXT, UUID, TEXT, TIMESTAMP WITH TIME ZONE, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_member_pair_request(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION accept_member_pair_request(TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION get_member_profile_bundle(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_member_record(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_member_public_share(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_member_pair_request(TEXT, UUID, TEXT, TIMESTAMP WITH TIME ZONE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_member_pair_request(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION accept_member_pair_request(TEXT, TEXT, UUID) TO authenticated;

COMMENT ON TABLE member_share_link_views IS '分享链接去重浏览记录，只保存访客键哈希';
COMMENT ON TABLE member_pair_requests IS '跨会员双人分析邀请';
COMMENT ON TABLE member_pair_reports IS '双人分析报告快照';
