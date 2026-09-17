import fs from 'node:fs';

const failures=[];
const boot=fs.readFileSync('assets/js/fluid-rhythm-boot.js','utf8');
const fluid=fs.readFileSync('assets/css/fluid-4k-rhythm.css','utf8');
const optimizer=fs.readFileSync('tools/optimize-production-artifact.mjs','utf8');
const authority=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const must=(ok,msg)=>{if(!ok)failures.push(msg)};

must(boot.includes('/assets/css/fluid-4k-rhythm.css?v=20260916-live-pixel-v22'),'live-pixel cache token missing');
must(optimizer.includes('/assets/css/fluid-4k-rhythm.css?v=20260916-live-pixel-v22'),'production artifact must parser-discover the same canonical geometry CSS token');
must(optimizer.includes("if (!html.includes('data-fluid-4k-rhythm')) html = html.replace(/<\\/head>/i"),'production artifact must statically inject canonical geometry CSS in head');
must(boot.includes("window.matchMedia('(min-width:1180px)')"),'desktop footer disclosure breakpoint missing');
must(boot.includes('details.open = query.matches;'),'footer disclosure state must track viewport');
must(!boot.includes('style.textContent'),'runtime must not inject layout CSS');
must(!boot.includes('--desktop-hero-min'),'runtime must not own hero geometry');
must(!boot.includes('object-position:center 30%'),'runtime must not own image crop geometry');
must(authority.visualGeometry?.runtimeGeometryOverridesAllowed===false,'canonical authority must prohibit runtime geometry overrides');
must(fluid.includes('LIVE-PIXEL-GEOMETRY-V22'),'canonical live-pixel stylesheet marker missing');
must(fluid.includes('--desktop-hero-min:clamp(740px,42vw,880px)'),'canonical homepage hero geometry missing');
must(fluid.includes('--desktop-copy:clamp(560px,38vw,680px)'),'canonical homepage copy-panel geometry missing');
must(fluid.includes('font-size:clamp(2.5rem,2.65vw,3.3rem)!important'),'homepage desktop H1 minimum must remain 40px');
must(/\.collage-gallery\{column-count:4!important/.test(fluid),'1440 portrait gallery four-column density contract missing');
must(/@media\s*\(min-width:1600px\)\{html body main \.collage-gallery\{column-count:5!important\}\}/.test(fluid),'wide desktop portrait gallery five-column density contract missing');
must(/@media\s*\(min-width:2200px\)\{html body main \.collage-gallery\{column-count:6!important\}\}/.test(fluid),'2560/4K portrait gallery six-column density contract missing');
must(!fs.existsSync('assets/css/layout-contract-v18.css'),'layout recovery must not introduce a third stylesheet authority');
must(!fs.existsSync('assets/js/layout-contract-v18.js'),'layout recovery must not introduce a second geometry runtime');

if(failures.length){
  console.error(`BANHALMI layout contract v19 failed (${failures.length}):`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log('BANHALMI layout contract v19 passed: canonical CSS is parser-discovered in production, runtime only synchronizes disclosure state, desktop H1 is >=40px, and 4/5/6-column portrait density is protected through 4K.');
