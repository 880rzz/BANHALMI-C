import fs from 'node:fs';
import {
  expectedSiteCssToken,
  htmlFiles,
  siteCssReferences,
  synchronizeSiteCssToken,
} from './css-cache-token.mjs';

const expected = expectedSiteCssToken();
let references = 0;
let changedFiles = 0;

for (const file of htmlFiles('.')) {
  const html = fs.readFileSync(file, 'utf8');
  references += siteCssReferences(html).length;
  const next = synchronizeSiteCssToken(html, expected);
  if (next !== html) {
    fs.writeFileSync(file, next);
    changedFiles += 1;
  }
}

if (references < 50) {
  console.error(`Expected at least 50 versioned site.css references, found ${references}.`);
  process.exit(1);
}

console.log(`CSS cache-token sync complete: ${references} references use ${expected}; ${changedFiles} HTML files changed.`);
