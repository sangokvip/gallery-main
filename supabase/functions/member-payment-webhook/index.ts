import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders, handlePaymentWebhookContract } from './contract.mjs';

Deno.serve(async request => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const webhookSecret = Deno.env.get('MEMBER_WEBHOOK_SECRET') || '';
  const rawBody = request.method === 'POST' ? await request.text() : '';

  const supabase = supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    })
    : null;

  const result = await handlePaymentWebhookContract({
    method: request.method,
    rawBody,
    signature: request.headers.get('x-member-signature') || '',
    env: {
      supabaseUrl,
      serviceRoleKey,
      webhookSecret
    },
    async findOrder(payload) {
      if (!supabase) return { order: null, error: new Error('server_not_configured') };

      let orderQuery = supabase.from('member_orders').select('*').limit(1);
      orderQuery = payload.order_id
        ? orderQuery.eq('id', payload.order_id)
        : orderQuery.eq('provider_ref', payload.provider_ref);

      const { data: orders, error } = await orderQuery;
      return { order: orders?.[0] || null, error };
    },
    async approveOrder(order, { provider, providerRef }) {
      if (!supabase) return { approval: null, error: new Error('server_not_configured') };

      const { data: approval, error } = await supabase.rpc('apply_member_order_approval', {
        input_order_id: order.id,
        input_provider: provider,
        input_provider_ref: providerRef,
        input_admin_note: '支付回调自动开通',
        input_event_type: 'payment_webhook_approved'
      });

      return { approval, error };
    }
  });

  const body = typeof result.body === 'string' ? result.body : JSON.stringify(result.body);
  return new Response(body, {
    status: result.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
