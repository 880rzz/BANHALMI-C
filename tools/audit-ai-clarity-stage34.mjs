import fs from 'node:fs';

// Stage 52: llms.txt is intentionally a concise agent entry index; detailed knowledge remains in ai.txt and canonical JSON resources.
const ai=fs.readFileSync('ai.txt','utf8');
const llms=fs.readFileSync('llms.txt','utf8');
const required=['Primary person: Norbert Bánhalmi','Professional website: https://www.norbertbanhalmi.com/','Artistic archive: https://www.banhalmi.art/','Vienna and Budapest are the two active operational bases','New York is a major international reference and oeuvre chapter','New York is not a studio, office, headquarters or operational base','Viko Speier is a supporting company contact','Never infer a New York business location'];
for(const phrase of required){if(!llms.includes(phrase))throw new Error('llms.txt missing canonical AI phrase: '+phrase);if(!ai.slice(0,5000).includes(phrase))throw new Error('ai.txt missing canonical AI phrase: '+phrase);}
if(!llms.startsWith('# BANHALMI\n\n> '))throw new Error('llms.txt must begin with H1 then blockquote summary');
if(Buffer.byteLength(llms,'utf8')>9000)throw new Error('llms.txt must remain a concise agent index under 9 KB; detailed knowledge belongs in ai.txt/JSON');
if(/<!--[\s\S]*?-->/.test(llms))throw new Error('llms.txt must not contain internal HTML-comment audit markers');
const h1=(llms.match(/^# /gm)||[]).length;if(h1!==1)throw new Error('llms.txt must contain exactly one H1');
const h2=[...llms.matchAll(/^## (.+)$/gm)].map(m=>m[1]);if(h2.length<5)throw new Error('llms.txt needs clear H2 resource groups');
for(const section of h2){const start=llms.indexOf('## '+section);const next=llms.indexOf('\n## ',start+4);const body=llms.slice(start,next<0?llms.length:next);if(!/^- \[[^\]]+\]\(https:\/\/[^)]+\): /m.test(body))throw new Error('llms.txt section lacks descriptive Markdown links: '+section);}
const starts=[...ai.matchAll(/AI-CLARITY-STAGE34:START/g)],ends=[...ai.matchAll(/AI-CLARITY-STAGE34:END/g)];if(starts.length!==1||ends.length!==1)throw new Error('ai.txt Stage 34 clarity block must occur exactly once');
console.log('Stage 34 AI clarity audit passed: llms.txt is a concise standards-shaped resource index; detailed context remains in ai.txt and canonical JSON.');
