import fs from 'node:fs';

const css = fs.readFileSync('assets/css/fluid-4k-rhythm.css','utf8');
const errors = [];
const marker = 'SMART-QUOTE-INTRINSIC-CARD-HEIGHT-20260918';
if (!css.includes(marker)) errors.push('quote intrinsic-height authority marker missing');
if (!/\.smart-quote-layout\s+\.category-grid\s*\{[\s\S]*?align-items:start!important;[\s\S]*?\}/.test(css)) {
  errors.push('smart quote category grid must align items to start');
}
if (!/\.smart-quote-layout\s+\.category-grid>\.category-card\s*\{[\s\S]*?align-self:start!important;[\s\S]*?block-size:auto!important;[\s\S]*?min-block-size:0!important;[\s\S]*?\}/.test(css)) {
  errors.push('smart quote category cards must opt out of global equal-height stretching');
}
if (errors.length) {
  console.error('Quote intrinsic card-height audit failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('Quote intrinsic card-height audit passed: quote controls remain content-height and cannot regain artificial bottom slack.');
