const { sb, syncWithProvider } = require('./_lib');
module.exports = async (req, res) => {
  const id = String(req.query.id || '');
  if (!/^vpt[0-9a-f]{16}$/.test(id)) return res.status(400).json({ error: 'invalid_id' });
  try {
    let row = (await sb('/contributions?internal_reference=eq.' + id + '&select=*'))[0];
    if (!row) return res.status(404).json({ error: 'not_found' });
    if (row.payment_status === 'pending') row = await syncWithProvider(row);
    return res.status(200).json({ status: row.payment_status });
  } catch (e) { return res.status(500).json({ error: 'server_error' }); }
};
