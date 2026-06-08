-- Member center deployment check
-- Run after create_member_center_tables.sql and create_admin_member_session.sql.

WITH required_relations(name) AS (
  VALUES
    ('member_profiles'),
    ('member_subscriptions'),
    ('member_orders'),
    ('member_account_events'),
    ('member_identity_links'),
    ('member_identity_claims'),
    ('member_login_names'),
    ('member_devices'),
    ('member_report_unlocks'),
    ('member_share_links'),
    ('member_share_link_views'),
    ('member_pair_requests'),
    ('member_pair_reports'),
    ('admin_sessions'),
    ('admin_login_attempts')
),
required_functions(name) AS (
  VALUES
    ('get_or_create_member_profile'),
    ('get_member_profile_bundle'),
    ('link_member_identity'),
    ('register_legacy_identity_claim'),
    ('normalize_member_auth_user_metadata'),
    ('create_user_settings'),
    ('handle_new_user'),
    ('reserve_member_login_name'),
    ('get_member_login_email'),
    ('get_member_records'),
    ('delete_member_record'),
    ('update_member_profile'),
    ('register_member_device'),
    ('unlink_member_device'),
    ('create_member_order'),
    ('create_member_report_unlock'),
    ('create_member_share_link'),
    ('get_member_share_links'),
    ('deactivate_member_share_link'),
    ('get_member_public_share'),
    ('create_member_pair_request'),
    ('get_member_pair_request'),
    ('accept_member_pair_request'),
    ('create_admin_session'),
    ('change_admin_password'),
    ('get_admin_session'),
    ('require_admin'),
    ('apply_member_order_approval'),
    ('member_admin_overview'),
    ('member_admin_members'),
    ('member_admin_orders'),
    ('member_admin_approve_order'),
    ('member_admin_reject_order'),
    ('member_admin_set_member_password'),
    ('member_admin_set_member_ban'),
    ('member_admin_delete_member'),
    ('admin_create_message'),
    ('admin_create_reply'),
    ('admin_delete_message'),
    ('admin_delete_reply'),
    ('admin_toggle_message_pin'),
    ('admin_update_message_reaction_count')
),
relation_check AS (
  SELECT
    name,
    EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = name
    ) AS ok
  FROM required_relations
),
function_check AS (
  SELECT
    name,
    EXISTS (
      SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = name
    ) AS ok
  FROM required_functions
),
rls_check AS (
  SELECT
    c.relname AS name,
    c.relrowsecurity AS ok
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN (
      'member_profiles',
      'member_subscriptions',
      'member_orders',
      'member_account_events',
      'member_identity_links',
      'member_identity_claims',
      'member_login_names',
      'member_devices',
      'member_report_unlocks',
      'member_share_links',
      'member_share_link_views',
      'member_pair_requests',
      'member_pair_reports',
      'admin_sessions',
      'admin_login_attempts'
    )
),
security_policy_check AS (
  SELECT
    'old_link_member_identity_signature_removed' AS name,
    to_regprocedure('public.link_member_identity(text, text)') IS NULL AS ok
  UNION ALL
  SELECT
    'old_get_or_create_member_profile_signature_removed' AS name,
    to_regprocedure('public.get_or_create_member_profile(text, text)') IS NULL AS ok
  UNION ALL
  SELECT
    'old_register_member_device_signature_removed' AS name,
    to_regprocedure('public.register_member_device(text, text, text)') IS NULL AS ok
  UNION ALL
  SELECT
    'member_identity_claims_no_read_policy' AS name,
    NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'member_identity_claims'
        AND policyname = 'member_identity_claims_no_read'
    ) AS ok
  UNION ALL
  SELECT
    'member_identity_claims_not_selectable' AS name,
    NOT has_table_privilege('authenticated', 'member_identity_claims', 'SELECT')
      AND NOT has_table_privilege('anon', 'member_identity_claims', 'SELECT') AS ok
  UNION ALL
  SELECT
    'member_login_names_not_selectable' AS name,
    NOT has_table_privilege('authenticated', 'member_login_names', 'SELECT')
      AND NOT has_table_privilege('anon', 'member_login_names', 'SELECT') AS ok
  UNION ALL
  SELECT
    'auth_user_metadata_normalizer_trigger_exists' AS name,
    EXISTS (
      SELECT 1
      FROM pg_trigger trigger_row
      JOIN pg_class relation_row ON relation_row.oid = trigger_row.tgrelid
      JOIN pg_namespace namespace_row ON namespace_row.oid = relation_row.relnamespace
      WHERE namespace_row.nspname = 'auth'
        AND relation_row.relname = 'users'
        AND trigger_row.tgname = 'aaa_member_auth_user_metadata_before_write'
        AND NOT trigger_row.tgisinternal
    ) AS ok
  UNION ALL
  SELECT
    'legacy_handle_new_user_no_new_username' AS name,
    NOT EXISTS (
      SELECT 1
      FROM pg_proc proc_row
      JOIN pg_namespace namespace_row ON namespace_row.oid = proc_row.pronamespace
      WHERE namespace_row.nspname = 'public'
        AND proc_row.proname = 'handle_new_user'
        AND pg_get_functiondef(proc_row.oid) ILIKE '%new.username%'
    ) AS ok
  UNION ALL
  SELECT
    'legacy_create_user_settings_sets_required_defaults' AS name,
    EXISTS (
      SELECT 1
      FROM pg_proc proc_row
      JOIN pg_namespace namespace_row ON namespace_row.oid = proc_row.pronamespace
      WHERE namespace_row.nspname = 'public'
        AND proc_row.proname = 'create_user_settings'
        AND pg_get_functiondef(proc_row.oid) ILIKE '%privacy_level%'
        AND pg_get_functiondef(proc_row.oid) ILIKE '%theme%'
        AND pg_get_functiondef(proc_row.oid) ILIKE '%COALESCE(NULLIF(trim(p_display_name)%'
    ) AS ok
  UNION ALL
  SELECT
    'member_identity_links_no_owner_insert_policy' AS name,
    NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'member_identity_links'
        AND policyname = 'member_identity_links_owner_insert'
    ) AS ok
  UNION ALL
  SELECT
    'member_identity_links_no_owner_update_policy' AS name,
    NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'member_identity_links'
        AND policyname = 'member_identity_links_owner_update'
    ) AS ok
  UNION ALL
  SELECT
    'member_identity_links_no_owner_delete_policy' AS name,
    NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'member_identity_links'
        AND policyname = 'member_identity_links_owner_delete'
    ) AS ok
  UNION ALL
  SELECT
    'member_identity_links_write_not_granted' AS name,
    NOT has_table_privilege('authenticated', 'member_identity_links', 'INSERT')
      AND NOT has_table_privilege('authenticated', 'member_identity_links', 'UPDATE')
      AND NOT has_table_privilege('authenticated', 'member_identity_links', 'DELETE') AS ok
  UNION ALL
  SELECT
    'member_profiles_no_owner_insert_policy' AS name,
    NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'member_profiles'
        AND policyname = 'member_profiles_owner_insert'
    ) AS ok
  UNION ALL
  SELECT
    'member_profiles_no_owner_update_policy' AS name,
    NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'member_profiles'
        AND policyname = 'member_profiles_owner_update'
    ) AS ok
  UNION ALL
  SELECT
    'member_profiles_has_ban_fields' AS name,
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'member_profiles'
        AND column_name = 'is_banned'
    ) AS ok
  UNION ALL
  SELECT
    'member_profiles_has_profile_classification_fields' AS name,
    (
      SELECT count(*)
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'member_profiles'
        AND column_name IN ('gender_identity', 'bdsm_orientation')
    ) = 2 AS ok
  UNION ALL
  SELECT
    'member_share_links_no_public_select_policy' AS name,
    NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'member_share_links'
        AND policyname = 'member_share_links_public_read_active'
    ) AS ok
  UNION ALL
  SELECT
    'member_devices_no_owner_insert_policy' AS name,
    NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'member_devices'
        AND policyname = 'member_devices_owner_insert'
    ) AS ok
  UNION ALL
  SELECT
    'member_account_events_no_owner_insert_policy' AS name,
    NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'member_account_events'
        AND policyname = 'member_account_events_owner_insert'
    ) AS ok
  UNION ALL
  SELECT
    'member_devices_no_owner_update_policy' AS name,
    NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'member_devices'
        AND policyname = 'member_devices_owner_update'
    ) AS ok
  UNION ALL
  SELECT
    'member_devices_delete_not_granted' AS name,
    NOT has_table_privilege('authenticated', 'member_devices', 'DELETE') AS ok
  UNION ALL
  SELECT
    'member_share_links_no_owner_read_policy' AS name,
    NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'member_share_links'
        AND policyname = 'member_share_links_owner_read'
    ) AS ok
  UNION ALL
  SELECT
    'member_orders_no_owner_insert_policy' AS name,
    NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'member_orders'
        AND policyname = 'member_orders_owner_insert'
    ) AS ok
  UNION ALL
  SELECT
    'member_report_unlocks_no_owner_insert_policy' AS name,
    NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'member_report_unlocks'
        AND policyname = 'member_report_unlocks_owner_insert'
    ) AS ok
  UNION ALL
  SELECT
    'member_share_links_no_owner_insert_policy' AS name,
    NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'member_share_links'
        AND policyname = 'member_share_links_owner_insert'
    ) AS ok
  UNION ALL
  SELECT
    'member_share_links_no_owner_update_policy' AS name,
    NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'member_share_links'
        AND policyname = 'member_share_links_owner_update'
    ) AS ok
  UNION ALL
  SELECT
    'member_share_links_hash_not_selectable_by_authenticated' AS name,
    NOT has_column_privilege('authenticated', 'member_share_links', 'access_code_hash', 'SELECT') AS ok
  UNION ALL
  SELECT
    'member_share_links_hash_not_selectable_by_anon' AS name,
    NOT has_column_privilege('anon', 'member_share_links', 'access_code_hash', 'SELECT') AS ok
  UNION ALL
  SELECT
    'delete_member_record_not_executable_by_anon' AS name,
    NOT has_function_privilege('anon', 'delete_member_record(uuid)', 'EXECUTE') AS ok
  UNION ALL
  SELECT
    'verify_admin_password_not_executable_by_anon' AS name,
    NOT has_function_privilege('anon', 'verify_admin_password(text)', 'EXECUTE') AS ok
  UNION ALL
  SELECT
    'get_admin_session_not_executable_by_anon' AS name,
    NOT has_function_privilege('anon', 'get_admin_session(text)', 'EXECUTE') AS ok
  UNION ALL
  SELECT
    'require_admin_not_executable_by_anon' AS name,
    NOT has_function_privilege('anon', 'require_admin(text)', 'EXECUTE') AS ok
  UNION ALL
  SELECT
    'apply_member_order_approval_not_executable_by_anon' AS name,
    NOT has_function_privilege('anon', 'apply_member_order_approval(uuid, text, text, text, text)', 'EXECUTE') AS ok
  UNION ALL
  SELECT
    'member_admin_set_member_password_guarded_by_session' AS name,
    has_function_privilege('anon', 'member_admin_set_member_password(text, uuid, text)', 'EXECUTE') AS ok
  UNION ALL
  SELECT
    'member_admin_set_member_ban_guarded_by_session' AS name,
    has_function_privilege('anon', 'member_admin_set_member_ban(text, uuid, boolean, text)', 'EXECUTE') AS ok
  UNION ALL
  SELECT
    'member_admin_delete_member_guarded_by_session' AS name,
    has_function_privilege('anon', 'member_admin_delete_member(text, uuid, text)', 'EXECUTE') AS ok
  UNION ALL
  SELECT
    'admin_message_delete_rpc_exists' AS name,
    has_function_privilege('anon', 'admin_delete_message(text, uuid)', 'EXECUTE') AS ok
  UNION ALL
  SELECT
    'admin_message_create_rpc_exists' AS name,
    has_function_privilege('anon', 'admin_create_message(text, text, text)', 'EXECUTE') AS ok
  UNION ALL
  SELECT
    'admin_message_pin_rpc_exists' AS name,
    has_function_privilege('anon', 'admin_toggle_message_pin(text, uuid, boolean)', 'EXECUTE') AS ok
  UNION ALL
  SELECT
    'admin_login_attempts_rls_enabled' AS name,
    COALESCE((
      SELECT c.relrowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'admin_login_attempts'
    ), false) AS ok
  UNION ALL
  SELECT
    'member_subscriptions_provider_ref_unique_index' AS name,
    EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'member_subscriptions'
        AND indexname = 'idx_member_subscriptions_provider_ref_unique'
    ) AS ok
  UNION ALL
  SELECT
    'member_orders_provider_ref_unique_index' AS name,
    EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'member_orders'
        AND indexname = 'idx_member_orders_provider_ref_unique'
    ) AS ok
)
SELECT 'table' AS check_type, name, ok FROM relation_check
UNION ALL
SELECT 'function' AS check_type, name, ok FROM function_check
UNION ALL
SELECT 'rls' AS check_type, name, ok FROM rls_check
UNION ALL
SELECT 'security' AS check_type, name, ok FROM security_policy_check
ORDER BY check_type, name;
