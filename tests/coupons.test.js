const test = require('node:test'), assert = require('node:assert');
const { discountFor } = require('../modules/coupons/apply');
const lines = [{ product_id: 1, qty: 2, price: 1000 }, { product_id: 2, qty: 1, price: 3000 }];
const base = { active: 1, type: 'percent', value: 10, min_order: 0, used: 0 };
test('percent on whole cart', () => assert.equal(discountFor(base, lines, 5000).discount, 500));
test('fixed capped at eligible total', () => assert.equal(discountFor({ ...base, type: 'fixed', value: 9000 }, lines, 5000).discount, 5000));
test('product-specific only discounts that product', () => assert.equal(discountFor({ ...base, product_id: 1 }, lines, 5000).discount, 200));
test('collection-specific', () => assert.equal(discountFor({ ...base, collection_id: 9 }, lines, 5000, new Set([2])).discount, 300));
test('expired, used up, min order, inactive', () => {
  assert.match(discountFor({ ...base, expires_at: '2020-01-01' }, lines, 5000).error, /expired/);
  assert.match(discountFor({ ...base, max_uses: 3, used: 3 }, lines, 5000).error, /fully used/);
  assert.match(discountFor({ ...base, min_order: 9000 }, lines, 5000).error, /Minimum/);
  assert.match(discountFor({ ...base, active: 0 }, lines, 5000).error, /Invalid/);
});
