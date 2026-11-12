exports.name = 'stats';
const PAID = "('paid','processing','ready','shipped','completed')";
exports.mount = (app, { db, auth }) => {
  app.get('/api/admin/stats', auth.requireAdmin, async (_q, res) => {
    const day = new Date().toISOString().slice(0, 10), n = async (sql, p = []) => Number(Object.values((await db.query(sql, p))[0])[0] || 0);
    res.json({
      today_sales: await n(`SELECT COALESCE(SUM(total),0) FROM orders WHERE status IN ${PAID} AND created_at >= ?`, [day]),
      total_sales: await n(`SELECT COALESCE(SUM(total),0) FROM orders WHERE status IN ${PAID}`),
      wholesale_sales: await n(`SELECT COALESCE(SUM(o.total),0) FROM orders o JOIN customers c ON c.id=o.customer_id WHERE c.wholesale_approved=1 AND o.status IN ${PAID}`),
      orders_today: await n('SELECT COUNT(*) FROM orders WHERE created_at >= ?', [day]),
      orders: await n('SELECT COUNT(*) FROM orders'),
      pending: await n("SELECT COUNT(*) FROM orders WHERE status='pending'"),
      completed: await n("SELECT COUNT(*) FROM orders WHERE status='completed'"),
      customers: await n('SELECT COUNT(*) FROM customers'),
      wholesale_customers: await n('SELECT COUNT(*) FROM customers WHERE wholesale_approved=1'),
      products: await n('SELECT COUNT(*) FROM products'),
      low_stock: await n("SELECT COUNT(*) FROM products WHERE status='published' AND stock>0 AND stock<=5"),
      out_of_stock: await n("SELECT COUNT(*) FROM products WHERE status='published' AND stock<=0"),
      best_sellers: (await db.query(`SELECT oi.name, SUM(oi.qty) q FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.status IN ${PAID} GROUP BY oi.name ORDER BY q DESC LIMIT 5`)).map((r) => ({ name: r.name, q: Number(r.q) })),
    });
  });
};
