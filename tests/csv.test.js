const test = require('node:test'), assert = require('node:assert');
const { parse, stringify } = require('../modules/catalog/csv');
test('round trip with quotes, commas, newlines', () => { const rows = [['a', 'b,c', 'd"e', 'f\ng']]; assert.deepEqual(parse(stringify(rows)), rows); });
test('formula cells are neutralised on export', () => assert.ok(stringify([['=HYPERLINK("x")']]).startsWith("\"'=")));
test('negative numbers are not mangled', () => assert.equal(stringify([['-5']]).trim(), '-5'));
