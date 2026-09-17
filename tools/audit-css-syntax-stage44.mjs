import fs from 'node:fs';

const css=fs.readFileSync('assets/css/style.css','utf8');
const errors=[];

if(/^\s*-webkit-\s*$/m.test(css)) errors.push('style.css contains a standalone -webkit- fragment');

for(const required of [
  '-webkit-font-smoothing:antialiased;',
  '-webkit-appearance:checkbox;',
  '-webkit-transform:translateZ(0);',
  '-webkit-overflow-scrolling:touch;'
]){
  if(!css.includes(required)) errors.push(`style.css missing required compatibility declaration: ${required}`);
}

for(const invalid of [
  /(^|\n)[ \t]*font-smoothing:antialiased;/m,
  /(^|\n)[ \t]*appearance:checkbox;/m,
  /(^|\n)[ \t]*overflow-scrolling:touch;/m
]){
  if(invalid.test(css)) errors.push(`style.css contains a vendor property with its -webkit- prefix stripped: ${invalid}`);
}

if(/(^|\n)([ \t]*)transform:translateZ\(0\);\n\2transform:translateZ\(0\);/m.test(css)){
  errors.push('style.css contains a duplicated unprefixed translateZ compatibility line');
}

if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('Stage 44 CSS syntax audit passed: malformed vendor fragments are absent and required WebKit compatibility declarations are intact.');
