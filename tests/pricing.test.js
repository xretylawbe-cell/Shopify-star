const test = require('node:test'), assert = require('node:assert');
const { unitPrice } = require('../modules/orders/pricing');
const tiers = [{ min: 50, price: 1000 }, { min: 100, price: 850 }, { min: 500, price: 700 }];
test('retail ignores tiers', () => assert.equal(unitPrice(1500, tiers, 500, false), 1500));
test('wholesale tiers', () => { assert.equal(unitPrice(1500, tiers, 10, true), 1500); assert.equal(unitPrice(1500, tiers, 50, true), 1000); assert.equal(unitPrice(1500, tiers, 99, true), 1000); assert.equal(unitPrice(1500, tiers, 100, true), 850); assert.equal(unitPrice(1500, tiers, 500, true), 700); });
