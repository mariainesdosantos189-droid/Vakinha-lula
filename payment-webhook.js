const crypto = require('crypto');
const { sb, syncWithProvider } = require('./_lib');
const same = (a, b) => { a = Buffer.from(String(a || '')); b = Buffer.from(String(b || '')); return a.length === b.length && crypto.timingSafeEqual(a, b); };
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const p = req.body || {};
    const ident = p.transaction && p.transaction.identifier;
    if (!p.token || !ident || !/^TRANSACTION_(CREATED|PAID|CANCELED|REFUNDED)$/.test(p.event || '')) return res.status(400).end();
    const rows = await sb('/contributions?internal_reference=eq.' + encodeURIComponent(ident) + '&select=*');
    const row = rows[0];
    if (!row) return res.status(404).end();
    // token do webhook: o devolvido na criação da cobrança (ou o global, se configurado)
    if (!same(p.token, row.webhook_token) && !(process.env.AMPLOPAY_WEBHOOK_TOKEN && same(p.token, process.env.AMPLOPAY_WEBHOOK_TOKEN)))
      return res.status(401).end();
    // Não confiamos no corpo: consultamos o provedor e conferimos o valor.
    await syncWithProvider(row);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('webhook_error', e.message);
    return res.status(500).end();
  }
};
