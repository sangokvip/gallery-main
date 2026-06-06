import assert from 'node:assert/strict';
import {
  handlePaymentWebhookContract,
  hmacSha256,
  constantTimeEqual
} from '../supabase/functions/member-payment-webhook/contract.mjs';

const env = {
  supabaseUrl: 'https://example.supabase.co',
  serviceRoleKey: 'service-role-key',
  webhookSecret: 'member-webhook-secret'
};

const order = {
  id: '00000000-0000-4000-8000-000000000001',
  provider: 'manual',
  provider_ref: null,
  amount_cents: 3900,
  currency: 'CNY'
};

function body(payload) {
  return JSON.stringify(payload);
}

async function signedCall(payload, overrides = {}) {
  const rawBody = typeof payload === 'string' ? payload : body(payload);
  const signature = overrides.signature ?? await hmacSha256(env.webhookSecret, rawBody);
  const calls = { findOrder: 0, approveOrder: 0 };

  const result = await handlePaymentWebhookContract({
    method: overrides.method || 'POST',
    rawBody,
    signature,
    env: overrides.env || env,
    async findOrder(inputPayload) {
      calls.findOrder += 1;
      if (overrides.orderError) return { order: null, error: overrides.orderError };
      if (overrides.missingOrder) return { order: null, error: null };
      assert.equal(inputPayload.order_id || inputPayload.provider_ref, payload.order_id || payload.provider_ref);
      return { order: overrides.order || order, error: null };
    },
    async approveOrder(inputOrder, approvalInput) {
      calls.approveOrder += 1;
      if (overrides.approvalError) return { approval: null, error: overrides.approvalError };
      return {
        approval: {
          ok: true,
          order_id: inputOrder.id,
          tier: 'premium',
          idempotent: false,
          provider: approvalInput.provider,
          provider_ref: approvalInput.providerRef
        },
        error: null
      };
    }
  });

  return { result, calls };
}

const goodPayload = {
  order_id: order.id,
  provider: 'stripe',
  provider_ref: 'pi_codex',
  status: 'paid',
  amount_cents: 3900,
  currency: 'CNY'
};

assert.equal(constantTimeEqual('abc', 'abc'), true);
assert.equal(constantTimeEqual('abc', 'abd'), false);
assert.equal(constantTimeEqual('abc', 'abcd'), false);

{
  const { result } = await signedCall(goodPayload, { method: 'OPTIONS' });
  assert.equal(result.status, 200);
  assert.equal(result.body, 'ok');
}

{
  const { result } = await signedCall(goodPayload, { method: 'GET' });
  assert.equal(result.status, 405);
  assert.equal(result.body.error, 'method_not_allowed');
}

{
  const { result } = await signedCall(goodPayload, {
    env: { ...env, webhookSecret: '' }
  });
  assert.equal(result.status, 500);
  assert.equal(result.body.error, 'server_not_configured');
}

{
  const { result, calls } = await signedCall(goodPayload, { signature: 'bad-signature' });
  assert.equal(result.status, 401);
  assert.equal(result.body.error, 'invalid_signature');
  assert.equal(calls.findOrder, 0);
  assert.equal(calls.approveOrder, 0);
}

{
  const rawBody = '{bad-json';
  const { result } = await signedCall(rawBody);
  assert.equal(result.status, 400);
  assert.equal(result.body.error, 'invalid_json');
}

{
  const { result } = await signedCall({ status: 'paid' });
  assert.equal(result.status, 400);
  assert.equal(result.body.error, 'missing_order_reference');
}

{
  const { result, calls } = await signedCall({ ...goodPayload, status: 'failed' });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { ok: true, ignored: true });
  assert.equal(calls.findOrder, 0);
  assert.equal(calls.approveOrder, 0);
}

{
  const { result } = await signedCall(goodPayload, { missingOrder: true });
  assert.equal(result.status, 404);
  assert.equal(result.body.error, 'order_not_found');
}

{
  const { result } = await signedCall({ ...goodPayload, amount_cents: 3800 });
  assert.equal(result.status, 409);
  assert.equal(result.body.error, 'amount_mismatch');
}

{
  const { result } = await signedCall({ ...goodPayload, amount_cents: Number.NaN });
  assert.equal(result.status, 409);
  assert.equal(result.body.error, 'amount_mismatch');
}

{
  const { result } = await signedCall({ ...goodPayload, currency: 'USD' });
  assert.equal(result.status, 409);
  assert.equal(result.body.error, 'currency_mismatch');
}

{
  const { result, calls } = await signedCall(goodPayload);
  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.provider, 'stripe');
  assert.equal(result.body.provider_ref, 'pi_codex');
  assert.equal(calls.findOrder, 1);
  assert.equal(calls.approveOrder, 1);
}

{
  const { result } = await signedCall({
    provider_ref: 'manual-provider-ref',
    status: 'approved',
    amount_cents: 3900,
    currency: 'CNY'
  }, {
    order: { ...order, provider: 'manual', provider_ref: 'manual-provider-ref' }
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.provider, 'manual');
  assert.equal(result.body.provider_ref, 'manual-provider-ref');
}

{
  const { result } = await signedCall(goodPayload, {
    approvalError: new Error('approval failed')
  });
  assert.equal(result.status, 500);
  assert.equal(result.body.error, 'approval failed');
}

console.log('payment webhook contract verification passed');
