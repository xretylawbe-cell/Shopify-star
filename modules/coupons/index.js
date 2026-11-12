exports.name = 'coupons';
exports.mount = (app, { db, auth }) => {
  const A = auth.requireAdmin, int = (v) => (v === '' || v == null ? null : Number(v));
  app.get('/api/admin/coupons', A, async (_q, res) => res.json(await db.query('SELECT * FROM coupons ORDER BY id DESC')));
  app.post('/api/admin/coupons', A, async (req, res) => {
    const b = req.body, code = String(b.code || '').trim().toUpperCase(), value = int(b.value), min = int(b.min_order) ?? 0, max = int(b.max_uses);
    const pid = int(b.product_id), cid = int(b.collection_id), exp = b.expires_at ? String(b.expires_at) : null;
    const bad = !/^[A-Z0-9_-]{3,30}$/.test(code) ? 'Code must be 3-30 letters/numbers' : !['percent', 'fixed'].includes(b.type) ? 'Type must be percent or fixed'
      : !Number.isInteger(value) || value < 1 || (b.type === 'percent' && value > 100) ? 'Value must be a whole number (1-100 for percent)'
      : !Number.isInteger(min) || min < 0 || (max !== null && (!Number.isInteger(max) || max < 1)) ? 'Minimum order / max uses must be whole numbers'
      : exp && isNaN(new Date(exp)) ? 'Expiry must be a date like 2026-12-31' : pid && cid ? 'Choose a product OR a collection, not both' : null;
    if (bad) return res.status(400).json({ error: bad });
    if ((await db.query('SELECT id FROM coupons WHERE code=?', [code])).length) return res.status(409).json({ error: 'Code already exists' });
    res.json((await db.query('INSERT INTO coupons (code,type,value,min_order,max_uses,expires_at,product_id,collection_id) VALUES (?,?,?,?,?,?,?,?) RETURNING id', [code, b.type, value, min, max, exp, pid, cid]))[0]);
  });
  app.put('/api/admin/coupons/:id', A, async (req, res) => { await db.query('UPDATE coupons SET active=? WHERE id=?', [req.body.active ? 1 : 0, req.params.id]); res.json({ ok: true }); });
  app.delete('/api/admin/coupons/:id', A, async (req, res) => { await db.query('DELETE FROM coupons WHERE id=?', [req.params.id]); res.json({ ok: true }); });
};
