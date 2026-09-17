import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl=(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const siteDir=process.env.AUDIT_SITE_DIR||'_site';
const scope=process.env.LAYOUT_AUDIT_SCOPE||'all';
const widths=(process.env.LAYOUT_AUDIT_WIDTHS||'375,390,430,768,1024,1440').split(',').map(Number).filter(Boolean);

const files=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(full);
    else if(entry.name.endsWith('.html')) files.push(full);
  }
}
walk(siteDir);
const source=new Map(files.map(file=>[file,fs.readFileSync(file,'utf8')]));
const faqFiles=files.filter(file=>source.get(file).includes('faq-topic'));
const quoteFiles=files.filter(file=>source.get(file).includes('smart-quote-layout')&&source.get(file).includes('category-card'));
const heroFiles=files.filter(file=>/class=["'][^"']*\bhero\b/.test(source.get(file)));

if((scope==='faq'||scope==='all')&&!faqFiles.length) throw new Error('Layout authority browser audit: no FAQ pages discovered.');
if((scope==='quote'||scope==='all')&&!quoteFiles.length) throw new Error('Layout authority browser audit: no smart quote pages discovered.');

function urlFor(file){
  let rel=file.slice(siteDir.length).replace(/\\/g,'/');
  rel=rel.replace(/index\.html$/,'');
  return baseUrl+rel;
}

const browser=await chromium.launch({headless:true});
const failures=[];
let checks=0;

for(const width of widths){
  const page=await browser.newPage({viewport:{width,height:1200}});

  if(scope==='faq'||scope==='all'){
    for(const file of faqFiles){
      await page.goto(urlFor(file),{waitUntil:'networkidle'});
      const result=await page.evaluate(()=>{
        const topics=[...document.querySelectorAll('section.faq-topic')];
        const topicBands=topics.map(el=>{const c=getComputedStyle(el);return {pt:parseFloat(c.paddingTop)||0,pb:parseFloat(c.paddingBottom)||0}});
        const header=document.querySelector('.site-header');
        const main=document.querySelector('main');
        const firstHeading=main?.querySelector('h1,h2');
        const gap=header&&firstHeading?firstHeading.getBoundingClientRect().top-header.getBoundingClientRect().bottom:null;
        const axisChecks=topics.map(topic=>{
          const heading=topic.querySelector(':scope > h2');
          const disclosure=topic.querySelector(':scope > .faq > details');
          if(!heading||!disclosure) return null;
          const h=heading.getBoundingClientRect(), d=disclosure.getBoundingClientRect();
          return {headingLeft:h.left,disclosureLeft:d.left};
        }).filter(Boolean);
        return {topicBands,gap,axisChecks,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
      });
      if(result.topicBands.some(x=>x.pt>=50||x.pb>=50)) failures.push(`${file} @${width}: nested FAQ topic inherited page-band padding ${JSON.stringify(result.topicBands)}`);
      if(result.gap!=null&&result.gap>190) failures.push(`${file} @${width}: header-to-first-heading gap ${result.gap.toFixed(1)}px`);
      for(const axis of result.axisChecks) if(Math.abs(axis.headingLeft-axis.disclosureLeft)>2) failures.push(`${file} @${width}: FAQ heading/disclosure axis drift ${(axis.headingLeft-axis.disclosureLeft).toFixed(1)}px`);
      if(result.overflow>1) failures.push(`${file} @${width}: horizontal overflow ${result.overflow}px`);
      checks++;
    }
  }

  if(scope==='all'){
    const partnerFiles=files.filter(file=>source.get(file).includes('partner-grid-memberships')&&source.get(file).includes('partner-cta'));
    for(const file of partnerFiles){
      await page.goto(urlFor(file),{waitUntil:'networkidle'});
      const result=await page.evaluate(()=>{
        const cta=document.querySelector('.partner-memberships .partner-cta');
        const grid=document.querySelector('.partner-memberships .partner-grid-memberships');
        if(!cta||!grid) return null;
        const c=cta.getBoundingClientRect(), g=grid.getBoundingClientRect();
        return {ctaCenter:c.left+c.width/2,gridCenter:g.left+g.width/2,ctaWidth:c.width,gridWidth:g.width};
      });
      if(!result) failures.push(`${file} @${width}: membership CTA or grid missing`);
      else if(Math.abs(result.ctaCenter-result.gridCenter)>2||result.ctaWidth+2<result.gridWidth) failures.push(`${file} @${width}: membership CTA is not centred to the card grid ${JSON.stringify(result)}`);
      checks++;
    }
  }

  if(scope==='quote'||scope==='all'){
    for(const file of quoteFiles){
      await page.goto(urlFor(file),{waitUntil:'networkidle'});
      const result=await page.evaluate(()=>{
        const details=document.querySelector('details.quote-deep-details');
        if(details) details.open=true;
        const cards=[...document.querySelectorAll('.smart-quote-layout .category-card')].filter(el=>el.getBoundingClientRect().width>0);
        const rows=[...document.querySelectorAll('.smart-quote-layout .option-row')].filter(el=>el.getBoundingClientRect().width>0);
        const steps=[...document.querySelectorAll('.smart-quote-layout .quote-step')].filter(el=>el.getBoundingClientRect().width>0);
        const footer=document.querySelector('.site-footer .footer-bottom');
        const copyright=footer?.querySelector(':scope > span:first-child');
        const utilities=footer?.querySelector(':scope > span:last-child');
        const pricing=document.querySelector('.quote-deep-details > section.pricing-licensing-clarity');
        const pricingHead=pricing?.querySelector('.section-head');
        const pricingGrid=pricing?.querySelector('.card-grid');
        const pricingActions=pricing?.querySelector('.button-row');
        const legal=document.querySelector('.quote-deep-details > section.quote-legal-bridge');
        const local=[];

        for(const card of cards){
          const cr=card.getBoundingClientRect();
          const info=card.querySelector('.info-tip');
          const desc=card.querySelector('em');
          const title=card.querySelector('strong');
          const input=card.querySelector('input');
          const nodes=[info,desc,title,input].filter(Boolean);
          const bottoms=nodes.map(n=>n.getBoundingClientRect().bottom);
          const slack=bottoms.length?cr.bottom-Math.max(...bottoms):cr.height;
          const pos=info?getComputedStyle(info).position:null;
          const ir=info?.getBoundingClientRect();
          if(pos!=='static') local.push(`info position=${pos}`);
          if(slack>34) local.push(`bottom slack=${slack.toFixed(1)}px`);
          if(ir&&(ir.left<cr.left-1||ir.right>cr.right+1||ir.top<cr.top-1||ir.bottom>cr.bottom+1)) local.push('info control outside card bounds');
        }

        for(let i=1;i<steps.length;i++){
          const prev=steps[i-1].getBoundingClientRect();
          const cur=steps[i].getBoundingClientRect();
          const gap=cur.top-prev.bottom;
          if(gap>20) local.push(`quote-step gap=${gap.toFixed(1)}px`);
        }
        for(const row of rows){
          const input=row.querySelector(':scope > input[type="radio"]');
          const span=row.querySelector(':scope > span');
          const info=span?.querySelector(':scope > .info-tip');
          if(!input||!span||!info) continue;
          const rr=row.getBoundingClientRect(), ir=input.getBoundingClientRect(), sr=span.getBoundingClientRect(), tr=info.getBoundingClientRect();
          if(Math.abs((ir.top+ir.height/2)-(rr.top+rr.height/2))>4) local.push('radio not vertically centered');
          if(Math.abs((tr.top+tr.height/2)-(rr.top+rr.height/2))>4) local.push('info not vertically centered');
          const rightSlack=rr.right-tr.right;
          const leftSlack=ir.left-rr.left;
          if(rightSlack<8||rightSlack>22) local.push(`info right slack=${rightSlack.toFixed(1)}px`);
          if(leftSlack<8||leftSlack>22) local.push(`radio left slack=${leftSlack.toFixed(1)}px`);
          if(sr.right<rr.right-24) local.push('option copy span does not reach right side');
          if(ir.width<23||ir.height<23||tr.width<43||tr.height<43) local.push('quote choice target too small');
        }

        if(footer&&copyright&&utilities&&innerWidth>=1024){
          const fr=footer.getBoundingClientRect(), ar=copyright.getBoundingClientRect(), br=utilities.getBoundingClientRect();
          if(Math.abs(ar.left-fr.left)>2) local.push(`footer copyright left offset=${(ar.left-fr.left).toFixed(1)}px`);
          if(Math.abs(fr.right-br.right)>2) local.push(`footer utilities right offset=${(fr.right-br.right).toFixed(1)}px`);
          if(br.height>48) local.push(`footer utilities wrap=${br.height.toFixed(1)}px`);
        }

        if(pricing&&pricingHead&&pricingGrid&&pricingActions&&legal){
          const pr=pricing.getBoundingClientRect(), hr=pricingHead.getBoundingClientRect(), gr=pricingGrid.getBoundingClientRect(), ar=pricingActions.getBoundingClientRect(), lr=legal.getBoundingClientRect();
          const introGap=gr.top-hr.bottom;
          const actionsBottomSpace=pr.bottom-ar.bottom;
          if(introGap<24) local.push(`pricing intro-to-cards gap=${introGap.toFixed(1)}px`);
          if(actionsBottomSpace<16) local.push(`pricing actions bottom space=${actionsBottomSpace.toFixed(1)}px`);
          if(lr.top<pr.bottom-1) local.push('legal bridge overlaps pricing section');
        }

        return {count:cards.length,rowCount:rows.length,failures:local,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
      });
      if(!result.count) failures.push(`${file} @${width}: no quote category cards rendered`);
      if(!result.rowCount) failures.push(`${file} @${width}: no quote option rows rendered`);
      for(const failure of result.failures) failures.push(`${file} @${width}: ${failure}`);
      if(result.overflow>1) failures.push(`${file} @${width}: horizontal overflow ${result.overflow}px`);
      checks++;
    }
  }

  if(scope==='hero'||scope==='all'){
    for(const file of heroFiles){
      await page.goto(urlFor(file),{waitUntil:'networkidle'});
      const result=await page.evaluate(()=>{
        const header=document.querySelector('.site-header');
        const hero=document.querySelector('main .hero, main>section.hero, .hero');
        if(!header||!hero) return null;
        const headerBottom=header.getBoundingClientRect().bottom;
        const heroTop=hero.getBoundingClientRect().top;
        const gap=heroTop-headerBottom;
        const crumb=document.querySelector('main .crumb');
        let visibleCrumb=false;
        let crumbOccupiesGap=false;
        if(crumb){
          const cs=getComputedStyle(crumb);
          const cr=crumb.getBoundingClientRect();
          visibleCrumb=cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity)!==0&&cr.width>0&&cr.height>0&&crumb.textContent.trim().length>0;
          crumbOccupiesGap=visibleCrumb&&cr.top>=headerBottom-1&&cr.bottom<=heroTop+1;
        }
        return {gap,visibleCrumb,crumbOccupiesGap,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
      });
      if(result){
        const maxGap=result.crumbOccupiesGap?72:4;
        if(result.gap>maxGap) failures.push(`${file} @${width}: unexplained header-to-hero box gap ${result.gap.toFixed(1)}px (visible breadcrumb=${result.visibleCrumb})`);
        if(result.gap>4&&!result.crumbOccupiesGap) failures.push(`${file} @${width}: gap is not occupied by visible navigation content`);
        if(result.overflow>1) failures.push(`${file} @${width}: horizontal overflow ${result.overflow}px`);
      }
      checks++;
    }
  }

  await page.close();
}
await browser.close();

if(failures.length){
  console.error(`Layout authority browser audit failed (${failures.length} issue(s), ${checks} route/viewport checks):`);
  for(const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Layout authority browser audit passed (${checks} route/viewport checks; scope=${scope}).`);
