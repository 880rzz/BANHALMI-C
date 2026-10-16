/**
 * Migration-era CSS priority budget. Do not replace one specificity war with
 * another !important. Reduce limits when a verified component is simplified.
 * Source CSS temporarily stays split until all builder/test references migrate.
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';

const budgets={
 'assets/css/site.css':599,
 'assets/css/fluid-4k-rhythm.css':1389
};
const cssFiles=fs.readdirSync('assets/css').filter(name=>name.endsWith('.css'))
 .map(name=>'assets/css/'+name).sort();
assert.deepEqual(cssFiles,Object.keys(budgets).sort(),'Unreviewed new CSS source detected');
let total=0;
for(const [file,budget]of Object.entries(budgets)){
 const source=fs.readFileSync(file,'utf8').replace(/\/\*[\s\S]*?\*\//g,' ');
 const count=(source.match(/!important\b/g)||[]).length;
 assert.ok(count<=budget,file+': '+count+' priorities exceed '+budget+' baseline; remove stale overrides first');
 total+=count;
 console.log('CSS priority authority: '+file+' '+count+'/'+budget+' !important');
}
assert.ok(total<=1988,'CSS priority debt increased beyond established migration baseline');
console.log('CSS priority budget PASS: '+total+' source !important (pre-migration: 2,081).');
