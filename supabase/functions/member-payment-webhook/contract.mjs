export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-member-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function hex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

export async function hmacSha256(secret, body) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
}

export function jsonResponse(status, body) {
  return { status, body };
}

export async function handlePaymentWebhookContract({
  method,
  rawBody = '',
  signature = '',
  env,
  findOrder,
  approveOrder
}) {
  if (method === 'OPTIONS') {
    return jsonResponse(200, 'ok');
  }

  if (method !== 'POST') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  if (!env?.supabaseUrl || !env?.serviceRoleKey || !env?.webhookSecret) {
    return jsonResponse(500, { error: 'server_not_configured' });
  }

  const expected = await hmacSha256(env.webhookSecret, rawBody);
  if (!constantTimeEqual(signature, expected)) {
    return jsonResponse(401, { error: 'invalid_signature' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse(400, { error: 'invalid_json' });
  }

  if (!payload.order_id && !payload.provider_ref) {
    return jsonResponse(400, { error: 'missing_order_reference' });
  }

  if (!['paid', 'approved'].includes(payload.status || '')) {
    return jsonResponse(200, { ok: true, ignored: true });
  }

  const { order, error: orderError } = await findOrder(payload);
  if (orderError || !order) {
    return jsonResponse(404, { error: 'order_not_found' });
  }

  if (
    payload.amount_cents !== undefined
    && (!Number.isFinite(payload.amount_cents) || payload.amount_cents !== order.amount_cents)
  ) {
    return jsonResponse(409, { error: 'amount_mismatch' });
  }

  if (payload.currency && payload.currency !== order.currency) {
    return jsonResponse(409, { error: 'currency_mismatch' });
  }

  const provider = payload.provider || order.provider || 'webhook';
  const providerRef = payload.provider_ref || order.provider_ref || order.id;

  const { approval, error: approvalError } = await approveOrder(order, {
    provider,
    providerRef
  });

  if (approvalError) {
    return jsonResponse(500, { error: approvalError.message || String(approvalError) });
  }

  return jsonResponse(200, approval);
}
