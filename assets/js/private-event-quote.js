/* BANHALMI private celebrations & family milestones quote adapter.
   Keeps the existing event calculator/PDF engine, while separating private-family
   pricing and intent from C-Level Event Photography. */
(function(){
  'use strict';

  // Generated from private-event-pricing.json; source contract verifies byte semantics.
  window.BANHALMI_PRIVATE_EVENT_PRICING={"source":"private-event-pricing.json","packages":[{"code":"privateEvent60","durationHours":1,"grossEUR":390,"grossHUF":156000,"recommendedFor":"short birthday moment, family portraits, cake or toast"},{"code":"privateEvent120","durationHours":2,"grossEUR":590,"grossHUF":236000,"recommendedFor":"milestone birthday lunch or dinner with arrival, candid coverage and family group portraits","defaultRecommendation":true},{"code":"privateEvent180","durationHours":3,"grossEUR":790,"grossHUF":316000,"recommendedFor":"longer family celebration with several programme moments"},{"code":"privateEvent240","durationHours":4,"grossEUR":990,"grossHUF":396000,"recommendedFor":"extended private celebration or anniversary"}],"included":{"photographers":1,"selectionAndColourCorrection":true,"digitalDelivery":true,"fullResolution":true,"viennaCityOnLocationCoverage":true,"budapestCityOnLocationCoverage":true,"usage":"Private and family use of the delivered images is included. Commercial, campaign, resale, sublicensing or third-party exploitation requires separate review."},"name":{"en":"Private celebrations & family milestones","hu":"Családi események és mérföldkő-ünnepek","de-AT":"Private Feiern & Familienjubiläen"}};
  var privateDuration='event120';
  var quotePaths=['/requestaquote/','/hu/ajanlatkeres/','/de-at/anfrage/'];
  var copy={
    en:{title:'Private celebrations & family milestones',desc:'Milestone birthdays, anniversaries and small family gatherings.',info:'For family celebrations, milestone birthdays, anniversaries and relaxed group portraits.',dur:{event60:'1 hour — short celebration, toast, cake or family portraits',event120:'2 hours — arrival, candid moments and family groups · recommended',event180:'3 hours — longer celebration with several programme moments',event240:'4 hours — extended celebration or anniversary'}},
    hu:{title:'Családi események és mérföldkő-ünnepek',desc:'Kerek születésnapokhoz, évfordulókhoz és kisebb családi összejövetelekhez.',info:'Családi ünnepekhez, kerek születésnapokhoz, évfordulókhoz és kötetlen csoportképekhez.',dur:{event60:'1 óra — rövid ünneplés, köszöntő, torta vagy családi portrék',event120:'2 óra — érkezés, spontán pillanatok és családi csoportképek · ajánlott',event180:'3 óra — hosszabb ünneplés több programponttal',event240:'4 óra — hosszabb családi ünnepség vagy évforduló'}},
    de:{title:'Private Feiern & Familienjubiläen',desc:'Für runde Geburtstage, Jubiläen und kleine Familienfeiern.',info:'Für Familienfeiern, runde Geburtstage, Jubiläen und ungezwungene Gruppenporträts.',dur:{event60:'1 Stunde — kurze Feier, Toast, Torte oder Familienporträts',event120:'2 Stunden — Ankunft, spontane Momente und Familiengruppen · empfohlen',event180:'3 Stunden — längere Feier mit mehreren Programmpunkten',event240:'4 Stunden — ausgedehnte Familienfeier oder Jubiläum'}}
  };

  function language(form){var raw=(form.getAttribute('data-lang')||document.documentElement.lang||'en').toLowerCase();return raw.indexOf('hu')===0?'hu':raw.indexOf('de')===0?'de':'en';}
  function api(){return window.BANHALMI_QUOTE||null;}
  function form(){return document.querySelector('[data-smart-quote]');}
  function privateInput(f){return f&&f.querySelector('[name="category"][data-private-event="true"]');}
  function isPrivate(f){var p=privateInput(f);return !!(p&&p.checked);}
  function setServiceContext(f){if(!f)return;f.setAttribute('data-private-event-active',isPrivate(f)?'true':'false');if(!isPrivate(f))return;var hidden=f.querySelector('input[name="service_context"]');if(!hidden){hidden=document.createElement('input');hidden.type='hidden';hidden.name='service_context';f.appendChild(hidden);}hidden.value='private-event';f.setAttribute('data-service-context','private-event');f.setAttribute('data-service-context-source','selection');document.querySelectorAll('.lang-switch a[hreflang]').forEach(function(link){try{var u=new URL(link.getAttribute('href'),window.location.origin);if(u.origin!==window.location.origin||quotePaths.indexOf(u.pathname)<0)return;u.searchParams.set('service','private-event');link.setAttribute('href',u.pathname+u.search+u.hash);}catch(_){}});}
  function setUrl(f,replace){if(!replace||!isPrivate(f))return;try{var u=new URL(window.location.href);if(quotePaths.indexOf(u.pathname)<0)return;u.searchParams.set('service','private-event');history.replaceState(history.state,'',u.pathname+u.search+u.hash);}catch(_){} }

  function cloneCategoryCard(f){var eventInput=f.querySelector('[name="category"][value="event"]:not([data-private-event])');if(!eventInput)return null;var source=eventInput.closest('label')||eventInput.parentElement;if(!source||source.querySelector('[data-private-event="true"]'))return privateInput(f);var card=source.cloneNode(true),input=card.querySelector('[name="category"]');if(!input)return null;input.checked=false;input.setAttribute('data-private-event','true');input.setAttribute('aria-label',(copy[language(f)]||copy.en).title);var oldId=input.id;if(oldId){input.id=oldId+'-private';if(card.getAttribute('for')===oldId)card.setAttribute('for',input.id);card.querySelectorAll('[for="'+oldId+'"]').forEach(function(el){el.setAttribute('for',input.id);});}
    var c=copy[language(f)]||copy.en;
    var title=card.querySelector('strong,h3,h4,b,[class*="title"]');
    var desc=card.querySelector('[data-category-description],em,p,small,[class*="description"],[class*="desc"]');
    if(title)title.textContent=c.title;
    if(desc){desc.setAttribute('data-category-description','private-event');desc.textContent=c.desc;}
    var tip=card.querySelector('.info-tip,[data-tooltip]');
    if(tip){tip.setAttribute('aria-label',c.info);if(tip.hasAttribute('data-tooltip'))tip.setAttribute('data-tooltip',c.info);}
    if(!title&&!desc){Array.prototype.slice.call(card.childNodes).forEach(function(n){if(n!==input&&n.nodeType===3)n.remove();});var span=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=c.title;small.textContent=c.desc;span.appendChild(strong);span.appendChild(document.createElement('br'));span.appendChild(small);card.appendChild(span);}
    source.insertAdjacentElement('afterend',card);
    return input;
  }

  function durationLabels(f,privateMode){var c=copy[language(f)]||copy.en;f.querySelectorAll('[name="event_duration"]').forEach(function(input){var label=input.closest('label');if(!label)return;if(!label.hasAttribute('data-corporate-html'))label.setAttribute('data-corporate-html',label.innerHTML);var code=input.value;if(privateMode){if(code==='eventBusiness'||code==='eventFullDay'){label.hidden=true;input.disabled=true;if(input.checked){var preferred=f.querySelector('[name="event_duration"][value="'+privateDuration+'"]');if(preferred)preferred.checked=true;}return;}label.hidden=false;input.disabled=false;var text=c.dur[code];if(!text)return;var checked=input.checked,id=input.id,type=input.type,name=input.name,value=input.value;label.innerHTML='';var fresh=document.createElement('input');fresh.type=type;fresh.name=name;fresh.value=value;fresh.checked=checked;if(id)fresh.id=id;label.appendChild(fresh);var s=document.createElement('span');var item=window.BANHALMI_PRIVATE_EVENT_PRICING.packages.find(function(p){return p.durationHours===({event60:1,event120:2,event180:3,event240:4})[code];});var hu=language(f)==='hu';s.textContent=text+(item?' \u00b7 '+new Intl.NumberFormat(hu?'hu-HU':language(f)==='de'?'de-AT':'en-GB',{style:'currency',currency:hu?'HUF':'EUR',maximumFractionDigits:0}).format(hu?item.grossHUF:item.grossEUR):'');label.appendChild(s);}else{var html=label.getAttribute('data-corporate-html');if(html!=null)label.innerHTML=html;label.hidden=false;var restored=label.querySelector('[name="event_duration"]');if(restored)restored.disabled=false;}});}

  function sync(f,replaceUrl){if(!f)return;var privateMode=isPrivate(f);if(f.getAttribute('data-private-mode-rendered')!==String(privateMode)){durationLabels(f,privateMode);f.setAttribute('data-private-mode-rendered',String(privateMode));}setServiceContext(f);setUrl(f,replaceUrl);var ret=f.querySelector('[name="retouched_images"]');var retLabel=f.querySelector('[data-retouch-label]');if(isPrivate(f)){if(ret)ret.max='500';if(retLabel)retLabel.textContent=language(f)==='hu'?'Becsült átadott képek':language(f)==='de'?'Voraussichtlich gelieferte Bilder':'Estimated delivered images';}
    f.querySelectorAll('[data-private-event-guide]').forEach(function(el){el.hidden=!isPrivate(f);});f.querySelectorAll('[data-corporate-event-guide]').forEach(function(el){el.hidden=isPrivate(f);});
    var q=api();if(q&&typeof q.paint==='function')q.paint(f);
  }

  function requestedPrivate(){try{return (new URLSearchParams(location.search).get('service')||'').toLowerCase()==='private-event';}catch(_){return false;}}
  document.addEventListener('DOMContentLoaded',function(){
    var f=form();if(!f)return;var p=cloneCategoryCard(f);
    if(p&&requestedPrivate()){p.checked=true;var d=f.querySelector('[name="event_duration"][value="'+privateDuration+'"]');if(d)d.checked=true;}
    sync(f,false);
    f.addEventListener('change',function(ev){
      if(isPrivate(f)&&ev.target.name==='event_duration')privateDuration=ev.target.value;
      if(ev.target.name==='private_event_city'){
        var country=f.querySelector('[name="travel_country"]');
        if(country&&ev.target.value==='vienna')country.value='AT';
        if(country&&ev.target.value==='budapest')country.value='HU';
      }
      if(ev.target.name==='category')sync(f,true);else if(isPrivate(f))sync(f,false);
    });
    f.addEventListener('reset',function(){setTimeout(function(){sync(f,false);},0);});
  });
})();
