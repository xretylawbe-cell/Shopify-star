// Pure discount rules, so they can be tested. Used only on the server.
function discountFor(c, lines, subtotal, collectionProductIds = new Set(), now = new Date()) {
  if (!c || !c.active) return { error: 'Invalid coupon code' };
  if (c.expires_at && new Date(c.expires_at) < now) return { error: 'This coupon has expired' };
  if (c.max_uses != null && c.used >= c.max_uses) return { error: 'This coupon has been fully used' };
  if (subtotal < (c.min_order || 0)) return { error: `Minimum order for this coupon is ₦${c.min_order}` };
  const eligible = lines.filter((l) => c.product_id ? l.product_id == c.product_id : c.collection_id ? collectionProductIds.has(l.product_id) : true);
  const base = eligible.reduce((s, l) => s + l.price * l.qty, 0);
  if (!base) return { error: 'This coupon does not apply to the items in your cart' };
  return { discount: c.type === 'percent' ? Math.floor((base * Math.min(c.value, 100)) / 100) : Math.min(c.value, base) };
}
module.exports = { discountFor };
