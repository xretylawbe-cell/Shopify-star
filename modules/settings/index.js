const { FIELDS, clean } = require('./clean');
exports.name = 'settings';
exports.mount = (app, { db, auth }) => {
  // Everything in FIELDS is public storefront content (never put secrets here).
  app.get('/api/settings', async (_q, res) => {
    const out = Object.fromEntries(Object.keys(FIELDS).map((k) => [k, '']));
    for (const r of await db.query('SELECT key, value FROM settings')) if (r.key in FIELDS) out[r.key] = r.value;
    res.json(out);
  });
  app.put('/api/admin/settings', auth.requireAdmin, async (req, res) => {
    const vals = {};
    for (const [k, v] of Object.entries(req.body || {})) {
      if (!(k in FIELDS)) return res.status(400).json({ error: `Unknown setting: ${k}` });
      const c = clean(k, v); if (c.error) return res.status(400).json({ error: c.error }); vals[k] = c.value;
    }
    for (const [k, v] of Object.entries(vals)) await db.query('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT (key) DO UPDATE SET value=excluded.value', [k, v]);
    res.json({ ok: true });
  });
};
