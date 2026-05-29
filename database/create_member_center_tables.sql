-- M-profile Lab member center tables
-- Run in Supabase SQL Editor with an owner/service role.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS member_profiles (
  account_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  legacy_user_id_text TEXT REFERENCES users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL DEFAULT '匿名用户',
  membership_tier TEXT NOT NULL DEFAULT 'free' CHECK (membership_tier IN ('free', 'basic', 'premium', 'lifetime')),
  privacy_settings JSONB NOT NULL DEFAULT '{"hideUserId": true, "hideSensitiveItems": true, "allowPrivateShare": true}'::jsonb,
  notification_settings JSONB NOT NULL DEFAULT '{"monthlySummary": true, "trendReminder": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS member_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL CHECK (plan_code IN ('free', 'basic_monthly', 'premium_monthly', 'lifetime')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_ref TEXT,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS member_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legacy_user_id_text TEXT REFERENCES users(id) ON DELETE SET NULL,
  plan_code TEXT NOT NULL CHECK (plan_code IN ('basic_monthly', 'premium_monthly', 'lifetime')),
  amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'CNY',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'approved', 'rejected', 'canceled', 'refunded')),
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_ref TEXT,
  contact_email TEXT,
  contact_note TEXT,
  admin_note TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  paid_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS member_account_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  legacy_user_id_text TEXT REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS member_identity_links (
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legacy_user_id_text TEXT NOT NULL,
  display_label TEXT,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (account_id, legacy_user_id_text)
);

CREATE TABLE IF NOT EXISTS member_identity_claims (
  legacy_user_id_text TEXT PRIMARY KEY,
  claim_secret_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS member_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legacy_user_id_text TEXT REFERENCES users(id) ON DELETE SET NULL,
  device_label TEXT NOT NULL DEFAULT '当前设备',
  user_agent_hash TEXT,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(account_id, legacy_user_id_text, device_label)
);

CREATE TABLE IF NOT EXISTS member_report_unlocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legacy_user_id_text TEXT REFERENCES users(id) ON DELETE SET NULL,
  record_id UUID REFERENCES test_records(id) ON DELETE CASCADE,
  unlock_type TEXT NOT NULL DEFAULT 'advanced_report' CHECK (unlock_type IN ('advanced_report', 'comparison_report', 'export_template')),
  source TEXT NOT NULL DEFAULT 'membership',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(account_id, record_id, unlock_type)
);

CREATE TABLE IF NOT EXISTS member_share_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_token TEXT NOT NULL UNIQUE,
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legacy_user_id_text TEXT REFERENCES users(id) ON DELETE SET NULL,
  record_id UUID REFERENCES test_records(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '我的测评报告',
  access_code_hash TEXT,
  hidden_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

DROP INDEX IF EXISTS idx_member_subscriptions_user;
CREATE INDEX IF NOT EXISTS idx_member_subscriptions_account ON member_subscriptions(account_id);
CREATE INDEX IF NOT EXISTS idx_member_subscriptions_status ON member_subscriptions(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_member_subscriptions_provider_ref_unique
  ON member_subscriptions(provider, provider_ref)
  WHERE provider_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_member_orders_account ON member_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_member_orders_status ON member_orders(status);
CREATE INDEX IF NOT EXISTS idx_member_orders_created_at ON member_orders(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_member_orders_provider_ref_unique
  ON member_orders(provider, provider_ref)
  WHERE provider_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_member_account_events_account ON member_account_events(account_id);
CREATE INDEX IF NOT EXISTS idx_member_account_events_type ON member_account_events(event_type);
CREATE INDEX IF NOT EXISTS idx_member_identity_links_account ON member_identity_links(account_id);
CREATE INDEX IF NOT EXISTS idx_member_identity_links_legacy ON member_identity_links(legacy_user_id_text);
CREATE INDEX IF NOT EXISTS idx_member_identity_claims_updated_at ON member_identity_claims(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_devices_account ON member_devices(account_id);
DROP INDEX IF EXISTS idx_member_report_unlocks_user;
CREATE INDEX IF NOT EXISTS idx_member_report_unlocks_account ON member_report_unlocks(account_id);
CREATE INDEX IF NOT EXISTS idx_member_report_unlocks_record ON member_report_unlocks(record_id);
DROP INDEX IF EXISTS idx_member_share_links_user;
CREATE INDEX IF NOT EXISTS idx_member_share_links_account ON member_share_links(account_id);
CREATE INDEX IF NOT EXISTS idx_member_share_links_token ON member_share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_member_share_links_active ON member_share_links(is_active);

CREATE OR REPLACE FUNCTION update_member_center_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_member_profiles_updated_at ON member_profiles;
CREATE TRIGGER update_member_profiles_updated_at
  BEFORE UPDATE ON member_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_member_center_timestamp();

DROP TRIGGER IF EXISTS update_member_subscriptions_updated_at ON member_subscriptions;
CREATE TRIGGER update_member_subscriptions_updated_at
  BEFORE UPDATE ON member_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_member_center_timestamp();

DROP TRIGGER IF EXISTS update_member_orders_updated_at ON member_orders;
CREATE TRIGGER update_member_orders_updated_at
  BEFORE UPDATE ON member_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_member_center_timestamp();

DROP TRIGGER IF EXISTS update_member_share_links_updated_at ON member_share_links;
CREATE TRIGGER update_member_share_links_updated_at
  BEFORE UPDATE ON member_share_links
  FOR EACH ROW
  EXECUTE FUNCTION update_member_center_timestamp();

ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_account_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_identity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_identity_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_report_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_share_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_profiles_owner_read" ON member_profiles;
CREATE POLICY "member_profiles_owner_read" ON member_profiles FOR SELECT TO authenticated USING (account_id = auth.uid());

DROP POLICY IF EXISTS "member_profiles_owner_insert" ON member_profiles;

DROP POLICY IF EXISTS "member_profiles_owner_update" ON member_profiles;

DROP POLICY IF EXISTS "member_subscriptions_owner_read" ON member_subscriptions;
CREATE POLICY "member_subscriptions_owner_read" ON member_subscriptions FOR SELECT TO authenticated USING (account_id = auth.uid());

DROP POLICY IF EXISTS "member_orders_owner_read" ON member_orders;
CREATE POLICY "member_orders_owner_read" ON member_orders FOR SELECT TO authenticated USING (account_id = auth.uid());

DROP POLICY IF EXISTS "member_orders_owner_insert" ON member_orders;

DROP POLICY IF EXISTS "member_account_events_owner_read" ON member_account_events;
CREATE POLICY "member_account_events_owner_read" ON member_account_events FOR SELECT TO authenticated USING (account_id = auth.uid());

DROP POLICY IF EXISTS "member_account_events_owner_insert" ON member_account_events;

DROP POLICY IF EXISTS "member_identity_links_owner_read" ON member_identity_links;
CREATE POLICY "member_identity_links_owner_read" ON member_identity_links FOR SELECT TO authenticated USING (account_id = auth.uid());

DROP POLICY IF EXISTS "member_identity_links_owner_insert" ON member_identity_links;

DROP POLICY IF EXISTS "member_identity_links_owner_update" ON member_identity_links;

DROP POLICY IF EXISTS "member_identity_links_owner_delete" ON member_identity_links;

DROP POLICY IF EXISTS "member_identity_claims_no_read" ON member_identity_claims;

DROP POLICY IF EXISTS "member_identity_claims_no_insert" ON member_identity_claims;

DROP POLICY IF EXISTS "member_identity_claims_no_update" ON member_identity_claims;

DROP POLICY IF EXISTS "member_identity_claims_no_delete" ON member_identity_claims;

DROP POLICY IF EXISTS "member_devices_owner_read" ON member_devices;
CREATE POLICY "member_devices_owner_read" ON member_devices FOR SELECT TO authenticated USING (account_id = auth.uid());

DROP POLICY IF EXISTS "member_devices_owner_insert" ON member_devices;

DROP POLICY IF EXISTS "member_devices_owner_update" ON member_devices;

DROP POLICY IF EXISTS "member_report_unlocks_owner_read" ON member_report_unlocks;
CREATE POLICY "member_report_unlocks_owner_read" ON member_report_unlocks FOR SELECT TO authenticated USING (account_id = auth.uid());

DROP POLICY IF EXISTS "member_report_unlocks_owner_insert" ON member_report_unlocks;

DROP POLICY IF EXISTS "member_share_links_owner_read" ON member_share_links;

DROP POLICY IF EXISTS "member_share_links_owner_insert" ON member_share_links;

DROP POLICY IF EXISTS "member_share_links_owner_update" ON member_share_links;

DROP POLICY IF EXISTS "member_share_links_public_read_active" ON member_share_links;

REVOKE INSERT, UPDATE ON member_profiles FROM anon, authenticated;
REVOKE INSERT ON member_orders FROM anon, authenticated;
REVOKE INSERT ON member_report_unlocks FROM anon, authenticated;
REVOKE INSERT ON member_account_events FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON member_identity_links FROM anon, authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON member_identity_claims FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON member_devices FROM anon, authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON member_share_links FROM anon, authenticated;
REVOKE SELECT (access_code_hash) ON member_share_links FROM anon, authenticated;

CREATE OR REPLACE FUNCTION normalize_member_privacy_settings(input_settings JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN jsonb_build_object(
    'hideUserId', COALESCE((input_settings->>'hideUserId')::BOOLEAN, true),
    'hideSensitiveItems', COALESCE((input_settings->>'hideSensitiveItems')::BOOLEAN, true),
    'allowPrivateShare', COALESCE((input_settings->>'allowPrivateShare')::BOOLEAN, true)
  );
END;
$$;

CREATE OR REPLACE FUNCTION normalize_member_notification_settings(input_settings JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN jsonb_build_object(
    'monthlySummary', COALESCE((input_settings->>'monthlySummary')::BOOLEAN, true),
    'trendReminder', COALESCE((input_settings->>'trendReminder')::BOOLEAN, false)
  );
END;
$$;

DROP FUNCTION IF EXISTS link_member_identity(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_or_create_member_profile(TEXT, TEXT);
DROP FUNCTION IF EXISTS register_member_device(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION link_member_identity(
  input_legacy_user_id_text TEXT,
  input_claim_secret TEXT,
  input_display_label TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  current_account UUID := auth.uid();
  clean_legacy_id TEXT := NULLIF(trim(input_legacy_user_id_text), '');
  clean_claim_secret TEXT := NULLIF(input_claim_secret, '');
  clean_label TEXT := NULLIF(left(trim(COALESCE(input_display_label, '当前身份')), 80), '');
  linked_row member_identity_links%ROWTYPE;
BEGIN
  IF current_account IS NULL THEN
    RAISE EXCEPTION '请先登录会员账号';
  END IF;

  IF clean_legacy_id IS NULL THEN
    RAISE EXCEPTION '匿名身份不能为空';
  END IF;

  IF clean_claim_secret IS NULL THEN
    RAISE EXCEPTION '匿名身份密钥不能为空';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM member_identity_claims
    WHERE legacy_user_id_text = clean_legacy_id
      AND claim_secret_hash = encode(digest(clean_claim_secret, 'sha256'), 'hex')
  ) THEN
    RAISE EXCEPTION '匿名身份密钥不匹配，无法绑定该测评身份';
  END IF;

  INSERT INTO member_identity_links (
    account_id,
    legacy_user_id_text,
    display_label,
    first_seen_at,
    last_seen_at
  )
  VALUES (
    current_account,
    clean_legacy_id,
    clean_label,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (account_id, legacy_user_id_text) DO UPDATE
  SET display_label = COALESCE(excluded.display_label, member_identity_links.display_label),
      last_seen_at = timezone('utc'::text, now())
  RETURNING * INTO linked_row;

  RETURN to_jsonb(linked_row);
END;
$$;

CREATE OR REPLACE FUNCTION register_legacy_identity_claim(
  input_legacy_user_id_text TEXT,
  input_claim_secret TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  clean_legacy_id TEXT := NULLIF(trim(input_legacy_user_id_text), '');
  clean_claim_secret TEXT := NULLIF(input_claim_secret, '');
  inserted_claim member_identity_claims%ROWTYPE;
BEGIN
  IF clean_legacy_id IS NULL THEN
    RAISE EXCEPTION '匿名身份不能为空';
  END IF;

  IF clean_claim_secret IS NULL OR length(clean_claim_secret) < 32 THEN
    RAISE EXCEPTION '匿名身份密钥无效';
  END IF;

  INSERT INTO member_identity_claims (
    legacy_user_id_text,
    claim_secret_hash,
    created_at,
    updated_at
  )
  VALUES (
    clean_legacy_id,
    encode(digest(clean_claim_secret, 'sha256'), 'hex'),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (legacy_user_id_text) DO UPDATE
  SET updated_at = timezone('utc'::text, now())
  WHERE member_identity_claims.claim_secret_hash = excluded.claim_secret_hash
  RETURNING * INTO inserted_claim;

  IF inserted_claim.legacy_user_id_text IS NULL THEN
    RAISE EXCEPTION '匿名身份已被其他密钥登记';
  END IF;

  RETURN jsonb_build_object(
    'legacy_user_id_text', inserted_claim.legacy_user_id_text,
    'updated_at', inserted_claim.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_or_create_member_profile(
  input_legacy_user_id_text TEXT DEFAULT NULL,
  input_display_name TEXT DEFAULT NULL,
  input_claim_secret TEXT DEFAULT NULL
)
RETURNS member_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  current_account UUID := auth.uid();
  profile_row member_profiles%ROWTYPE;
  clean_display_name TEXT := COALESCE(NULLIF(trim(input_display_name), ''), '会员用户');
BEGIN
  IF current_account IS NULL THEN
    RAISE EXCEPTION '请先登录会员账号';
  END IF;

  INSERT INTO member_profiles (
    account_id,
    legacy_user_id_text,
    display_name,
    membership_tier,
    privacy_settings,
    notification_settings
  )
  VALUES (
    current_account,
    NULLIF(input_legacy_user_id_text, ''),
    left(clean_display_name, 80),
    'free',
    '{"hideUserId": true, "hideSensitiveItems": true, "allowPrivateShare": true}'::jsonb,
    '{"monthlySummary": true, "trendReminder": false}'::jsonb
  )
  ON CONFLICT (account_id) DO UPDATE
  SET legacy_user_id_text = COALESCE(member_profiles.legacy_user_id_text, NULLIF(input_legacy_user_id_text, '')),
      updated_at = timezone('utc'::text, now())
  RETURNING * INTO profile_row;

  IF NULLIF(input_legacy_user_id_text, '') IS NOT NULL THEN
    PERFORM link_member_identity(input_legacy_user_id_text, input_claim_secret, '当前身份');
  END IF;

  RETURN profile_row;
END;
$$;

CREATE OR REPLACE FUNCTION update_member_profile(
  input_display_name TEXT DEFAULT NULL,
  input_privacy_settings JSONB DEFAULT NULL,
  input_notification_settings JSONB DEFAULT NULL
)
RETURNS member_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  current_account UUID := auth.uid();
  profile_row member_profiles%ROWTYPE;
BEGIN
  IF current_account IS NULL THEN
    RAISE EXCEPTION '请先登录会员账号';
  END IF;

  UPDATE member_profiles
  SET display_name = COALESCE(NULLIF(left(trim(input_display_name), 80), ''), display_name),
      privacy_settings = CASE
        WHEN input_privacy_settings IS NULL THEN privacy_settings
        ELSE normalize_member_privacy_settings(input_privacy_settings)
      END,
      notification_settings = CASE
        WHEN input_notification_settings IS NULL THEN notification_settings
        ELSE normalize_member_notification_settings(input_notification_settings)
      END,
      updated_at = timezone('utc'::text, now())
  WHERE account_id = current_account
  RETURNING * INTO profile_row;

  IF profile_row.account_id IS NULL THEN
    RAISE EXCEPTION '会员资料不存在';
  END IF;

  RETURN profile_row;
END;
$$;

CREATE OR REPLACE FUNCTION register_member_device(
  input_legacy_user_id_text TEXT,
  input_claim_secret TEXT,
  input_device_label TEXT DEFAULT '当前设备',
  input_user_agent_hash TEXT DEFAULT NULL
)
RETURNS member_devices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  current_account UUID := auth.uid();
  device_row member_devices%ROWTYPE;
  clean_label TEXT := COALESCE(NULLIF(left(trim(input_device_label), 40), ''), '当前设备');
  clean_hash TEXT := NULLIF(input_user_agent_hash, '');
BEGIN
  IF current_account IS NULL THEN
    RAISE EXCEPTION '请先登录会员账号';
  END IF;

  IF clean_hash IS NOT NULL AND clean_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION '设备指纹格式无效';
  END IF;

  PERFORM link_member_identity(input_legacy_user_id_text, input_claim_secret, clean_label);

  INSERT INTO member_devices (
    account_id,
    legacy_user_id_text,
    device_label,
    user_agent_hash,
    last_seen_at
  )
  VALUES (
    current_account,
    NULLIF(input_legacy_user_id_text, ''),
    clean_label,
    clean_hash,
    timezone('utc'::text, now())
  )
  ON CONFLICT (account_id, legacy_user_id_text, device_label) DO UPDATE
  SET user_agent_hash = excluded.user_agent_hash,
      last_seen_at = timezone('utc'::text, now())
  RETURNING * INTO device_row;

  RETURN device_row;
END;
$$;

CREATE OR REPLACE FUNCTION unlink_member_device(input_device_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  current_account UUID := auth.uid();
  deleted_count INTEGER;
BEGIN
  IF current_account IS NULL THEN
    RAISE EXCEPTION '请先登录会员账号';
  END IF;

  DELETE FROM member_devices
  WHERE id = input_device_id
    AND account_id = current_account;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count = 0 THEN
    RAISE EXCEPTION '设备不存在或不属于当前账号';
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION require_premium_member(input_account_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  profile_tier TEXT;
BEGIN
  SELECT membership_tier INTO profile_tier
  FROM member_profiles
  WHERE account_id = input_account_id
  LIMIT 1;

  IF profile_tier NOT IN ('premium', 'lifetime') THEN
    RAISE EXCEPTION '该功能需要高级会员或永久会员';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION ensure_member_record_owner(input_account_id UUID, input_legacy_user_id_text TEXT, input_record_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF input_legacy_user_id_text IS NULL OR input_legacy_user_id_text = '' THEN
    RAISE EXCEPTION '请先绑定当前匿名身份';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM member_identity_links
    WHERE account_id = input_account_id
      AND legacy_user_id_text = input_legacy_user_id_text
  ) THEN
    RAISE EXCEPTION '当前会员账号未绑定该测评身份';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM test_records
    WHERE id = input_record_id
      AND user_id_text = input_legacy_user_id_text
  ) THEN
    RAISE EXCEPTION '测评记录不存在或不属于当前身份';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_member_records()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  current_account UUID := auth.uid();
BEGIN
  IF current_account IS NULL THEN
    RAISE EXCEPTION '请先登录会员账号';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'user_id_text', r.user_id_text,
        'test_type', r.test_type,
        'report_data', r.report_data,
        'created_at', r.created_at,
        'updated_at', r.updated_at,
        'details', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'record_id', tr.record_id,
              'category', tr.category,
              'item', tr.item,
              'rating', tr.rating
            )
            ORDER BY tr.category, tr.item
          )
          FROM test_results tr
          WHERE tr.record_id = r.id
        ), '[]'::jsonb)
      )
      ORDER BY r.created_at ASC
    )
    FROM test_records r
    WHERE EXISTS (
      SELECT 1
      FROM member_identity_links mil
      WHERE mil.account_id = current_account
        AND mil.legacy_user_id_text = r.user_id_text
    )
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION create_member_order(
  input_legacy_user_id_text TEXT,
  input_plan_code TEXT,
  input_contact_email TEXT DEFAULT NULL,
  input_contact_note TEXT DEFAULT NULL
)
RETURNS member_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  current_account UUID := auth.uid();
  amount_value INTEGER;
  inserted_order member_orders%ROWTYPE;
BEGIN
  IF current_account IS NULL THEN
    RAISE EXCEPTION '请先登录会员账号';
  END IF;

  amount_value := CASE input_plan_code
    WHEN 'basic_monthly' THEN 1900
    WHEN 'premium_monthly' THEN 3900
    WHEN 'lifetime' THEN 29900
    ELSE NULL
  END;

  IF amount_value IS NULL THEN
    RAISE EXCEPTION '会员方案无效';
  END IF;

  INSERT INTO member_orders (
    account_id,
    legacy_user_id_text,
    plan_code,
    amount_cents,
    currency,
    status,
    provider,
    contact_email,
    contact_note
  )
  VALUES (
    current_account,
    NULLIF(input_legacy_user_id_text, ''),
    input_plan_code,
    amount_value,
    'CNY',
    'pending',
    'manual',
    NULLIF(input_contact_email, ''),
    NULLIF(input_contact_note, '')
  )
  RETURNING * INTO inserted_order;

  RETURN inserted_order;
END;
$$;

CREATE OR REPLACE FUNCTION create_member_report_unlock(
  input_legacy_user_id_text TEXT,
  input_record_id UUID,
  input_unlock_type TEXT DEFAULT 'advanced_report'
)
RETURNS member_report_unlocks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  current_account UUID := auth.uid();
  inserted_unlock member_report_unlocks%ROWTYPE;
BEGIN
  IF current_account IS NULL THEN
    RAISE EXCEPTION '请先登录会员账号';
  END IF;

  IF input_unlock_type NOT IN ('advanced_report', 'comparison_report', 'export_template') THEN
    RAISE EXCEPTION '解锁类型无效';
  END IF;

  PERFORM require_premium_member(current_account);
  PERFORM ensure_member_record_owner(current_account, input_legacy_user_id_text, input_record_id);

  INSERT INTO member_report_unlocks (
    account_id,
    legacy_user_id_text,
    record_id,
    unlock_type,
    source
  )
  VALUES (
    current_account,
    input_legacy_user_id_text,
    input_record_id,
    input_unlock_type,
    'membership'
  )
  ON CONFLICT (account_id, record_id, unlock_type) DO UPDATE
  SET source = excluded.source
  RETURNING * INTO inserted_unlock;

  RETURN inserted_unlock;
END;
$$;

CREATE OR REPLACE FUNCTION create_member_share_link(
  input_legacy_user_id_text TEXT,
  input_record_id UUID,
  input_title TEXT DEFAULT '我的测评报告',
  input_access_code TEXT DEFAULT NULL,
  input_hidden_sections JSONB DEFAULT '[]'::jsonb,
  input_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  input_share_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  current_account UUID := auth.uid();
  inserted_link member_share_links%ROWTYPE;
  clean_access_code TEXT := NULLIF(trim(input_access_code), '');
  clean_share_token TEXT := COALESCE(NULLIF(input_share_token, ''), encode(gen_random_bytes(24), 'hex'));
BEGIN
  IF current_account IS NULL THEN
    RAISE EXCEPTION '请先登录会员账号';
  END IF;

  PERFORM require_premium_member(current_account);
  PERFORM ensure_member_record_owner(current_account, input_legacy_user_id_text, input_record_id);

  INSERT INTO member_share_links (
    share_token,
    account_id,
    legacy_user_id_text,
    record_id,
    title,
    access_code_hash,
    hidden_sections,
    expires_at,
    is_active
  )
  VALUES (
    clean_share_token,
    current_account,
    input_legacy_user_id_text,
    input_record_id,
    COALESCE(NULLIF(input_title, ''), '我的测评报告'),
    CASE WHEN clean_access_code IS NULL THEN NULL ELSE crypt(clean_access_code, gen_salt('bf')) END,
    COALESCE(input_hidden_sections, '[]'::jsonb),
    input_expires_at,
    true
  )
  RETURNING * INTO inserted_link;

  RETURN to_jsonb(inserted_link) - 'access_code_hash';
END;
$$;

CREATE OR REPLACE FUNCTION get_member_share_links()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  current_account UUID := auth.uid();
BEGIN
  IF current_account IS NULL THEN
    RAISE EXCEPTION '请先登录会员账号';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'share_token', share_token,
        'account_id', account_id,
        'legacy_user_id_text', legacy_user_id_text,
        'record_id', record_id,
        'title', title,
        'hidden_sections', hidden_sections,
        'expires_at', expires_at,
        'is_active', is_active,
        'view_count', view_count,
        'created_at', created_at,
        'updated_at', updated_at
      )
      ORDER BY created_at DESC
    )
    FROM member_share_links
    WHERE account_id = current_account
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION deactivate_member_share_link(input_share_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  current_account UUID := auth.uid();
  updated_link member_share_links%ROWTYPE;
BEGIN
  IF current_account IS NULL THEN
    RAISE EXCEPTION '请先登录会员账号';
  END IF;

  UPDATE member_share_links
  SET is_active = false,
      updated_at = timezone('utc'::text, now())
  WHERE id = input_share_id
    AND account_id = current_account
  RETURNING * INTO updated_link;

  IF updated_link.id IS NULL THEN
    RAISE EXCEPTION '分享链接不存在或不属于当前账号';
  END IF;

  RETURN to_jsonb(updated_link) - 'access_code_hash';
END;
$$;

DROP FUNCTION IF EXISTS get_member_public_share(TEXT, TEXT);
CREATE OR REPLACE FUNCTION get_member_public_share(input_token TEXT, input_access_code TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  link_row member_share_links%ROWTYPE;
  record_row test_records%ROWTYPE;
  detail_rows JSONB;
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

  UPDATE member_share_links
  SET view_count = view_count + 1,
      updated_at = timezone('utc'::text, now())
  WHERE id = link_row.id;

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
      'view_count', link_row.view_count + 1,
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

REVOKE EXECUTE ON FUNCTION require_premium_member(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION ensure_member_record_owner(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION link_member_identity(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION register_legacy_identity_claim(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_member_records() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_or_create_member_profile(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION update_member_profile(TEXT, JSONB, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION register_member_device(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION unlink_member_device(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION create_member_order(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION create_member_report_unlock(TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION create_member_share_link(TEXT, UUID, TEXT, TEXT, JSONB, TIMESTAMP WITH TIME ZONE, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_member_share_links() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION deactivate_member_share_link(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_member_public_share(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION link_member_identity(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION register_legacy_identity_claim(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_member_records() TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_member_profile(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_member_profile(TEXT, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION register_member_device(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION unlink_member_device(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_member_order(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_member_report_unlock(TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_member_share_link(TEXT, UUID, TEXT, TEXT, JSONB, TIMESTAMP WITH TIME ZONE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_member_share_links() TO authenticated;
GRANT EXECUTE ON FUNCTION deactivate_member_share_link(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_member_public_share(TEXT, TEXT) TO anon, authenticated;

COMMENT ON TABLE member_profiles IS '会员中心资料和隐私设置';
COMMENT ON TABLE member_subscriptions IS '会员订阅状态，支付接入前可由后台手动维护';
COMMENT ON TABLE member_orders IS '会员开通和续费订单，支付接入前支持后台手动审核';
COMMENT ON TABLE member_account_events IS '会员账号事件日志';
COMMENT ON TABLE member_identity_links IS '会员账号绑定的匿名测评身份，用于跨设备读取同一账号的云端测评记录';
COMMENT ON TABLE member_identity_claims IS '匿名测评身份的本地密钥证明，只保存 sha256 hash，用于防止仅凭 user_id 绑定他人记录';
COMMENT ON TABLE member_devices IS '会员账号关联设备和匿名身份绑定';
COMMENT ON TABLE member_report_unlocks IS '高级报告、对比报告、导出模板解锁记录';
COMMENT ON TABLE member_share_links IS '私密报告分享链接';
