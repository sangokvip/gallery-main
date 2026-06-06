-- Member center end-to-end database check
-- Run after create_member_center_tables.sql and create_admin_member_session.sql.
-- This script creates temporary test data, validates the member RPC flow, and cleans up.

CREATE TEMP TABLE IF NOT EXISTS member_center_e2e_results (
  step_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  ok BOOLEAN NOT NULL,
  detail TEXT NOT NULL
);

TRUNCATE member_center_e2e_results;

DO $$
DECLARE
  test_account_id UUID := gen_random_uuid();
  test_legacy_id TEXT := 'codex-member-e2e-' || replace(gen_random_uuid()::text, '-', '');
  test_claim_secret TEXT := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  test_second_legacy_id TEXT := 'codex-member-e2e-second-' || replace(gen_random_uuid()::text, '-', '');
  test_second_claim_secret TEXT := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  test_share_token TEXT := 'codex-e2e-' || replace(gen_random_uuid()::text, '-', '');
  test_record_id UUID;
  test_second_record_id UUID;
  test_order_id UUID;
  test_device_id UUID;
  profile_row member_profiles%ROWTYPE;
  device_row member_devices%ROWTYPE;
  order_row member_orders%ROWTYPE;
  unlock_row member_report_unlocks%ROWTYPE;
  approval_result JSONB;
  share_result JSONB;
  share_list JSONB;
  public_gate JSONB;
  public_report JSONB;
  member_records JSONB;
  wrong_claim_failed BOOLEAN := false;
  inactive_failed BOOLEAN := false;
  legacy_id TEXT;
  user_settings_key_column TEXT;
  user_settings_key_type TEXT;
  user_settings_insert_columns TEXT;
  user_settings_insert_values TEXT;
BEGIN
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    test_account_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'codex-member-e2e-' || test_account_id::text || '@example.test',
    '',
    timezone('utc'::text, now()),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{}'::jsonb,
    timezone('utc'::text, now()),
    timezone('utc'::text, now()),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO member_center_e2e_results
  VALUES (
    5,
    'seed_auth_user',
    EXISTS (SELECT 1 FROM auth.users WHERE id = test_account_id),
    'created temporary auth.users row for foreign key checks'
  );

  PERFORM set_config('request.jwt.claim.sub', test_account_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  INSERT INTO users (id, nickname)
  VALUES
    (test_legacy_id, 'Codex E2E User'),
    (test_second_legacy_id, 'Codex E2E Second User')
  ON CONFLICT (id) DO UPDATE
  SET nickname = excluded.nickname;

  IF to_regclass('public.user_settings') IS NOT NULL THEN
    SELECT column_name, udt_name
    INTO user_settings_key_column, user_settings_key_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_settings'
      AND column_name IN ('user_id', 'user_id_text', 'legacy_user_id_text', 'account_id', 'id')
    ORDER BY CASE column_name
      WHEN 'user_id' THEN 1
      WHEN 'user_id_text' THEN 2
      WHEN 'legacy_user_id_text' THEN 3
      WHEN 'account_id' THEN 4
      WHEN 'id' THEN 5
      ELSE 99
    END
    LIMIT 1;

    IF user_settings_key_column IS NOT NULL THEN
      FOREACH legacy_id IN ARRAY ARRAY[test_legacy_id, test_second_legacy_id]
      LOOP
        SELECT
          string_agg(format('%I', column_name), ', ' ORDER BY ordinal_position),
          string_agg(
            CASE
              WHEN column_name = user_settings_key_column AND udt_name = 'uuid' THEN '$2'
              WHEN column_name = user_settings_key_column THEN '$1'
              WHEN column_name IN ('account_id', 'member_id', 'auth_user_id') AND udt_name = 'uuid' THEN '$2'
              WHEN column_name IN ('user_id', 'user_id_text', 'legacy_user_id_text') THEN '$1'
              WHEN column_name IN ('display_name', 'nickname', 'name') THEN quote_literal('Codex E2E User')
              WHEN data_type IN ('timestamp with time zone', 'timestamp without time zone') THEN 'timezone(''utc''::text, now())'
              WHEN data_type = 'boolean' THEN 'false'
              WHEN udt_name = 'jsonb' THEN '''{}''::jsonb'
              WHEN udt_name = 'json' THEN '''{}''::json'
              WHEN udt_name = 'uuid' THEN 'gen_random_uuid()'
              WHEN data_type IN ('integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision') THEN '0'
              ELSE quote_literal('')
            END,
            ', ' ORDER BY ordinal_position
          )
        INTO user_settings_insert_columns, user_settings_insert_values
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_settings'
          AND (
            column_name = user_settings_key_column
            OR column_name IN ('display_name', 'nickname', 'name')
            OR (is_nullable = 'NO' AND column_default IS NULL)
          );

        EXECUTE format(
          'INSERT INTO user_settings (%s) VALUES (%s) ON CONFLICT DO NOTHING',
          user_settings_insert_columns,
          user_settings_insert_values
        )
        USING legacy_id, test_account_id;
      END LOOP;
    END IF;
  END IF;

  INSERT INTO member_center_e2e_results
  VALUES (
    8,
    'seed_legacy_users',
    EXISTS (SELECT 1 FROM users WHERE id = test_legacy_id)
      AND EXISTS (SELECT 1 FROM users WHERE id = test_second_legacy_id),
    'created temporary legacy users and optional user_settings rows for existing production triggers'
  );

  INSERT INTO test_records (user_id_text, test_type, report_data, created_at)
  VALUES (
    test_legacy_id,
    'female',
    jsonb_build_object('completedItems', 3, 'totalItems', 3),
    timezone('utc'::text, now())
  )
  RETURNING id INTO test_record_id;

  INSERT INTO test_results (record_id, category, item, rating, created_at)
  VALUES
    (test_record_id, 'SSS 控制', '边界确认', 'SSS', timezone('utc'::text, now())),
    (test_record_id, 'SS 感官', '沟通偏好', 'SS', timezone('utc'::text, now())),
    (test_record_id, 'N 禁区', '明确拒绝', 'N', timezone('utc'::text, now()));

  INSERT INTO member_center_e2e_results
  VALUES (10, 'seed_test_record', test_record_id IS NOT NULL, 'created temporary test_records/test_results rows');

  PERFORM register_legacy_identity_claim(test_legacy_id, test_claim_secret);

  SELECT * INTO profile_row
  FROM get_or_create_member_profile(test_legacy_id, 'Codex E2E Member', test_claim_secret);

  INSERT INTO member_center_e2e_results
  VALUES (
    20,
    'get_or_create_member_profile',
    profile_row.account_id = test_account_id
      AND profile_row.legacy_user_id_text = test_legacy_id
      AND profile_row.membership_tier = 'free',
    'profile created and bound to simulated auth.uid()'
  );

  SELECT * INTO profile_row
  FROM update_member_profile(
    'Codex E2E Updated',
    '{"hideUserId": true, "hideSensitiveItems": true, "allowPrivateShare": true}'::jsonb,
    '{"monthlySummary": true, "trendReminder": true}'::jsonb
  );

  INSERT INTO member_center_e2e_results
  VALUES (
    30,
    'update_member_profile',
    profile_row.display_name = 'Codex E2E Updated'
      AND profile_row.notification_settings->>'trendReminder' = 'true',
    'profile display name and notification settings updated'
  );

  INSERT INTO test_records (user_id_text, test_type, report_data, created_at)
  VALUES (
    test_second_legacy_id,
    'male',
    jsonb_build_object('completedItems', 1, 'totalItems', 1),
    timezone('utc'::text, now()) + interval '1 minute'
  )
  RETURNING id INTO test_second_record_id;

  INSERT INTO test_results (record_id, category, item, rating, created_at)
  VALUES (test_second_record_id, 'SSS 主导', '跨设备记录', 'SSS', timezone('utc'::text, now()));

  PERFORM register_legacy_identity_claim(test_second_legacy_id, test_second_claim_secret);
  BEGIN
    PERFORM link_member_identity(test_second_legacy_id, 'wrong-secret-for-e2e', 'Wrong Claim');
  EXCEPTION WHEN OTHERS THEN
    wrong_claim_failed := true;
  END;

  INSERT INTO member_center_e2e_results
  VALUES (
    34,
    'link_member_identity_rejects_wrong_secret',
    wrong_claim_failed,
    'member identity cannot be linked without the local identity secret'
  );

  PERFORM link_member_identity(test_second_legacy_id, test_second_claim_secret, 'Codex E2E Second Device');
  member_records := get_member_records();

  INSERT INTO member_center_e2e_results
  VALUES (
    35,
    'get_member_records_cross_identity',
    jsonb_path_exists(member_records, ('$[*] ? (@.id == "' || test_record_id || '")')::jsonpath)
      AND jsonb_path_exists(member_records, ('$[*] ? (@.id == "' || test_second_record_id || '")')::jsonpath),
    'member account reads records from all linked legacy identities'
  );

  SELECT * INTO device_row
  FROM register_member_device(test_legacy_id, test_claim_secret, 'Codex E2E Device', repeat('a', 64));
  test_device_id := device_row.id;

  INSERT INTO member_center_e2e_results
  VALUES (
    40,
    'register_member_device',
    device_row.account_id = test_account_id
      AND device_row.user_agent_hash = repeat('a', 64),
    'device registered for simulated member'
  );

  SELECT * INTO order_row
  FROM create_member_order(test_legacy_id, 'basic_monthly', 'codex-e2e@example.test', 'database e2e check');
  test_order_id := order_row.id;

  INSERT INTO member_center_e2e_results
  VALUES (
    50,
    'create_member_order',
    order_row.status = 'pending'
      AND order_row.amount_cents = 1900
      AND order_row.account_id = test_account_id,
    'member pending order created'
  );

  approval_result := apply_member_order_approval(
    test_order_id,
    'codex_e2e',
    test_order_id::text,
    'database e2e approval',
    'codex_e2e_order_approved'
  );

  INSERT INTO member_center_e2e_results
  VALUES (
    60,
    'apply_member_order_approval',
    approval_result->>'ok' = 'true'
      AND approval_result->>'tier' IN ('basic', 'premium')
      AND EXISTS (
        SELECT 1
        FROM member_profiles
        WHERE account_id = test_account_id
          AND membership_tier IN ('basic', 'premium')
      )
      AND EXISTS (
        SELECT 1
        FROM member_subscriptions
        WHERE account_id = test_account_id
          AND status = 'active'
          AND provider = 'codex_e2e'
          AND provider_ref = test_order_id::text
      ),
    'order approval updated profile tier and active subscription'
  );

  SELECT * INTO unlock_row
  FROM create_member_report_unlock(test_legacy_id, test_record_id, 'advanced_report');

  INSERT INTO member_center_e2e_results
  VALUES (
    70,
    'create_member_report_unlock',
    unlock_row.account_id = test_account_id
      AND unlock_row.record_id = test_record_id
      AND unlock_row.unlock_type = 'advanced_report',
    'member account unlocked advanced report for owned record'
  );

  share_result := create_member_share_link(
    test_legacy_id,
    test_record_id,
    'Codex E2E Share',
    'correct-code',
    '["items"]'::jsonb,
    timezone('utc'::text, now()) + interval '1 day',
    test_share_token
  );

  INSERT INTO member_center_e2e_results
  VALUES (
    80,
    'create_member_share_link',
    share_result->>'share_token' = test_share_token
      AND NOT (share_result ? 'access_code_hash'),
    'share link created without exposing access_code_hash'
  );

  share_list := get_member_share_links();

  INSERT INTO member_center_e2e_results
  VALUES (
    90,
    'get_member_share_links',
    jsonb_path_exists(share_list, ('$[*] ? (@.share_token == "' || test_share_token || '")')::jsonpath)
      AND position('access_code_hash' in share_list::text) = 0,
    'member share list includes token and does not expose access hash'
  );

  public_gate := get_member_public_share(test_share_token, NULL);

  INSERT INTO member_center_e2e_results
  VALUES (
    100,
    'get_member_public_share_requires_password',
    public_gate->>'requiresAccessCode' = 'true'
      AND NOT (public_gate ? 'record'),
    'public share requires access code before showing record'
  );

  public_gate := get_member_public_share(test_share_token, 'wrong-code');

  INSERT INTO member_center_e2e_results
  VALUES (
    110,
    'get_member_public_share_rejects_wrong_password',
    public_gate->>'requiresAccessCode' = 'true'
      AND NOT (public_gate ? 'record'),
    'wrong access code keeps report hidden'
  );

  public_report := get_member_public_share(test_share_token, 'correct-code');

  INSERT INTO member_center_e2e_results
  VALUES (
    120,
    'get_member_public_share_accepts_password',
    public_report->>'requiresAccessCode' = 'false'
      AND public_report->'record'->>'id' = test_record_id::text
      AND jsonb_array_length(public_report->'record'->'details') = 3
      AND (public_report->'link'->'hidden_sections') ? 'items',
    'correct access code returns report details and hidden section metadata'
  );

  INSERT INTO member_center_e2e_results
  VALUES (
    130,
    'deactivate_member_share_link',
    (deactivate_member_share_link((share_result->>'id')::uuid)->>'is_active') = 'false',
    'member can deactivate own share link'
  );

  BEGIN
    PERFORM get_member_public_share(test_share_token, 'correct-code');
  EXCEPTION WHEN OTHERS THEN
    inactive_failed := true;
  END;

  INSERT INTO member_center_e2e_results
  VALUES (
    140,
    'deactivated_share_is_not_public',
    inactive_failed,
    'deactivated share cannot be read publicly'
  );

  INSERT INTO member_center_e2e_results
  VALUES (
    150,
    'unlink_member_device',
    unlink_member_device(test_device_id),
    'member can unlink own device'
  );

  DELETE FROM member_share_links WHERE account_id = test_account_id;
  DELETE FROM member_report_unlocks WHERE account_id = test_account_id;
  DELETE FROM member_subscriptions WHERE account_id = test_account_id;
  DELETE FROM member_orders WHERE account_id = test_account_id;
  DELETE FROM member_devices WHERE account_id = test_account_id;
  DELETE FROM member_identity_links WHERE account_id = test_account_id;
  DELETE FROM member_account_events WHERE account_id = test_account_id;
  DELETE FROM member_profiles WHERE account_id = test_account_id;
  DELETE FROM member_identity_claims WHERE legacy_user_id_text IN (test_legacy_id, test_second_legacy_id);
  DELETE FROM test_results WHERE record_id = test_record_id;
  DELETE FROM test_records WHERE id = test_record_id;
  DELETE FROM test_results WHERE record_id = test_second_record_id;
  DELETE FROM test_records WHERE id = test_second_record_id;
  IF to_regclass('public.user_settings') IS NOT NULL AND user_settings_key_column IS NOT NULL THEN
    IF user_settings_key_type = 'uuid' THEN
      EXECUTE format('DELETE FROM user_settings WHERE %I = $1', user_settings_key_column)
      USING test_account_id;
    ELSE
      EXECUTE format('DELETE FROM user_settings WHERE %I = ANY($1::text[])', user_settings_key_column)
      USING ARRAY[test_legacy_id, test_second_legacy_id];
    END IF;
  END IF;
  DELETE FROM users WHERE id IN (test_legacy_id, test_second_legacy_id);
  DELETE FROM auth.users WHERE id = test_account_id;

  INSERT INTO member_center_e2e_results
  VALUES (
    160,
    'cleanup',
    NOT EXISTS (SELECT 1 FROM member_profiles WHERE account_id = test_account_id)
      AND NOT EXISTS (SELECT 1 FROM test_records WHERE id = test_record_id)
      AND NOT EXISTS (SELECT 1 FROM test_records WHERE id = test_second_record_id)
      AND NOT EXISTS (SELECT 1 FROM users WHERE id IN (test_legacy_id, test_second_legacy_id))
      AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = test_account_id),
    'temporary member and test record data removed'
  );
EXCEPTION WHEN OTHERS THEN
  DELETE FROM member_share_links WHERE account_id = test_account_id;
  DELETE FROM member_report_unlocks WHERE account_id = test_account_id;
  DELETE FROM member_subscriptions WHERE account_id = test_account_id;
  DELETE FROM member_orders WHERE account_id = test_account_id;
  DELETE FROM member_devices WHERE account_id = test_account_id;
  DELETE FROM member_identity_links WHERE account_id = test_account_id;
  DELETE FROM member_account_events WHERE account_id = test_account_id;
  DELETE FROM member_profiles WHERE account_id = test_account_id;
  DELETE FROM member_identity_claims WHERE legacy_user_id_text IN (test_legacy_id, test_second_legacy_id);
  IF test_record_id IS NOT NULL THEN
    DELETE FROM test_results WHERE record_id = test_record_id;
    DELETE FROM test_records WHERE id = test_record_id;
  END IF;
  IF test_second_record_id IS NOT NULL THEN
    DELETE FROM test_results WHERE record_id = test_second_record_id;
    DELETE FROM test_records WHERE id = test_second_record_id;
  END IF;
  IF to_regclass('public.user_settings') IS NOT NULL AND user_settings_key_column IS NOT NULL THEN
    IF user_settings_key_type = 'uuid' THEN
      EXECUTE format('DELETE FROM user_settings WHERE %I = $1', user_settings_key_column)
      USING test_account_id;
    ELSE
      EXECUTE format('DELETE FROM user_settings WHERE %I = ANY($1::text[])', user_settings_key_column)
      USING ARRAY[test_legacy_id, test_second_legacy_id];
    END IF;
  END IF;
  DELETE FROM users WHERE id IN (test_legacy_id, test_second_legacy_id);
  DELETE FROM auth.users WHERE id = test_account_id;

  INSERT INTO member_center_e2e_results
  VALUES (999, 'unexpected_error', false, SQLERRM);
END;
$$;

SELECT step_order, name, ok, detail
FROM member_center_e2e_results
ORDER BY step_order;
