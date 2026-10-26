const SB = () => process.env.SUPABASE_URL + '/rest/v1';
const sbHeaders = () => ({
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
});
async function sb(path, opts = {}) {
  const r = await fetch(SB() + path, { ...opts, headers: { ...sbHeaders(), ...(opts.headers || {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error('db_error ' + r.status);
  return t ? JSON.parse(t) : [];
}
async function amplo(path, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch('https://app.amplopay.com/api/v1/gateway' + path, {
      ...opts,
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-public-key': process.env.AMPLOPAY_PUBLIC_KEY,
        'x-secret-key': process.env.AMPLOPAY_SECRET_KEY
      }
    });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  } finally { clearTimeout(timer); }
}
const MAP = { COMPLETED: 'paid', PENDING: 'pending', FAILED: 'failed', REFUNDED: 'refunded', CHARGED_BACK: 'refunded', EXPIRED: 'expired' };
// Confirma com o provedor e atualiza o banco. Idempotente: só muda se o status for diferente.
async function syncWithProvider(row) {
  const q = row.provider_transaction_id ? 'id=' + encodeURIComponent(row.provider_transaction_id)
                                        : 'clientIdentifier=' + encodeURIComponent(row.internal_reference);
  const r = await amplo('/transactions?' + q, { method: 'GET' });
  if (!r.ok || !r.data) return row;
  const tx = r.data;
  const next = MAP[tx.status];
  if (!next || next === row.payment_status) return row;
  if (next === 'paid') {
    const ok = [tx.amount, tx.chargeAmount].some(v => Math.abs(Number(v) - Number(row.amount)) < 0.011) && (tx.currency || 'BRL') === 'BRL';
    if (!ok) return row; // valor não confere: não contabiliza
  }
  const patch = { payment_status: next };
  if (next === 'paid') patch.confirmed_at = new Date().toISOString();
  if (next === 'refunded') patch.refunded_at = new Date().toISOString();
  // só atualiza se o status atual ainda é o que lemos (evita dupla contagem)
  const upd = await sb('/contributions?id=eq.' + row.id + '&payment_status=eq.' + row.payment_status, { method: 'PATCH', body: JSON.stringify(patch) });
  return upd[0] || row;
}
module.exports = { sb, amplo, syncWithProvider, MAP };
