import { hmacSha256 } from '../supabase/functions/member-payment-webhook/contract.mjs';

const publicRpc = [
  {
    name: 'get_member_public_share',
    body: { input_token: 'codex-production-check-missing-token', input_access_code: null },
    expect: 'callable-error'
  },
  {
    name: 'create_admin_session',
    body: { input_username: '', input_password: '', input_session_token_hash: null },
    expect: 'callable-error'
  },
  {
    name: 'register_legacy_identity_claim',
    body: { input_legacy_user_id_text: 'codex-production-check', input_claim_secret: '0'.repeat(64) },
    expect: 'callable-error'
  }
];

const authenticatedOnlyRpc = [
  {
    name: 'get_or_create_member_profile',
    body: { input_legacy_user_id_text: 'codex-production-check', input_display_name: 'Codex Production Check', input_claim_secret: '0'.repeat(64) }
  },
  {
    name: 'link_member_identity',
    body: { input_legacy_user_id_text: 'codex-production-check', input_claim_secret: '0'.repeat(64), input_display_label: 'Codex Production Check' }
  },
  {
    name: 'get_member_records',
    body: {}
  },
  {
    name: 'delete_member_record',
    body: { input_record_id: '00000000-0000-0000-0000-000000000000' }
  },
  {
    name: 'update_member_profile',
    body: { input_display_name: 'Codex Production Check', input_privacy_settings: {}, input_notification_settings: {} }
  },
  {
    name: 'register_member_device',
    body: {
      input_legacy_user_id_text: 'codex-production-check',
      input_claim_secret: '0'.repeat(64),
      input_device_label: 'Codex Production Check',
      input_user_agent_hash: '0'.repeat(64)
    }
  },
  {
    name: 'unlink_member_device',
    body: { input_device_id: '00000000-0000-0000-0000-000000000000' }
  },
  {
    name: 'create_member_order',
    body: {
      input_legacy_user_id_text: 'codex-production-check',
      input_plan_code: 'premium_monthly',
      input_contact_email: 'codex-production-check@example.test',
      input_contact_note: 'production check'
    }
  },
  {
    name: 'create_member_report_unlock',
    body: {
      input_legacy_user_id_text: 'codex-production-check',
      input_record_id: '00000000-0000-0000-0000-000000000000',
      input_unlock_type: 'advanced_report'
    }
  },
  {
    name: 'create_member_share_link',
    body: {
      input_legacy_user_id_text: 'codex-production-check',
      input_record_id: '00000000-0000-0000-0000-000000000000',
      input_title: 'Codex Production Check',
      input_access_code: null,
      input_hidden_sections: [],
      input_expires_at: null,
      input_share_token: 'codex-production-check'
    }
  },
  {
    name: 'get_member_share_links',
    body: {}
  },
  {
    name: 'deactivate_member_share_link',
    body: { input_share_id: '00000000-0000-0000-0000-000000000000' }
  }
];

const adminTokenRpc = [
  {
    name: 'change_admin_password',
    body: {
      input_session_token_hash: '0'.repeat(64),
      current_password: 'codex-production-check',
      new_password: 'codex-production-check-new'
    }
  },
  {
    name: 'member_admin_overview',
    body: { input_session_token_hash: '0'.repeat(64) }
  },
  {
    name: 'member_admin_members',
    body: { input_session_token_hash: '0'.repeat(64), input_limit: 1, input_offset: 0 }
  },
  {
    name: 'member_admin_orders',
    body: { input_session_token_hash: '0'.repeat(64), input_limit: 1 }
  },
  {
    name: 'member_admin_approve_order',
    body: {
      input_session_token_hash: '0'.repeat(64),
      input_order_id: '00000000-0000-0000-0000-000000000000'
    }
  },
  {
    name: 'member_admin_reject_order',
    body: {
      input_session_token_hash: '0'.repeat(64),
      input_order_id: '00000000-0000-0000-0000-000000000000',
      input_note: 'production check'
    }
  },
  {
    name: 'admin_create_message',
    body: {
      input_session_token_hash: '0'.repeat(64),
      input_text: 'production check',
      input_original_text: 'production check'
    }
  },
  {
    name: 'admin_create_reply',
    body: {
      input_session_token_hash: '0'.repeat(64),
      input_message_id: '00000000-0000-0000-0000-000000000000',
      input_text: 'production check',
      input_original_text: 'production check'
    }
  },
  {
    name: 'admin_delete_message',
    body: {
      input_session_token_hash: '0'.repeat(64),
      input_message_id: '00000000-0000-0000-0000-000000000000'
    }
  },
  {
    name: 'admin_delete_reply',
    body: {
      input_session_token_hash: '0'.repeat(64),
      input_reply_id: '00000000-0000-0000-0000-000000000000'
    }
  },
  {
    name: 'admin_toggle_message_pin',
    body: {
      input_session_token_hash: '0'.repeat(64),
      input_message_id: '00000000-0000-0000-0000-000000000000',
      input_is_pinned: false
    }
  },
  {
    name: 'admin_update_message_reaction_count',
    body: {
      input_session_token_hash: '0'.repeat(64),
      input_message_id: '00000000-0000-0000-0000-000000000000',
      input_reaction_type: 'likes',
      input_count: 0
    }
  }
];

const forbiddenAnonRpc = [
  {
    name: 'verify_admin_password',
    body: { input_password: 'codex-production-check' }
  },
  {
    name: 'get_admin_session',
    body: { input_session_token_hash: '0'.repeat(64) }
  },
  {
    name: 'require_admin',
    body: { input_session_token_hash: '0'.repeat(64) }
  },
  {
    name: 'apply_member_order_approval',
    body: {
      input_order_id: '00000000-0000-0000-0000-000000000000',
      input_provider: 'production_check',
      input_provider_ref: 'production_check',
      input_admin_note: 'production_check',
      input_event_type: 'production_check'
    }
  }
];

const requiredTables = [
  'member_profiles',
  'member_subscriptions',
  'member_orders',
  'member_account_events',
  'member_identity_links',
  'member_identity_claims',
  'member_devices',
  'member_report_unlocks',
  'member_share_links',
  'admin_sessions',
  'admin_login_attempts'
];

function getConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const webhookSecret = process.env.MEMBER_WEBHOOK_SECRET;
  return { url: url?.replace(/\/$/, ''), anonKey, webhookSecret };
}

function isMissingRelation(payload) {
  const text = JSON.stringify(payload || {});
  return text.includes('42P01') || text.includes('does not exist') || text.includes('not exist');
}

function isMissingRpc(payload, status) {
  const text = JSON.stringify(payload || {});
  return status === 404 || text.includes('PGRST202') || text.includes('Could not find the function');
}

function isPrivilegeFailure(payload, status) {
  const text = JSON.stringify(payload || {}).toLowerCase();
  return status === 401
    || status === 403
    || text.includes('permission denied')
    || text.includes('not authorized')
    || text.includes('insufficient privilege')
    || text.includes('请先登录');
}

function isSessionGuardFailure(payload, status) {
  const text = JSON.stringify(payload || {}).toLowerCase();
  return !isMissingRpc(payload, status)
    && ![200, 201, 204].includes(status)
    && (
      text.includes('管理员会话')
      || text.includes('admin session')
      || text.includes('invalid')
      || text.includes('expired')
      || text.includes('无效')
      || text.includes('过期')
      || text.includes('权限')
    );
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 200) };
  }
}

async function request(url, anonKey, path, options = {}) {
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  return { response, payload: await readJson(response) };
}

function record(results, name, ok, detail) {
  results.push({ name, ok, detail });
}

async function verifyTables(url, anonKey, results) {
  for (const table of requiredTables) {
    const { response, payload } = await request(url, anonKey, `/rest/v1/${table}?select=*&limit=1`);
    if (isMissingRelation(payload)) {
      record(results, `table:${table}`, false, '表不存在或未暴露到 public schema');
      continue;
    }
    record(results, `table:${table}`, response.status !== 404, `HTTP ${response.status}`);
  }

  const shareHash = await request(url, anonKey, '/rest/v1/member_share_links?select=access_code_hash&limit=1');
  const hashReadable = shareHash.response.ok && Array.isArray(shareHash.payload);
  record(
    results,
    'policy:member_share_links.access_code_hash_not_readable_by_anon',
    !hashReadable && !isMissingRelation(shareHash.payload),
    hashReadable ? 'anon 可以读取 access_code_hash' : `HTTP ${shareHash.response.status}`
  );
}

async function verifyRpc(url, anonKey, results) {
  for (const item of publicRpc) {
    const { response, payload } = await request(url, anonKey, `/rest/v1/rpc/${item.name}`, {
      method: 'POST',
      body: JSON.stringify(item.body)
    });

    const ok = !isMissingRpc(payload, response.status);
    record(results, `rpc:${item.name}:exists`, ok, `HTTP ${response.status}`);
  }

  for (const item of authenticatedOnlyRpc) {
    const { response, payload } = await request(url, anonKey, `/rest/v1/rpc/${item.name}`, {
      method: 'POST',
      body: JSON.stringify(item.body)
    });

    const ok = !isMissingRpc(payload, response.status) && isPrivilegeFailure(payload, response.status);
    record(results, `rpc:${item.name}:authenticated_only`, ok, `HTTP ${response.status}`);
  }

  for (const item of adminTokenRpc) {
    const { response, payload } = await request(url, anonKey, `/rest/v1/rpc/${item.name}`, {
      method: 'POST',
      body: JSON.stringify(item.body)
    });

    const ok = isSessionGuardFailure(payload, response.status);
    record(results, `rpc:${item.name}:session_guarded`, ok, `HTTP ${response.status}`);
  }

  for (const item of forbiddenAnonRpc) {
    const { response, payload } = await request(url, anonKey, `/rest/v1/rpc/${item.name}`, {
      method: 'POST',
      body: JSON.stringify(item.body)
    });

    const ok = !response.ok && (isPrivilegeFailure(payload, response.status) || isMissingRpc(payload, response.status));
    record(results, `rpc:${item.name}:not_callable_by_anon`, ok, `HTTP ${response.status}`);
  }
}

async function verifyAuth(url, anonKey, results) {
  const { response } = await request(url, anonKey, '/auth/v1/health');
  record(results, 'auth:health', response.status < 500, `HTTP ${response.status}`);
}

async function verifyEdgeFunction(url, anonKey, webhookSecret, results) {
  const endpoint = `${url}/functions/v1/member-payment-webhook`;
  const response = await fetch(endpoint, {
    method: 'OPTIONS',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`
    }
  });
  record(results, 'edge:member-payment-webhook:deployed', response.ok, `HTTP ${response.status}`);

  if (!webhookSecret) {
    record(
      results,
      'edge:member-payment-webhook:signed_probe',
      true,
      'skipped: set MEMBER_WEBHOOK_SECRET to verify signature path'
    );
    return;
  }

  const body = JSON.stringify({
    provider: 'codex_production_check',
    provider_ref: `codex-production-check-${Date.now()}`,
    status: 'paid',
    amount_cents: 1,
    currency: 'CNY'
  });
  const signature = await hmacSha256(webhookSecret, body);
  const signedResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'x-member-signature': signature
    },
    body
  });
  const payload = await readJson(signedResponse);
  const payloadText = JSON.stringify(payload || {});
  const ok = signedResponse.status === 404 && payloadText.includes('order_not_found');
  record(
    results,
    'edge:member-payment-webhook:signed_probe',
    ok,
    ok ? 'signed request accepted and missing test order rejected' : `HTTP ${signedResponse.status}`
  );
}

async function main() {
  const { url, anonKey, webhookSecret } = getConfig();
  const requireEnv = process.argv.includes('--require-env');
  const skipEdge = process.argv.includes('--skip-edge');
  const requireWebhookSecret = process.argv.includes('--require-webhook-secret');

  if (!url || !anonKey) {
    const message = 'production verification skipped: set SUPABASE_URL/SUPABASE_ANON_KEY or VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY';
    if (requireEnv) {
      console.error(message);
      process.exit(1);
    }
    console.log(message);
    return;
  }

  if (!skipEdge && requireWebhookSecret && !webhookSecret) {
    console.error('production verification failed: set MEMBER_WEBHOOK_SECRET or omit --require-webhook-secret');
    process.exit(1);
  }

  const results = [];
  await verifyAuth(url, anonKey, results);
  await verifyTables(url, anonKey, results);
  await verifyRpc(url, anonKey, results);
  if (!skipEdge) await verifyEdgeFunction(url, anonKey, webhookSecret, results);

  const failures = results.filter(item => !item.ok);
  for (const item of results) {
    console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name} - ${item.detail}`);
  }

  if (failures.length) {
    console.error(`member production verification failed: ${failures.length} failed`);
    process.exit(1);
  }

  console.log('member production verification passed');
}

main().catch(error => {
  console.error(error?.message || error);
  process.exit(1);
});
