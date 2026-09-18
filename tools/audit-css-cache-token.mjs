import fs from 'node:fs';
import {
  expectedSiteCssToken,
  htmlFiles,
  siteCssReferences,
} from './css-cache-token.mjs';

const expected = expectedSiteCssToken();
const errors = [];
let references = 0;

for (const file of htmlFiles('.')) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of siteCssReferences(html)) {
    references += 1;
    if (match[1] !== expected) {
      errors.push(`${file}: stale site.css token ${match[1]} (expected ${expected})`);
    }
  }
}

if (references < 50) {
  errors.push(`expected at least 50 versioned site.css references, found ${references}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`CSS cache-token audit passed: ${references} site.css references use ${expected}.`);
