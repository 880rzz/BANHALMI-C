import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const retiredUrl=['https://issuu.com/','tripont/docs/',['issue_trip_','magazin','/76'].join('')].join('');
const retiredId=['trip','magazin','76'].join('-');
const suffix=['issue_trip_','magazin','/76'].join('');
const allowedExt=new Set(['.html','.json','.jsonld','.js','.mjs','.cjs','.ts','.tsx','.py','.md','.txt','.yml','.yaml','.xml','.csv','.svg','.toml','.css']);
const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const errors=[];
for (const file of tracked) {
  if (!allowedExt.has(path.extname(file).toLowerCase())) continue;
  if (!fs.existsSync(file) || fs.statSync(file).size>8_000_000) continue;
  const content=fs.readFileSync(file,'utf8');
  if(content.includes(retiredUrl)||content.includes(retiredId)||content.includes(suffix))errors.push(file+': retired publication URL/id resurfaced in tracked source or generator');
}
if (fs.existsSync('service-trust-evidence.json')) {
  const evidence=JSON.parse(fs.readFileSync('service-trust-evidence.json','utf8'));
  for(const [service,record] of Object.entries(evidence.services||{})) {
    if(record.archivedEvidenceIds?.includes(retiredId))errors.push(service+': archived service evidence restored');
  }
  if(evidence.historicalResearchCandidates?.some(x=>x.url===retiredUrl||x.id===retiredId))errors.push('Historical issue reinstated as candidate');
  if(evidence.archiveVerifiedEvidence?.includes(retiredId))errors.push('Retired issue returned to verified evidence');
  if(evidence.sourceBackbone?.masterSourceCount!==111)errors.push('Professional master source count should match canonical ART 111-source graph');
}
if (fs.existsSync('data/wikidata-source-inventory.json')) {
  const inventory=JSON.parse(fs.readFileSync('data/wikidata-source-inventory.json','utf8'));
  const wiki=JSON.parse(fs.readFileSync('wikidata-source-registry.json','utf8'));
  const master=JSON.parse(fs.readFileSync('master-source-database.json','utf8'));
  if(inventory.sources.length!==wiki.sources.length||wiki.sourceCount!==wiki.sources.length)errors.push('Wikidata inventory-registry count mismatch');
  if(master.sourceCount!==master.sources.length)errors.push('Master source count mismatch');
  for(const x of [inventory,wiki,master])if(JSON.stringify(x).includes(retiredUrl))errors.push('Retired issue reappeared in a machine-readable source registry');
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Retired Tripont issue absent from tracked files, services and machine source graphs; read/write source counts consistent.');
