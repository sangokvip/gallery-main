import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/utils/supabase.js',
    absent: [
      'access_code_hash, hidden_sections',
      '分享 RPC 不可用',
      '兼容读取',
      ".from('member_profiles')\n        .insert",
      ".from('member_profiles')\n      .insert",
      ".from('member_profiles')\n        .update",
      ".from('member_profiles')\n      .update",
      ".from('member_devices')\n      .upsert",
      ".from('member_devices')\n        .upsert",
      ".from('member_devices')\n      .delete",
      ".from('member_devices')\n        .delete",
      ".from('member_account_events')\n      .insert",
      ".from('member_account_events')\n        .insert",
      ".from('member_orders')\n      .insert",
      ".from('member_report_unlocks')\n      .insert",
      ".from('member_share_links')\n      .insert",
      "supabase.rpc('verify_admin_password'"
    ],
    present: [
      'link_member_identity',
      'get_member_records',
      'get_member_profile_bundle',
      'identityLinkError',
      'delete_member_record',
      'update_member_profile',
      'register_member_device',
      'unlink_member_device',
      'create_member_order',
      'create_member_report_unlock',
      'create_member_share_link',
      'deactivate_member_share_link',
      'get_member_public_share',
      'create_member_pair_request',
      'get_member_pair_request',
      'accept_member_pair_request',
      'input_access_code',
      'input_viewer_key',
      'getIdentitySecret',
      'register_legacy_identity_claim',
      'VITE_MEMBER_CENTER_MOCK',
      "['localhost', '127.0.0.1', '::1']",
      'localMemberCenterMockApi',
      'realMemberCenterApi',
      'mock-open-share-token',
      'preview-code',
      'loginAdmin',
      'admin_create_message',
      'admin_create_reply',
      'admin_delete_message',
      'admin_toggle_message_pin',
      'admin_update_message_reaction_count'
    ]
  },
  {
    file: 'src/adminBrutalApi.js',
    present: [
      'VITE_ADMIN_MOCK',
      "['localhost', '127.0.0.1', '::1']",
      'localAdminApi',
      'realAdminApi',
      'mockRecordDetails',
      'Array.from({ length: 108 }'
    ]
  },
  {
    file: 'src/MemberCenterApp.jsx',
    absent: ['hashText', 'access_code_hash'],
    present: ['deleteMemberRecord', '删除后无法恢复', '账号与联系方式']
  },
  {
    file: 'src/ShareReportApp.jsx',
    absent: ['hashText', 'crypto.subtle'],
    present: ['getPublicShare(token, accessCode.trim())']
  },
  {
    file: 'src/adminBrutalApi.js',
    absent: [
      "from('member_profiles')",
      "from('member_orders')",
      "from('member_subscriptions')",
      "from('member_share_links')",
      'verify_admin_password'
    ],
    present: [
      'create_admin_session',
      'change_admin_password',
      'input_session_token_hash',
      'member_admin_overview',
      'member_admin_members',
      'member_admin_record_owners',
      'member_admin_orders',
      'member_admin_approve_order',
      'member_admin_reject_order',
      'member_admin_set_member_password',
      'member_admin_set_member_ban',
      'member_admin_delete_member'
    ]
  },
  {
    file: 'database/create_admin_member_session.sql',
    absent: [
      'GRANT EXECUTE ON FUNCTION verify_admin_password',
      'GRANT EXECUTE ON FUNCTION get_admin_session'
    ],
    present: [
      'SET search_path = public, extensions',
      'admin_login_attempts',
      'failed_count >= 8',
      'change_admin_password(input_session_token_hash TEXT, current_password TEXT, new_password TEXT)',
      'REVOKE EXECUTE ON FUNCTION verify_admin_password(TEXT) FROM PUBLIC, anon, authenticated',
      'REVOKE EXECUTE ON FUNCTION get_admin_session(TEXT) FROM PUBLIC, anon, authenticated',
      'REVOKE EXECUTE ON FUNCTION apply_member_order_approval(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated',
      'REVOKE EXECUTE ON FUNCTION member_admin_set_member_password(TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated',
      'REVOKE EXECUTE ON FUNCTION member_admin_record_owners(TEXT, TEXT[]) FROM PUBLIC, anon, authenticated',
      'REVOKE EXECUTE ON FUNCTION member_admin_set_member_ban(TEXT, UUID, BOOLEAN, TEXT) FROM PUBLIC, anon, authenticated',
      'REVOKE EXECUTE ON FUNCTION member_admin_delete_member(TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated',
      'ALTER TABLE message_replies',
      'GRANT EXECUTE ON FUNCTION change_admin_password(TEXT, TEXT, TEXT) TO anon, authenticated',
      'GRANT EXECUTE ON FUNCTION apply_member_order_approval(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role',
      'GRANT EXECUTE ON FUNCTION admin_create_message(TEXT, TEXT, TEXT) TO anon, authenticated',
      'GRANT EXECUTE ON FUNCTION admin_create_reply(TEXT, UUID, TEXT, TEXT) TO anon, authenticated',
      'GRANT EXECUTE ON FUNCTION admin_delete_message(TEXT, UUID) TO anon, authenticated',
      'GRANT EXECUTE ON FUNCTION admin_toggle_message_pin(TEXT, UUID, BOOLEAN) TO anon, authenticated',
      'GRANT EXECUTE ON FUNCTION admin_update_message_reaction_count(TEXT, UUID, TEXT, INTEGER) TO anon, authenticated',
      'ON CONFLICT (provider, provider_ref) WHERE provider_ref IS NOT NULL DO UPDATE',
      "order_row.status IN ('canceled', 'refunded')",
      "order_row.status = 'approved'",
      'CREATE OR REPLACE FUNCTION apply_member_order_approval',
      "'admin_order_approved'"
    ]
  },
  {
    file: 'database/create_member_center_tables.sql',
    absent: [
      'CREATE POLICY "member_profiles_owner_insert"',
      'CREATE POLICY "member_profiles_owner_update"',
      'CREATE POLICY "member_devices_owner_insert"',
      'CREATE POLICY "member_devices_owner_update"',
      'CREATE POLICY "member_account_events_owner_insert"',
      'CREATE POLICY "member_identity_links_owner_insert"',
      'CREATE POLICY "member_identity_links_owner_update"',
      'CREATE POLICY "member_identity_links_owner_delete"',
      'CREATE POLICY "member_identity_claims_no_read"',
      'CREATE POLICY "member_identity_claims_no_insert"',
      'CREATE POLICY "member_share_links_owner_read"',
      'CREATE POLICY "member_orders_owner_insert"',
      'CREATE POLICY "member_report_unlocks_owner_insert"',
      'CREATE POLICY "member_share_links_owner_insert"',
      'CREATE POLICY "member_share_links_owner_update"'
    ],
    present: [
      'DROP POLICY IF EXISTS "member_profiles_owner_insert"',
      'DROP POLICY IF EXISTS "member_profiles_owner_update"',
      'DROP POLICY IF EXISTS "member_devices_owner_insert"',
      'DROP POLICY IF EXISTS "member_devices_owner_update"',
      'DROP POLICY IF EXISTS "member_account_events_owner_insert"',
      'DROP POLICY IF EXISTS "member_identity_links_owner_insert"',
      'DROP POLICY IF EXISTS "member_identity_links_owner_update"',
      'DROP POLICY IF EXISTS "member_identity_links_owner_delete"',
      'DROP POLICY IF EXISTS "member_identity_claims_no_read"',
      'DROP POLICY IF EXISTS "member_identity_claims_no_insert"',
      'member_identity_claims',
      'member_login_names',
      'gender_identity',
      'bdsm_orientation',
      'normalize_member_auth_user_metadata',
      'aaa_member_auth_user_metadata_before_write',
      'CREATE OR REPLACE FUNCTION create_user_settings',
      'CREATE OR REPLACE FUNCTION handle_new_user',
      'PERFORM create_user_settings(NEW.id, fallback_name)',
      'ON CONFLICT DO NOTHING',
      'reserve_member_login_name',
      'get_member_login_email',
      'register_legacy_identity_claim',
      'claim_secret_hash',
      'SET search_path = public, extensions',
      "digest(clean_claim_secret, 'sha256')",
      'DROP FUNCTION IF EXISTS link_member_identity(TEXT, TEXT)',
      'DROP FUNCTION IF EXISTS get_or_create_member_profile(TEXT, TEXT)',
      'DROP FUNCTION IF EXISTS register_member_device(TEXT, TEXT, TEXT)',
      'DROP POLICY IF EXISTS "member_share_links_owner_read"',
      'DROP POLICY IF EXISTS "member_share_links_public_read_active"',
      'DROP POLICY IF EXISTS "member_orders_owner_insert"',
      'DROP POLICY IF EXISTS "member_report_unlocks_owner_insert"',
      'DROP POLICY IF EXISTS "member_share_links_owner_insert"',
      'DROP POLICY IF EXISTS "member_share_links_owner_update"',
      'idx_member_subscriptions_provider_ref_unique',
      'idx_member_orders_provider_ref_unique',
      'get_or_create_member_profile',
      'link_member_identity',
      'get_member_records',
      'update_member_profile',
      'register_member_device',
      'unlink_member_device',
      'create_member_order',
      'create_member_report_unlock',
      'create_member_share_link',
      'get_member_share_links',
      'deactivate_member_share_link',
      'get_member_public_share',
      "crypt(input_access_code, link_row.access_code_hash)"
    ]
  },
  {
    file: 'database/member_center_refinements_2026_06_06.sql',
    present: [
      'member_share_link_views',
      'member_pair_requests',
      'member_pair_reports',
      'ON DELETE SET NULL',
      'get_member_profile_bundle',
      'identityLinkError',
      'delete_member_record',
      'get_member_public_share',
      'input_viewer_key',
      'visitor_key_hash',
      'create_member_pair_request',
      'get_member_pair_request',
      'accept_member_pair_request',
      'REVOKE SELECT, INSERT, UPDATE, DELETE ON member_share_link_views FROM anon, authenticated',
      'REVOKE EXECUTE ON FUNCTION delete_member_record(UUID) FROM PUBLIC, anon, authenticated',
      'GRANT EXECUTE ON FUNCTION get_member_profile_bundle(TEXT, TEXT, TEXT) TO authenticated',
      'GRANT EXECUTE ON FUNCTION delete_member_record(UUID) TO authenticated',
      'GRANT EXECUTE ON FUNCTION get_member_public_share(TEXT, TEXT, TEXT) TO anon, authenticated'
    ]
  },
  {
    file: 'database/member_center_deployment_check.sql',
    present: [
      'member_share_links_no_public_select_policy',
      'member_share_links_no_owner_read_policy',
      'member_profiles_no_owner_insert_policy',
      'member_profiles_no_owner_update_policy',
      'member_devices_no_owner_insert_policy',
      'member_devices_no_owner_update_policy',
      'member_devices_delete_not_granted',
      'member_account_events_no_owner_insert_policy',
      'member_identity_links_no_owner_insert_policy',
      'member_identity_links_no_owner_update_policy',
      'member_identity_links_no_owner_delete_policy',
      'member_identity_links_write_not_granted',
      'delete_member_record_not_executable_by_anon',
      'member_identity_claims_not_selectable',
      'member_login_names_not_selectable',
      'auth_user_metadata_normalizer_trigger_exists',
      'legacy_handle_new_user_no_new_username',
      'legacy_create_user_settings_sets_required_defaults',
      'old_link_member_identity_signature_removed',
      'old_get_or_create_member_profile_signature_removed',
      'old_register_member_device_signature_removed',
      'member_orders_no_owner_insert_policy',
      'member_report_unlocks_no_owner_insert_policy',
      'member_share_links_no_owner_insert_policy',
      'member_share_links_no_owner_update_policy',
      'member_share_link_views',
      'member_pair_requests',
      'member_pair_reports',
      'verify_admin_password_not_executable_by_anon',
      'get_admin_session_not_executable_by_anon',
      'require_admin_not_executable_by_anon',
      'apply_member_order_approval_not_executable_by_anon',
      'admin_message_create_rpc_exists',
      'admin_message_delete_rpc_exists',
      'admin_message_pin_rpc_exists',
      'admin_login_attempts_rls_enabled',
      'member_subscriptions_provider_ref_unique_index',
      'member_orders_provider_ref_unique_index'
    ]
  },
  {
    file: 'database/member_center_e2e_check.sql',
    present: [
      'member_center_e2e_results',
      'set_config',
      'INSERT INTO auth.users',
      'seed_auth_user',
      'INSERT INTO users (id, nickname)',
      'to_regclass(\'public.user_settings\')',
      'seed_legacy_users',
      'get_or_create_member_profile',
      'link_member_identity',
      'register_legacy_identity_claim',
      'get_member_records',
      'update_member_profile',
      'register_member_device',
      'create_member_order',
      'apply_member_order_approval',
      'create_member_report_unlock',
      'create_member_share_link',
      'get_member_share_links',
      'get_member_public_share',
      'deactivate_member_share_link',
      'unlink_member_device',
      'access_code_hash',
      'DELETE FROM auth.users WHERE id = test_account_id',
      'DELETE FROM users WHERE id IN (test_legacy_id, test_second_legacy_id)',
      'cleanup'
    ]
  },
  {
    file: 'database/member_center_predeploy_check.sql',
    present: [
      'member_center_predeploy_results',
      'required_base_table',
      'duplicate_guard',
      'member_subscriptions_provider_ref_unique',
      'member_orders_provider_ref_unique',
      'member_share_links_share_token_unique',
      'pgcrypto_available'
    ]
  },
  {
    file: 'scripts/prepare-member-deployment.mjs',
    absent: [
      "'database/member_center_e2e_check.sql'"
    ],
    present: [
      'database/member_center_predeploy_check.sql',
      'database/create_member_center_tables.sql',
      'database/create_admin_member_session.sql',
      'database/member_center_refinements_2026_06_06.sql',
      'database/member_center_deployment_check.sql',
      'Run database/member_center_e2e_check.sql separately after deployment',
      'member_center_full_deploy.sql',
      'sha256'
    ]
  },
  {
    file: 'scripts/verify-member-center-authenticated.mjs',
    present: [
      'VITE_MEMBER_CENTER_MOCK',
      'member_preview',
      '账号与联系方式',
      '查看明细',
      '评分数量趋势',
      '测评记录库',
      'scrollWidth',
      'recharts-wrapper'
    ]
  },
  {
    file: 'scripts/verify-admin-authenticated.mjs',
    present: [
      'VITE_ADMIN_MOCK',
      '后台快捷跳转',
      '108 项',
      '跳转页码',
      'mock-record-021',
      '会员管理',
      'scrollWidth'
    ]
  },
  {
    file: 'scripts/verify-share-report.mjs',
    present: [
      'VITE_MEMBER_CENTER_MOCK',
      'mock-share-token',
      'wrong-code',
      'preview-code',
      '分享者已隐藏敏感明细项',
      'mock-open-share-token',
      '^SSS \\(\\d+\\)$',
      'scrollWidth'
    ]
  },
  {
    file: 'scripts/verify-member-production.mjs',
    present: [
      'authenticatedOnlyRpc',
      'adminTokenRpc',
      'forbiddenAnonRpc',
      'member_account_events',
      'member_identity_links',
      'member_identity_claims',
      'link_member_identity',
      'register_legacy_identity_claim',
      'get_member_records',
      'get_or_create_member_profile',
      'create_member_share_link',
      'member_admin_overview',
      'member_admin_set_member_password',
      'member_admin_record_owners',
      'member_admin_set_member_ban',
      'member_admin_delete_member',
      'admin_update_message_reaction_count',
      'authenticated_only',
      'session_guarded',
      'not_callable_by_anon',
      'isPrivilegeFailure',
      'isSessionGuardFailure',
      'MEMBER_WEBHOOK_SECRET',
      'hmacSha256',
      'signed_probe',
      '--require-webhook-secret'
    ]
  },
  {
    file: 'scripts/verify-member-predeploy.mjs',
    present: [
      'prepare:member-deployment',
      'verify:member-security',
      'verify:member-center',
      'verify:member-auth',
      'verify:admin-auth',
      'verify:share-report',
      'verify:payment-webhook',
      'verify:member-production',
      'verify:site-production',
      'git',
      'diff',
      '--check',
      'database/member_center_full_deploy.sql',
      'must not bundle member_center_e2e_check.sql',
      'sha256',
      'verifyNoResidualServers',
      'worklogs json parse passed'
    ]
  },
  {
    file: 'supabase/functions/member-payment-webhook/index.ts',
    present: [
      'handlePaymentWebhookContract',
      'apply_member_order_approval',
      "input_event_type: 'payment_webhook_approved'",
      'input_provider_ref'
    ]
  },
  {
    file: 'supabase/functions/member-payment-webhook/contract.mjs',
    absent: ['signature !== expected'],
    present: [
      'constantTimeEqual',
      'hmacSha256',
      'invalid_signature',
      'invalid_json',
      'missing_order_reference',
      'amount_mismatch',
      'currency_mismatch',
      'order_not_found',
      'approveOrder'
    ]
  },
  {
    file: 'scripts/verify-payment-webhook-contract.mjs',
    present: [
      'invalid_signature',
      'invalid_json',
      'missing_order_reference',
      'amount_mismatch',
      'currency_mismatch',
      'payment webhook contract verification passed',
      'provider_ref',
      'approval failed'
    ]
  },
  {
    file: 'scripts/verify-site-production.mjs',
    present: [
      'SITE_URL',
      'PRODUCTION_SITE_URL',
      'share page has noindex',
      'x-frame-options',
      'content-security-policy',
      'robots.txt',
      'sitemap.xml',
      'share_excluded',
      'site production verification passed'
    ]
  },
  {
    file: 'scripts/generate-member-launch-report.mjs',
    present: [
      'docs/launch-reports',
      'verify:member-predeploy',
      'environmentPresence',
      'SUPABASE_URL',
      'SITE_URL',
      'MEMBER_WEBHOOK_SECRET',
      'SUPABASE_SERVICE_ROLE_KEY',
      'gitStatusShort',
      'requiredProductionFollowUps',
      'member launch report written'
    ]
  }
];

const failures = [];

for (const check of checks) {
  const content = readFileSync(check.file, 'utf8');
  for (const value of check.present || []) {
    if (!content.includes(value)) {
      failures.push(`${check.file} missing required text: ${value}`);
    }
  }
  for (const value of check.absent || []) {
    if (content.includes(value)) {
      failures.push(`${check.file} contains forbidden text: ${value}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('member security verification passed');
