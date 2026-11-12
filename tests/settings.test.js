const test = require('node:test'), assert = require('node:assert');
const { clean } = require('../modules/settings/clean');
test('whatsapp number is normalised', () => assert.equal(clean('whatsapp_number', '+234 801-234 5678').value, '2348012345678'));
test('bad whatsapp number rejected', () => assert.ok(clean('whatsapp_number', '0801abc').error));
test('javascript: links rejected, https allowed', () => { assert.ok(clean('social_facebook', 'javascript:alert(1)').error); assert.equal(clean('social_facebook', 'https://facebook.com/x').value, 'https://facebook.com/x'); });
test('too long rejected', () => assert.ok(clean('promo_message', 'x'.repeat(201)).error));
