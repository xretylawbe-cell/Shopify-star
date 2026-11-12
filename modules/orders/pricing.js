// Server-side price calculation. Tiers apply only to approved wholesale customers.
function unitPrice(retail, tiers, qty, wholesale) {
  if (!wholesale) return retail;
  const t = [...tiers].sort((a, b) => b.min - a.min).find((x) => qty >= x.min);
  return t ? t.price : retail;
}
module.exports = { unitPrice };
