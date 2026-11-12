exports.name = 'reviews';
exports.mount = (app, { db, auth }) => {
  const A = auth.requireAdmin;
  app.get('/api/products/:id/reviews', async (req, res) => {
    const rows = await db.query("SELECT r.rating, r.comment, r.created_at, c.name FROM reviews r JOIN customers c ON c.id=r.customer_id WHERE r.product_id=? AND r.status='approved' ORDER BY r.id DESC LIMIT 50", [req.params.id]);
    const avg = rows.length ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10) / 10 : null;
    res.json({ average: avg, count: rows.length, reviews: rows.map((r) => ({ rating: r.rating, comment: r.comment, created_at: r.created_at, name: (r.name || '').split(' ')[0] || 'Customer' })) });
  });
  app.post('/api/products/:id/reviews', async (req, res) => {
    if (req.user?.role !== 'customer') return res.status(401).json({ error: 'Please log in to leave a review' });
    const rating = Number(req.body.rating), comment = String(req.body.comment || '').trim().slice(0, 1000);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1 to 5' });
    if (!(await db.query('SELECT id FROM products WHERE id=?', [req.params.id])).length) return res.status(404).json({ error: 'Product not found' });
    if ((await db.query('SELECT id FROM reviews WHERE product_id=? AND customer_id=?', [req.params.id, req.user.id])).length) return res.status(409).json({ error: 'You already reviewed this product' });
    await db.query('INSERT INTO reviews (product_id,customer_id,rating,comment) VALUES (?,?,?,?)', [req.params.id, req.user.id, rating, comment]);
    res.json({ ok: true, message: 'Thanks! Your review will appear after approval.' });
  });
  app.get('/api/admin/reviews', A, async (_q, res) => res.json(await db.query('SELECT r.*, p.name product, c.email FROM reviews r JOIN products p ON p.id=r.product_id JOIN customers c ON c.id=r.customer_id ORDER BY r.id DESC LIMIT 200')));
  app.put('/api/admin/reviews/:id', A, async (req, res) => {
    if (!['approved', 'hidden', 'pending'].includes(req.body.status)) return res.status(400).json({ error: 'Bad status' });
    await db.query('UPDATE reviews SET status=? WHERE id=?', [req.body.status, req.params.id]); res.json({ ok: true });
  });
  app.delete('/api/admin/reviews/:id', A, async (req, res) => { await db.query('DELETE FROM reviews WHERE id=?', [req.params.id]); res.json({ ok: true }); });
};
