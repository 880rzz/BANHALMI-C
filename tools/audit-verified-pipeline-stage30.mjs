import fs from 'node:fs';

const failures = [];
const mustContain = (file, token) => {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(token)) failures.push(`${file}: missing ${token}`);
};

for (const [file, tokens] of Object.entries({
  '.github/workflows/full-audit.yml': [
    'npx playwright install --with-deps chromium',
    'npm run test:browser',
    "- 'fix/**'"
  ],
  '.github/workflows/pages.yml': [
    'npx playwright install --with-deps chromium',
    'npm run test:browser',
    'deployment-sha.txt',
    'Verify exact commit is live on the custom domain',
    'https://www.norbertbanhalmi.com/deployment-sha.txt',
    'https://www.norbertbanhalmi.com/hu/',
    'https://www.norbertbanhalmi.com/de-at/'
  ],
  'package.json': [
    'audit-mobile-menu-and-footer-stage29.mjs',
    'mobile-menu-active-state.spec.mjs'
  ]
})) {
  for (const token of tokens) mustContain(file, token);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Verified main-to-live pipeline contract passed.');
