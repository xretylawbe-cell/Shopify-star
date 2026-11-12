const test = require('node:test'), assert = require('node:assert');
const { check } = require('../modules/backup/validate');
test('accepts valid', () => assert.equal(check({ version: 1, tables: { products: [{ id: 1, name: 'a' }] } }), null));
test('rejects unknown table', () => assert.match(check({ version: 1, tables: { admins: [] } }), /Unknown/));
test('rejects injection in column name', () => assert.match(check({ version: 1, tables: { products: [{ 'a;DROP TABLE x': 1 }] } }), /Bad row/));
