import fs from 'node:fs';

const path = 'assets/js/site-config.js';
let src = fs.readFileSync(path, 'utf8');
const from = "    data.page_language = languageOf(form);";
const to = "    data.language = languageOf(form);\n    data.page_language = data.language;";
if (!src.includes(to)) {
  if (!src.includes(from)) throw new Error('Expected page_language assignment not found.');
  src = src.replace(from, to);
  fs.writeFileSync(path, src);
}
console.log('Frontend payload now sends both language and page_language.');
