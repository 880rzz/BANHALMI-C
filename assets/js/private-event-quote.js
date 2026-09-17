/* BANHALMI private celebrations & family milestones quote adapter.
   Keeps the existing event calculator/PDF engine, while separating private-family
   pricing and intent from C-Level Event Photography. */
(function(){
  'use strict';

  var FALLBACK={event60:390,event120:590,event180:790,event240:990};
  var corporate=null;
  var privatePrices=Object.assign({},FALLBACK);
  var quotePaths=['/requestaquote/','/hu/ajanlatkeres/','/de-at/anfrage/'];
  var copy={
    en:{title:'Private celebrations & family milestones',desc:'Milestone birthdays, anniversaries and small family gatherings.',dur:{event60:'1 hour — short celebration, toast, cake or family portraits',event120:'2 hours — arrival, candid moments and family groups · recommended',event180:'3 hours — longer celebration with several programme moments',event240:'4 hours — extended celebration or anniversary'}},
    hu:{title:'Családi események és mérföldkő-ünnepek',desc:'Kerek születésnapokhoz, évfordulókhoz és kisebb családi összejövetelekhez.',dur:{event60:'1 óra — rövid ünneplés, köszöntő, torta vagy családi portrék',event120:'2 óra — érkezés, spontán pillanatok és családi csoportképek · ajánlott',event180:'3 óra — hosszabb ünneplés több programponttal',event240:'4 óra — hosszabb családi ünnepség vagy évforduló'}},
    de:{title:'Private Feiern & Familienjubiläen',desc:'Für runde Geburtstage, Jubiläen und kleine Familienfeiern.',dur:{event60:'1 Stunde — kurze Feier, Toast, Torte oder Familienporträts',event120:'2 Stunden — Ankunft, spontane Momente und Familiengruppen · empfohlen',event180:'3 Stunden — längere Feier mit mehreren Programmpunkten',event240:'4 Stunden — ausgedehnte Familienfeier oder Jubiläum'}}
  };

  function language(form){var raw=(form.getAttribute('data-lang')||document.documentElement.lang||'en').toLowerCase();return raw.indexOf('hu')===0?'hu':raw.indexOf('de')===0?'de':'en';}
  function api(){return window.BANHALMI_QUOTE||null;}
  function form(){return document.querySelector('[data-smart-quote]');}
  function privateInput(f){return f&&f.querySelector('[name="category"][data-private-event="true"]');}
  function isPrivate(f){var p=privateInput(f);return !!(p&&p.checked);}
  function rememberCorporate(){var q=api();if(!q||!q.pricesGross||corporate)return;corporate={event60:Number(q.pricesGross.event60),event120:Number(q.pricesGross.event120),event180:Number(q.pricesGross.event180),event240:Number(q.pricesGross.event240),eventFullDay:Number(q.pricesGross.eventFullDay)};}
  function applyPrices(f){var q=api();if(!q||!q.pricesGross)return;rememberCorporate();var src=isPrivate(f)?privatePrices:corporate;if(!src)return;['event60','event120','event180','event240'].forEach(function(k){q.pricesGross[k]=src[k];});if(corporate&&isFinite(corporate.eventFullDay))q.pricesGross.eventFullDay=corporate.eventFullDay;}
  function setServiceContext(f){if(!f)return;f.setAttribute('data-private-event-active',isPrivate(f)?'true':'false');if(!isPrivate(f))return;var hidden=f.querySelector('input[name="service_context"]');if(!hidden){hidden=document.createElement('input');hidden.type='hidden';hidden.name='service_context';f.appendChild(hidden);}hidden.value='private-event';f.setAttribute('data-service-context','private-event');f.setAttribute('data-service-context-source','selection');document.querySelectorAll('.lang-switch a[hreflang]').forEach(function(link){try{var u=new URL(link.getAttribute('href'),window.location.origin);if(u.origin!==window.location.origin||quotePaths.indexOf(u.pathname)<0)return;u.searchParams.set('service','private-event');link.setAttribute('href',u.pathname+u.search+u.hash);}catch(_){}});}
  function setUrl(f,replace){if(!replace||!isPrivate(f))return;try{var u=new URL(window.location.href);if(quotePaths.indexOf(u.pathname)<0)return;u.searchParams.set('service','private-event');history.replaceState(history.state,'',u.pathname+u.search+u.hash);}catch(_){} }

  function cloneCategoryCard(f){var eventInput=f.querySelector('[name="category"][value="event"]:not([data-private-event])');if(!eventInput)return null;var source=eventInput.closest('label')||eventInput.parentElement;if(!source||source.querySelector('[data-private-event="true"]'))return privateInput(f);var card=source.cloneNode(true),input=card.querySelector('[name="category"]');if(!input)return null;input.checked=false;input.setAttribute('data-private-event','true');input.setAttribute('aria-label',(copy[language(f)]||copy.en).title);var oldId=input.id;if(oldId){input.id=oldId+'-private';card.querySelectorAll('[for="'+oldId+'"]').forEach(function(el){el.setAttribute('for',input.id);});}
    var c=copy[language(f)]||copy.en;
    var title=card.querySelector('strong,h3,h4,b,[class*="title"]');
    var desc=card.querySelector('p,small,[class*="description"],[class*="desc"]');
    if(title)title.textContent=c.title;
    if(desc)desc.textContent=c.desc;
    if(!title&&!desc){Array.prototype.slice.call(card.childNodes).forEach(function(n){if(n!==input&&n.nodeType===3)n.remove();});var span=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=c.title;small.textContent=c.desc;span.appendChild(strong);span.appendChild(document.createElement('br'));span.appendChild(small);card.appendChild(span);}
    source.insertAdjacentElement('afterend',card);
    return input;
  }

  function durationLabels(f,privateMode){var c=copy[language(f)]||copy.en;f.querySelectorAll('[name="event_duration"]').forEach(function(input){var label=input.closest('label');if(!label)return;if(!label.hasAttribute('data-corporate-html'))label.setAttribute('data-corporate-html',label.innerHTML);var code=input.value;if(privateMode){if(code==='eventFullDay'){label.hidden=true;input.disabled=true;if(input.checked){var preferred=f.querySelector('[name="event_duration"][value="event120"]');if(preferred)preferred.checked=true;}return;}label.hidden=false;input.disabled=false;var text=c.dur[code];if(!text)return;var checked=input.checked,id=input.id,type=input.type,name=input.name,value=input.value;label.innerHTML='';var fresh=document.createElement('input');fresh.type=type;fresh.name=name;fresh.value=value;fresh.checked=checked;if(id)fresh.id=id;label.appendChild(fresh);var s=document.createElement('span');s.textContent=text;label.appendChild(s);}else{var html=label.getAttribute('data-corporate-html');if(html!=null)label.innerHTML=html;label.hidden=false;var restored=label.querySelector('[name="event_duration"]');if(restored)restored.disabled=false;}});}

  function sync(f,replaceUrl){if(!f)return;applyPrices(f);durationLabels(f,isPrivate(f));setServiceContext(f);setUrl(f,replaceUrl);var ret=f.querySelector('[name="retouched_images"]');var retLabel=f.querySelector('[data-retouch-label]');if(isPrivate(f)){if(ret)ret.max='500';if(retLabel)retLabel.textContent=language(f)==='hu'?'Becsült átadott képek':language(f)==='de'?'Voraussichtlich gelieferte Bilder':'Estimated delivered images';}
    var q=api();if(q&&typeof q.paint==='function')q.paint(f);
  }

  function requestedPrivate(){try{return (new URLSearchParams(location.search).get('service')||'').toLowerCase()==='private-event';}catch(_){return false;}}
  function loadPrivatePricing(){if(!window.fetch)return Promise.resolve();return fetch('/private-event-pricing.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('private-event-pricing unavailable');return r.json();}).then(function(data){var packages=Array.isArray(data.packages)?data.packages:[];var byHours={};packages.forEach(function(p){byHours[Number(p.durationHours)]=Number(p.grossEUR);});if([1,2,3,4].every(function(h){return isFinite(byHours[h])&&byHours[h]>0;})){privatePrices={event60:byHours[1],event120:byHours[2],event180:byHours[3],event240:byHours[4]};var f=form();if(f&&isPrivate(f))sync(f,false);}}).catch(function(err){console.warn('[BANHALMI private event] Using verified embedded fallback prices.',err);});}

  document.addEventListener('DOMContentLoaded',function(){var f=form();if(!f)return;var p=cloneCategoryCard(f);rememberCorporate();if(p&&requestedPrivate()){p.checked=true;var d=f.querySelector('[name="event_duration"][value="event120"]');if(d)d.checked=true;}sync(f,false);loadPrivatePricing();[100,500,1500,3000].forEach(function(ms){setTimeout(function(){var current=form();if(current&&isPrivate(current))sync(current,false);},ms);});
    document.addEventListener('change',function(ev){if(!f.contains(ev.target))return;applyPrices(f);},true);
    f.addEventListener('change',function(ev){if(ev.target&&ev.target.name==='category')sync(f,true);else if(isPrivate(f))sync(f,false);});
    f.addEventListener('input',function(){if(isPrivate(f))applyPrices(f);});
  });
})();
