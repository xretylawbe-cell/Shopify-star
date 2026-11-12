// Whitelisted tables only; column names must be plain identifiers (values are always parameterised).
const TABLES = { products: 1, variants: 1, categories: 1, collections: 1, product_collections: 0, media: 1, customers: 1, orders: 1, order_items: 1, settings: 0, coupons: 1, reviews: 1, wholesale_requests: 1 };
function check(b) {
  if (!b || b.version !== 1 || typeof b.tables !== 'object' || !b.tables) return 'Not a valid backup file';
  for (const [t, rows] of Object.entries(b.tables)) {
    if (!(t in TABLES)) return `Unknown table: ${t}`;
    if (!Array.isArray(rows)) return `Table ${t} must be a list`;
    for (const r of rows) if (!r || typeof r !== 'object' || !Object.keys(r).length || !Object.keys(r).every((k) => /^[a-z_]{1,40}$/.test(k))) return `Bad row in ${t}`;
  }
  return null;
}
module.exports = { TABLES, check };
