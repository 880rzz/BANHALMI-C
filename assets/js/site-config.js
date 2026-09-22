/* BANHALMI multilingual runtime configuration — single domain, workers.dev gateway. */
window.BANHALMI_CONFIG = Object.assign({}, window.BANHALMI_CONFIG || {}, {
  formEndpoint: "https://banhalmi-form-gateway.6ymnrwgnv9.workers.dev/api/banhalmi-form",
  submissionMode: "cloudflare-workers-dev-language-payload",
  siteLanguage: document.documentElement.lang || "en",
  siteDomain: "www.norbertbanhalmi.com",
  supportEmail: "hello@norbertbanhalmi.com",
  analyticsMeasurementId: "G-90C452LJKQ"
});

/* Load the canonical mobile-to-4K rhythm before shared navigation. */
(function loadFluidRhythm(){
  'use strict';
  if(document.querySelector('link[data-fluid-4k-rhythm]')) return;
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/assets/css/fluid-4k-rhythm.css?v=20260914-rhythm';
  link.setAttribute('data-fluid-4k-rhythm','');
  document.head.appendChild(link);
})();

/* Load the shared ART-inspired descriptive navigation on every page. */
(function loadDescriptiveMenu(){
  'use strict';
  if(!document.querySelector('script[data-banhalmi-mega-menu]')){
    var script = document.createElement('script');
    script.src = '/assets/js/mega-menu.js?v=20260921-single-stage-v1';
    script.defer = true;
    script.setAttribute('data-banhalmi-mega-menu','');
    document.head.appendChild(script);
  }
})();

/* Quote-system hardening shared by every language version. */
(function hardenQuoteSystem(){
  'use strict';

  var endpoint = window.BANHALMI_CONFIG.formEndpoint;
  var verifiedDelivery = false;
  var storagePrefix = 'banhalmi_quote_draft_v1:';

  function languageOf(form){
    var raw = String((form && form.getAttribute('data-lang')) || document.documentElement.lang || 'en').toLowerCase();
    return raw.indexOf('hu') === 0 ? 'hu' : raw.indexOf('de') === 0 ? 'de' : 'en';
  }

  function tomorrowIso(){
    var date = new Date();
    date.setHours(0,0,0,0);
    date.setDate(date.getDate() + 1);
    return date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
  }

  function draftKey(form){
    return storagePrefix + (form.getAttribute('data-lang') || document.documentElement.lang || 'en');
  }

  function hasDraft(form){
    try { return !!localStorage.getItem(draftKey(form)); } catch(e) { return false; }
  }

  function serializeDraft(form){
    var values = {};
    Array.prototype.forEach.call(form.elements || [], function(field){
      if(!field.name || field.name === 'website' || field.type === 'file' || field.type === 'submit' || field.type === 'button') return;
      if(field.type === 'checkbox' || field.type === 'radio'){
        if(!values[field.name]) values[field.name] = [];
        if(field.checked) values[field.name].push(field.value);
      } else {
        values[field.name] = field.value;
      }
    });
    return values;
  }

  function restoreDraft(form){
    var raw;
    try { raw = localStorage.getItem(draftKey(form)); } catch(e) { return; }
    if(!raw) return;
    var values;
    try { values = JSON.parse(raw); } catch(e) { return; }
    Object.keys(values || {}).forEach(function(name){
      var fields = form.querySelectorAll('[name="' + CSS.escape(name) + '"]');
      Array.prototype.forEach.call(fields, function(field){
        var value = values[name];
        if(field.type === 'checkbox' || field.type === 'radio'){
          field.checked = Array.isArray(value) && value.indexOf(field.value) !== -1;
        } else if(typeof value === 'string'){
          field.value = value;
        }
      });
    });
  }

  function saveDraft(form){
    try { localStorage.setItem(draftKey(form), JSON.stringify(serializeDraft(form))); } catch(e) {}
  }

  function clearDraft(form){
    try { localStorage.removeItem(draftKey(form)); } catch(e) {}
  }

  function messageFor(lang, key){
    var messages = {
      en: {
        invalid:'Please check the highlighted fields.',
        required:'This field is required.',
        email:'Please enter a valid email address.',
        phone:'Please enter a valid phone number.',
        consent:'Please confirm the required consent.',
        date:'Please choose a future date.',
        sending:'Sending…',
        sent:'Thank you. Your request has been sent.',
        failed:'The request could not be sent. Please try again or email hello@norbertbanhalmi.com.'
      },
      hu: {
        invalid:'Kérlek ellenőrizd a kiemelt mezőket.',
        required:'A mező kitöltése kötelező.',
        email:'Kérlek adj meg érvényes e-mail címet.',
        phone:'Kérlek adj meg érvényes telefonszámot.',
        consent:'Kérlek erősítsd meg a szükséges hozzájárulást.',
        date:'Kérlek jövőbeli dátumot válassz.',
        sending:'Küldés…',
        sent:'Köszönöm. Az ajánlatkérésed megérkezett.',
        failed:'Az ajánlatkérés nem küldhető el. Próbáld újra, vagy írj a hello@norbertbanhalmi.com címre.'
      },
      de: {
        invalid:'Bitte prüfen Sie die markierten Felder.',
        required:'Dieses Feld ist erforderlich.',
        email:'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
        phone:'Bitte geben Sie eine gültige Telefonnummer ein.',
        consent:'Bitte bestätigen Sie die erforderliche Einwilligung.',
        date:'Bitte wählen Sie ein zukünftiges Datum.',
        sending:'Wird gesendet…',
        sent:'Vielen Dank. Ihre Anfrage wurde gesendet.',
        failed:'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder schreiben Sie an hello@norbertbanhalmi.com.'
      }
    };
    return messages[lang][key];
  }

  function setError(field, message){
    field.setAttribute('aria-invalid','true');
    field.classList.add('is-invalid');
    var id = field.id || field.name;
    var errorId = id + '-error';
    var error = document.getElementById(errorId);
    if(!error){
      error = document.createElement('span');
      error.id = errorId;
      error.className = 'field-error';
      error.setAttribute('role','alert');
      field.insertAdjacentElement('afterend', error);
    }
    error.textContent = message;
    var described = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if(described.indexOf(errorId) === -1) described.push(errorId);
    field.setAttribute('aria-describedby', described.join(' '));
  }

  function clearError(field){
    field.removeAttribute('aria-invalid');
    field.classList.remove('is-invalid');
    var id = field.id || field.name;
    var error = document.getElementById(id + '-error');
    if(error) error.remove();
    var described = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean).filter(function(x){ return x !== id + '-error'; });
    if(described.length) field.setAttribute('aria-describedby', described.join(' '));
    else field.removeAttribute('aria-describedby');
  }

  function validateField(field, lang){
    if(field.disabled || field.type === 'hidden' || field.name === 'website') return true;
    var value = String(field.value || '').trim();
    if(field.required){
      if(field.type === 'checkbox' && !field.checked){ setError(field, messageFor(lang,'consent')); return false; }
      if(field.type !== 'checkbox' && !value){ setError(field, messageFor(lang,'required')); return false; }
    }
    if(value && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)){ setError(field, messageFor(lang,'email')); return false; }
    if(value && field.type === 'tel' && value.replace(/[^0-9+]/g,'').length < 7){ setError(field, messageFor(lang,'phone')); return false; }
    if(value && field.type === 'date' && value < tomorrowIso()){ setError(field, messageFor(lang,'date')); return false; }
    clearError(field);
    return true;
  }

  function validateForm(form){
    var lang = languageOf(form);
    var firstInvalid = null;
    Array.prototype.forEach.call(form.elements || [], function(field){
      if(!validateField(field,lang) && !firstInvalid) firstInvalid = field;
    });
    if(firstInvalid){
      var summary = form.querySelector('.quote-validation-summary');
      if(!summary){
        summary = document.createElement('div');
        summary.className = 'quote-validation-summary';
        summary.setAttribute('role','alert');
        summary.setAttribute('aria-live','assertive');
        form.insertBefore(summary, form.firstChild);
      }
      summary.textContent = messageFor(lang,'invalid');
      summary.hidden = false;
      firstInvalid.focus({preventScroll:true});
      firstInvalid.scrollIntoView({behavior:'smooth',block:'center'});
      return false;
    }
    var summaryOk = form.querySelector('.quote-validation-summary');
    if(summaryOk) summaryOk.hidden = true;
    return true;
  }

  function statusNode(form){
    return form.querySelector('[data-form-status], .form-status, #form-status');
  }

  function setStatus(form, text, state){
    var node = statusNode(form);
    if(!node){
      node = document.createElement('p');
      node.className = 'form-status';
      node.setAttribute('data-form-status','');
      node.setAttribute('role','status');
      node.setAttribute('aria-live','polite');
      form.appendChild(node);
    }
    node.textContent = text;
    node.dataset.state = state || '';
  }

  function payloadFromForm(form){
    var data = {};
    var fd = new FormData(form);
    fd.forEach(function(value,key){
      if(key === 'website') return;
      if(Object.prototype.hasOwnProperty.call(data,key)){
        if(!Array.isArray(data[key])) data[key] = [data[key]];
        data[key].push(value);
      } else data[key] = value;
    });
    data.language = languageOf(form);
    data.page_language = data.language;
    data.page_url = location.href;
    data.submitted_at = new Date().toISOString();
    return data;
  }

  async function submitForm(form){
    var lang = languageOf(form);
    var button = form.querySelector('[type="submit"]');
    if(button) button.disabled = true;
    setStatus(form,messageFor(lang,'sending'),'sending');
    try{
      var response = await fetch(endpoint,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payloadFromForm(form))
      });
      var body = null;
      try { body = await response.json(); } catch(e) {}
      if(!response.ok || !body || body.ok !== true) throw new Error('delivery failed');
      verifiedDelivery = body.adminEmailSent === true && body.customerEmailSent === true;
      if(verifiedDelivery){
        clearDraft(form);
        form.reset();
      }
      setStatus(form,messageFor(lang,'sent'),'success');
    }catch(error){
      setStatus(form,messageFor(lang,'failed'),'error');
    }finally{
      if(button) button.disabled = false;
    }
  }

  function initForm(form){
    if(form.dataset.banhalmiHardened === 'true') return;
    form.dataset.banhalmiHardened = 'true';
    restoreDraft(form);
    Array.prototype.forEach.call(form.elements || [], function(field){
      if(field.type === 'date') field.min = tomorrowIso();
      field.addEventListener('input',function(){ clearError(field); saveDraft(form); });
      field.addEventListener('change',function(){ clearError(field); saveDraft(form); });
      field.addEventListener('blur',function(){ validateField(field,languageOf(form)); });
    });
    form.addEventListener('submit',function(event){
      event.preventDefault();
      if(!validateForm(form)) return;
      submitForm(form);
    });
  }

  function init(){
    document.querySelectorAll('form[data-banhalmi-form], form[data-quote-form], form.quote-form').forEach(initForm);
    window.addEventListener('beforeunload',function(event){
      if(verifiedDelivery) return;
      var dirty = Array.prototype.some.call(document.querySelectorAll('form[data-banhalmi-form], form[data-quote-form], form.quote-form'),function(form){ return hasDraft(form); });
      if(dirty){ event.preventDefault(); event.returnValue=''; }
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

/* Guided quote state contract: start from zero and clear only after both deliveries are verified. */
(function hardenGuidedQuoteState(){
  'use strict';
  var nativeFetch = window.fetch;

  function quoteForms(){
    return document.querySelectorAll('form[data-smart-quote]');
  }

  function createSubmissionKey(){
    if(window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    if(window.crypto && typeof window.crypto.getRandomValues === 'function'){
      var bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 15) | 64;
      bytes[8] = (bytes[8] & 63) | 128;
      var hex = Array.prototype.map.call(bytes,function(value){ return value.toString(16).padStart(2,'0'); }).join('');
      return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
    }
    return 'quote-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
  }

  function ensureSubmissionKey(form, forceNew){
    var field = form.querySelector('input[name="submission_key"]');
    if(!field){
      field = document.createElement('input');
      field.type = 'hidden';
      field.name = 'submission_key';
      form.appendChild(field);
    }
    if(forceNew || !field.value){
      field.value = createSubmissionKey();
      field.defaultValue = field.value;
    }
    return field.value;
  }

  function placePdfAction(form){
    var submitActions = form.querySelector('.quote-submit-actions');
    if(!submitActions) return;
    var button = document.querySelector('[data-download-quote-pdf]');
    if(!button) return;
    var actions = button.closest('.quote-submit-pdf-actions, .quote-actions');
    if(!actions) return;
    actions.classList.add('quote-submit-pdf-actions');
    submitActions.insertAdjacentElement('afterend', actions);
  }

  function markDeliveryState(data){
    var verified = !!(data && data.adminEmailSent === true && data.customerEmailSent === true);
    quoteForms().forEach(function(form){
      form.dataset.deliveryVerified = verified ? 'true' : 'false';
    });
  }

  if(nativeFetch && !window.__BANHALMI_QUOTE_DELIVERY_FETCH_GUARD__){
    window.__BANHALMI_QUOTE_DELIVERY_FETCH_GUARD__ = true;
    window.fetch = function(input, init){
      var requestUrl = typeof input === 'string' ? input : (input && input.url) || '';
      var requestInit = init;
      if(String(requestUrl).indexOf('/api/banhalmi-form') !== -1 && init && typeof init.body === 'string'){
        try{
          var payload = JSON.parse(init.body);
          var form = quoteForms()[0];
          if(form){
            var submissionKey = ensureSubmissionKey(form, false);
            payload.submission_key = payload.submission_key || submissionKey;
            payload.submissionKey = payload.submissionKey || submissionKey;
            requestInit = Object.assign({}, init, {body:JSON.stringify(payload)});
          }
        }catch(e){}
      }
      return nativeFetch.call(this, input, requestInit).then(function(response){
        if(String(requestUrl).indexOf('/api/banhalmi-form') === -1) return response;
        return response.clone().text().then(function(text){
          var data = {};
          try { data = text ? JSON.parse(text) : {}; } catch(e) {}
          markDeliveryState(data);
          return response;
        }).catch(function(){
          markDeliveryState(null);
          return response;
        });
      });
    };
  }

  function initForm(form){
    ensureSubmissionKey(form, false);
    placePdfAction(form);
    form.querySelectorAll('input[type="radio"][name="category"]').forEach(function(input){
      input.checked = false;
    });

    var nativeReset = form.reset.bind(form);
    form.reset = function(){
      if(form.dataset.deliveryVerified !== 'true') return;
      nativeReset();
      form.querySelectorAll('input[type="radio"][name="category"]').forEach(function(input){
        input.checked = false;
      });
      ensureSubmissionKey(form, true);
      delete form.dataset.deliveryVerified;
    };
  }

  function init(){
    quoteForms().forEach(initForm);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
