import fs from 'node:fs';

const errors=[];
const js=fs.readFileSync('assets/js/site-config.js','utf8');
const a11y=fs.readFileSync('assets/css/accessibility-stage14.css','utf8');
const menu=fs.readFileSync('assets/css/mega-menu.css','utf8');

if(js.includes("document.createElement('style')")||js.includes('banhalmi-validation-styles')) errors.push('site-config.js must not inject presentation CSS at runtime');
for(const token of ['STAGE42-STATIC-VALIDATION:START','.quote-validation-summary','[data-smart-quote] .is-invalid-field','STAGE42-STATIC-VALIDATION:END']){
  if(!a11y.includes(token)) errors.push(`accessibility-stage14.css missing static validation contract: ${token}`);
}

/* Accessibility may style descendants inside its own components (for example
   .quote-validation-summary h2), but it must never become the owner of global
   layout/type selectors. Match only complete selector heads, not substrings. */
const forbiddenGlobalSelectors=['.card','.cards','.hero','.split','.wrap','section','h1','h2','h3'];
for(const selector of forbiddenGlobalSelectors){
  const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re=new RegExp(`(?:^|})\\s*${escaped}\\s*\\{`,'m');
  if(re.test(a11y)) errors.push(`accessibility-stage14.css must not own global selector ${selector}`);
}

for(const required of ['.bn-mega-menu','.bn-mega-panel','.bn-mega-grid','.site-header .nav-links']){
  if(!menu.includes(required)) errors.push(`mega-menu.css missing scoped navigation contract: ${required}`);
}

if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('Stage 42 design-authority audit passed: runtime JS is presentation-free, validation CSS is static, and accessibility/menu ownership remains scoped.');
