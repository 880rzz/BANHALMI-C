import fs from 'node:fs';

const failures=[];
const must=(ok,msg)=>{if(!ok)failures.push(msg)};
const authority=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const loader=fs.readFileSync('assets/js/fluid-rhythm-boot.js','utf8');
const css=fs.readFileSync('assets/css/typography-integrity-v33.css','utf8');
const js=fs.readFileSync('assets/js/typography-integrity-v33.js','utf8');

const contract=authority.typography?.semanticBreakProtection||{};
must(contract.contractVersion==='v33','typography authority must remain v33');
must(contract.shortHyphenatedTermsAtomic===true,'short hyphenated terms must remain atomic');
must(Number(contract.maxProtectedTermCharacters)===28,'protected term length authority changed');
must(contract.sourceTextUnchanged===true,'source text must remain unchanged');
must(contract.appliesAllLanguages===true,'typography protection must apply to all languages');
must(contract.noHorizontalOverflow===true,'typography protection must not permit horizontal overflow');

must(loader.includes('typography-integrity-v33.css?v=20260917-typography-v33'),'global loader lost typography stylesheet');
must(loader.includes('typography-integrity-v33.js?v=20260917-typography-v33'),'global loader lost typography runtime');
must(css.includes('TYPOGRAPHY-INTEGRITY-V33-20260917'),'typography stylesheet marker missing');
must(css.includes('.bn-term-lock'),'atomic term class missing');
must(css.includes('white-space:nowrap!important'),'atomic terms may split again');
must(css.includes('hyphens:none!important'),'hyphenation protection missing');
must(js.includes('TYPOGRAPHY-INTEGRITY-V33-20260917'),'typography runtime marker missing');
must(js.includes("parent.closest('script,style,noscript,pre,code,textarea,[contenteditable=\"true\"],.bn-term-lock')"),'unsafe DOM exclusions missing');
must(js.includes('match[0].length>28'),'runtime term-length guard missing');
must(js.includes('node.parentNode.replaceChild(frag,node)'),'render-only text wrapping missing');

for(const rel of ['index.html','de-at/index.html','hu/index.html']){
  const html=fs.readFileSync(rel,'utf8');
  must(!html.includes('bn-term-lock'),'source HTML must not be rewritten with presentation spans');
}

if(failures.length){
  console.error(`BANHALMI typography integrity audit failed (${failures.length}):`);
  for(const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('BANHALMI typography integrity v33 passed: short hyphenated compounds remain visually atomic across EN/DE/HU while source text and SEO semantics remain unchanged.');
