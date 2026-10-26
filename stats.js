const { sb } = require('./_lib');
module.exports = async (req, res) => {
  const target = Number(process.env.CAMPAIGN_TARGET || 100000);
  const base = { target, deadline: process.env.CAMPAIGN_DEADLINE || null, raised: 0, count: 0, refunded: 0, updatedAt: null };
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(200).json({ ...base, configured: false });
  try {
    const rows = await sb('/contributions?select=amount,payment_status,confirmed_at,refunded_at&payment_status=in.(paid,refunded)&limit=100000');
    let raised = 0, count = 0, refunded = 0, last = null;
    for (const r of rows) {
      if (r.payment_status === 'paid') { raised += Number(r.amount); count++; }
      else refunded += Number(r.amount);
      const t = r.refunded_at || r.confirmed_at; if (t && (!last || t > last)) last = t;
    }
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    return res.status(200).json({ ...base, configured: true, raised: Math.round(raised * 100) / 100, count, refunded, updatedAt: last });
  } catch (e) { return res.status(200).json({ ...base, configured: false }); }
};
