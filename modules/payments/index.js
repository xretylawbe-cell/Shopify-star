const crypto = require('crypto');
exports.name = 'payments';
exports.mount = (app, { db, cfg }) => {
  const ps = (path, opt = {}) => fetch('https://api.paystack.co' + path, { ...opt, headers: { Authorization: `Bearer ${cfg.paystackKey}`, 'Content-Type': 'application/json' } }).then((r) => r.json());
  app.post('/api/payments/initialize', async (req, res) => {
    if (!cfg.paystackKey) return res.status(503).json({ error: 'Paystack is not configured. Set PAYSTACK_SECRET_KEY.' });
    const [o] = await db.query("SELECT * FROM orders WHERE id=? AND status='pending'", [req.body.order_id]);
    if (!o) return res.status(404).json({ error: 'Order not found or already paid' });
    const ref = `ord${o.id}_${crypto.randomBytes(6).toString('hex')}`;
    const d = await ps('/transaction/initialize', { method: 'POST', body: JSON.stringify({ email: o.email, amount: o.total * 100, reference: ref, callback_url: `${cfg.publicUrl}/` }) });
    if (!d.status) return res.status(502).json({ error: d.message || 'Paystack error' });
    await db.query('UPDATE orders SET payment_ref=? WHERE id=?', [ref, o.id]);
    res.json({ url: d.data.authorization_url, reference: ref });
  });
  app.get('/api/payments/verify', async (req, res) => {
    const [o] = await db.query('SELECT * FROM orders WHERE payment_ref=?', [String(req.query.reference)]);
    if (!o) return res.status(404).json({ error: 'Unknown reference' });
    if (o.status !== 'pending') return res.json({ status: o.status, order_id: o.id });
    const d = await ps('/transaction/verify/' + encodeURIComponent(o.payment_ref));
    if (!d.status || d.data.status !== 'success' || d.data.amount !== o.total * 100) return res.status(402).json({ error: 'Payment not verified' });
    const claimed = await db.query("UPDATE orders SET status='paid' WHERE id=? AND status='pending' RETURNING id", [o.id]);
    if (claimed.length && o.coupon_code) await db.query('UPDATE coupons SET used=used+1 WHERE code=?', [o.coupon_code]);
    if (claimed.length) for (const i of await db.query('SELECT * FROM order_items WHERE order_id=?', [o.id]))
      await db.query(`UPDATE ${i.variant_id ? 'variants' : 'products'} SET stock=CASE WHEN stock>=? THEN stock-? ELSE 0 END WHERE id=?`, [i.qty, i.qty, i.variant_id || i.product_id]);
    res.json({ status: 'paid', order_id: o.id });
  });
};
