import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/js/quote-pdf.js', import.meta.url), 'utf8');

new vm.Script(source, { filename: 'assets/js/quote-pdf.js' });

for (const required of [
  'Banhalmi Norbert e.U.',
  'ATU80445314',
  '36592951',
  '9110037983878',
  'BE15 9679 0284 3630',
  'TRWIBEB1XXX',
  'Szolgáltató adatai',
  'Megrendelő adatai',
  'Service provider',
  'Customer details',
  'Dienstleister',
  'Auftraggeberdaten',
  'előzetes, nem kötelező érvényű kalkuláció',
  'preliminary, non-binding estimate',
  'vorläufige, unverbindliche Kalkulation',
  'Fix tervezési árfolyam: 1 EUR = 400 HUF'
]) {
  assert.ok(source.includes(required), `Missing required PDF content: ${required}`);
}

assert.ok(!source.includes('Rue du Trône'), 'Wise technical address must not appear as the provider address');
assert.ok(source.includes("projectRows"), 'Project rows must be separated from customer rows');
assert.ok(source.includes("customerRows"), 'Customer rows must be rendered as a dedicated block');

console.log('Quote PDF content audit passed.');
