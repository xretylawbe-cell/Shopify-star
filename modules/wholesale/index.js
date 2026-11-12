exports.name = 'wholesale';
exports.mount = (app, { db, auth }) => {
  const customerOnly = (req, res, next) => req.user?.role === 'customer' ? next() : res.status(401).json({ error: 'Please log in or register first' });
  app.get('/api/wholesale/status', customerOnly, async (req, res) => {
    const [c] = await db.query('SELECT wholesale_approved w FROM customers WHERE id=?', [req.user.id]);
    const [r] = await db.query('SELECT status FROM wholesale_requests WHERE customer_id=? ORDER BY id DESC LIMIT 1', [req.user.id]);
    res.json({ approved: !!c?.w, request: r || null });
  });
  app.post('/api/wholesale/request', customerOnly, async (req, res) => {
    const name = String(req.body.business_name || '').trim().slice(0, 120);
    if (!name) return res.status(400).json({ error: 'Business name required' });
    if ((await db.query("SELECT id FROM wholesale_requests WHERE customer_id=? AND status='pending'", [req.user.id])).length) return res.status(409).json({ error: 'You already have a pending request' });
    await db.query('INSERT INTO wholesale_requests (customer_id,business_name,message) VALUES (?,?,?)', [req.user.id, name, String(req.body.message || '').slice(0, 500)]);
    res.json({ ok: true });
  });
  app.get('/api/admin/wholesale', auth.requireAdmin, async (_q, res) => res.json(await db.query('SELECT w.*, c.email FROM wholesale_requests w JOIN customers c ON c.id=w.customer_id ORDER BY w.id DESC LIMIT 200')));
  app.put('/api/admin/wholesale/:id', auth.requireAdmin, async (req, res) => {
    const st = req.body.status; if (!['approved', 'rejected', 'pending'].includes(st)) return res.status(400).json({ error: 'Bad status' });
    const [w] = await db.query('SELECT customer_id FROM wholesale_requests WHERE id=?', [req.params.id]); if (!w) return res.status(404).json({ error: 'Not found' });
    await db.query('UPDATE wholesale_requests SET status=? WHERE id=?', [st, req.params.id]);
    await db.query('UPDATE customers SET wholesale_approved=? WHERE id=?', [st === 'approved' ? 1 : 0, w.customer_id]);
    res.json({ ok: true });
  });
};
