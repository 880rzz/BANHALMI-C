import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const target=path.resolve(process.argv[2]||'assets/css/style.css');
const source=await readFile(target,'utf8');
const removals=[];
const seen=new Map();

function normalize(value){
  return value
    .replace(/\/\*[\s\S]*?\*\//g,' ')
    .replace(/\s+/g,' ')
    .replace(/\s*([:;,>+~{}])\s*/g,'$1')
    .trim();
}

function findOpen(text,start,end){
  let quote='';
  for(let i=start;i<end;i++){
    const ch=text[i], next=text[i+1];
    if(quote){
      if(ch==='\\'){i++;continue;}
      if(ch===quote) quote='';
      continue;
    }
    if(ch==='"'||ch==="'"){quote=ch;continue;}
    if(ch==='/'&&next==='*'){
      const close=text.indexOf('*/',i+2);
      if(close<0) return -1;
      i=close+1;continue;
    }
    if(ch==='{') return i;
  }
  return -1;
}

function matchingBrace(text,open,end){
  let depth=1,quote='';
  for(let i=open+1;i<end;i++){
    const ch=text[i],next=text[i+1];
    if(quote){
      if(ch==='\\'){i++;continue;}
      if(ch===quote) quote='';
      continue;
    }
    if(ch==='"'||ch==="'"){quote=ch;continue;}
    if(ch==='/'&&next==='*'){
      const close=text.indexOf('*/',i+2);
      if(close<0) return -1;
      i=close+1;continue;
    }
    if(ch==='{') depth++;
    else if(ch==='}'&&!--depth) return i;
  }
  return -1;
}

function hasNestedBlock(text,start,end){
  return findOpen(text,start,end)>=0;
}

function selectorStart(text,start,open){
  // Keep comments in place. Remove only from the first non-comment token of
  // the duplicate selector/at-rule so historical comments are never deleted.
  let i=start;
  while(i<open){
    if(/\s/.test(text[i])){i++;continue;}
    if(text[i]==='/'&&text[i+1]==='*'){
      const close=text.indexOf('*/',i+2);
      if(close<0) break;
      i=close+2;continue;
    }
    break;
  }
  return i;
}

function parseRegion(start,end,context='root'){
  let cursor=start;
  while(cursor<end){
    const open=findOpen(source,cursor,end);
    if(open<0) return;
    const close=matchingBrace(source,open,end);
    if(close<0) throw new Error(`Unbalanced CSS near byte ${open}`);
    const rawPrelude=source.slice(cursor,open);
    const prelude=normalize(rawPrelude.replace(/^;+/,''));
    const bodyStart=open+1, bodyEnd=close;
    if(prelude){
      if((prelude.startsWith('@')&&hasNestedBlock(source,bodyStart,bodyEnd))){
        parseRegion(bodyStart,bodyEnd,`${context}>${prelude}`);
      }else{
        const key=`${context}|${prelude}|${normalize(source.slice(bodyStart,bodyEnd))}`;
        const range={start:selectorStart(source,cursor,open),end:close+1,prelude,context};
        const previous=seen.get(key);
        if(previous) removals.push(previous);
        seen.set(key,range);
      }
    }
    cursor=close+1;
  }
}

parseRegion(0,source.length);

// Ranges can only be repeated leaf rules, but de-duplicate/merge defensively.
const ordered=[...new Map(removals.map(r=>[`${r.start}:${r.end}`,r])).values()]
  .sort((a,b)=>b.start-a.start);
let output=source;
for(const range of ordered) output=output.slice(0,range.start)+output.slice(range.end);

if(output!==source) await writeFile(target,output,'utf8');
console.log(`Exact CSS dedupe: removed ${ordered.length} earlier duplicate leaf rule(s); retained the last occurrence of each rule so cascade behavior is unchanged.`);
