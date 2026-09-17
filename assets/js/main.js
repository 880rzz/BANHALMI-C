/* NORBERTBANHALMI.COM — minimal interactions. No analytics loads before consent. */
(function () {
  "use strict";

  // Mobile menu
  var nav = document.querySelector(".nav");
  var btn = document.querySelector(".menu-btn");
  var navSubmenus = nav ? Array.prototype.slice.call(nav.querySelectorAll(".nav-submenu")) : [];
  function closeNavSubmenus() {
    navSubmenus.forEach(function (submenu) {
      submenu.removeAttribute("open");
    });
  }
  if (btn && nav) {
    btn.addEventListener("click", function () {
      nav.classList.toggle("open");
      var isOpen = nav.classList.contains("open");
      document.documentElement.classList.toggle("nav-open", isOpen);
      btn.setAttribute("aria-expanded", isOpen);
      if (!isOpen) closeNavSubmenus();
    });
    nav.querySelectorAll(".nav-links a,.lang-switch a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        document.documentElement.classList.remove("nav-open");
        btn.setAttribute("aria-expanded", "false");
        closeNavSubmenus();
      });
    });
  }



  // Production 2.3 navigation hardening: close on outside click and Escape.
  document.addEventListener("click", function (event) {
    if (!nav ||!btn ||!nav.classList.contains("open")) return;
    if (!nav.contains(event.target)) {
      nav.classList.remove("open");
      document.documentElement.classList.remove("nav-open");
      btn.setAttribute("aria-expanded", "false");
      closeNavSubmenus();
    }
  });
  document.addEventListener("keydown", function (event) {
    if (!nav ||!btn) return;
    if (event.key === "Escape" && nav.classList.contains("open")) {
      nav.classList.remove("open");
      document.documentElement.classList.remove("nav-open");
      btn.setAttribute("aria-expanded", "false");
      closeNavSubmenus();
      btn.focus();
    }
  });





  // Production audit: accessible Services submenu and gallery lightbox.

  // Footer groups are native disclosures at every viewport. Automatically
  // opening them on desktop created a second, needlessly tall footer row.
  var footerAccordions = Array.prototype.slice.call(document.querySelectorAll("details.footer-accordion"));
  if (footerAccordions.length) {
    footerAccordions.forEach(function (details) { details.open = false; });
  }

  // Scroll reveal (respects reduced motion)
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var items = document.querySelectorAll(".reveal");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    // Register below-fold reveal targets in small frame batches instead of
    // one startup loop. This preserves the visual behavior while keeping the
    // initial main-thread task short on mobile CPUs.
    var revealIndex = 0;
    function observeRevealBatch() {
      var end = Math.min(revealIndex + 8, items.length);
      while (revealIndex < end) {
        io.observe(items[revealIndex]);
        revealIndex += 1;
      }
      if (revealIndex < items.length) window.requestAnimationFrame(observeRevealBatch);
    }
    if (items.length) window.requestAnimationFrame(observeRevealBatch);
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // Versioned cookie/optional-service consent gate.
  var KEY = "banhalmi_consent_v3";
  var CONSENT_VERSION = "3.0";
  var CONSENT_TTL_MS = 180 * 24 * 60 * 60 * 1000;
  var bar = document.querySelector(".cookie");
  function readChoice() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) {
        ["banhalmi_consent", "banhalmi_consent_v2"].forEach(function (legacyKey) {
          if (localStorage.getItem(legacyKey)) localStorage.removeItem(legacyKey);
        });
        return null;
      }
      var data = JSON.parse(raw);
      if (!data || data.version !== CONSENT_VERSION || !data.savedAt || Date.now() - data.savedAt > CONSENT_TTL_MS) {
        localStorage.removeItem(KEY); return null;
      }
      return data.choice;
    } catch (e) { return null; }
  }
  function saveChoice(choice) {
    try { localStorage.setItem(KEY, JSON.stringify({choice:choice,version:CONSENT_VERSION,savedAt:Date.now(),expiresAt:Date.now()+CONSENT_TTL_MS})); } catch (e) {}
  }
  function hasReviewComponent() { return !!document.querySelector('[data-third-party-reviews="true"]'); }
  var reviewDetails = null;
  var reviewDetailsHandler = null;
  var reviewLoaderArmed = false;
  var reviewScriptsLoading = false;

  function findReviewDetails(target) {
    if (!target) return null;
    if (target.matches && target.matches("details")) return target;
    return target.querySelector("details.review-drawer") || target.querySelector("details") || target.closest("details");
  }

  function hasScriptSource(fragment) {
    return Array.prototype.some.call(document.scripts, function (script) {
      return String(script.src || "").indexOf(fragment) !== -1;
    });
  }

  function reviewCopy() {
    var lang = String(document.documentElement.lang || "en").toLowerCase();
    if (lang.indexOf("hu") === 0) return {
      note: "A Google-vélemények külső szolgáltatáson keresztül töltődnek be. A megjelenítéshez fogadja el az opcionális szolgáltatásokat.",
      button: "Süti-beállítások megnyitása",
      loading: "Az ügyfélvélemények betöltése…"
    };
    if (lang.indexOf("de") === 0) return {
      note: "Google-Bewertungen werden über einen externen Dienst geladen. Bitte akzeptieren Sie optionale Dienste, um sie anzuzeigen.",
      button: "Cookie-Einstellungen öffnen",
      loading: "Kundenstimmen werden geladen…"
    };
    return {
      note: "Google reviews are loaded through an external service. Please accept optional services to display them.",
      button: "Open cookie settings",
      loading: "Loading client reviews…"
    };
  }

  function getReviewWidget(details) {
    return details ? details.querySelector('[class*="elfsight-app-"]') : null;
  }

  function removeReviewConsentNote(details) {
    if (!details) return;
    var note = details.querySelector(".reviews-consent-note");
    if (note) note.remove();
  }

  function showReviewConsentNote(details) {
    if (!details || details.querySelector(".reviews-consent-note")) return;
    var copy = reviewCopy();
    var widget = getReviewWidget(details);
    var note = document.createElement("div");
    note.className = "reviews-consent-note";
    note.setAttribute("role", "status");
    var text = document.createElement("p");
    text.textContent = copy.note;
    var button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-ghost";
    button.textContent = copy.button;
    button.addEventListener("click", function () { openCookieSettings(); });
    note.appendChild(text);
    note.appendChild(button);
    if (widget) details.insertBefore(note, widget); else details.appendChild(note);
  }

  function setReviewLoading(details, isLoading) {
    if (!details) return;
    var widget = getReviewWidget(details);
    if (!widget) return;
    if (isLoading) {
      var copy = reviewCopy();
      widget.setAttribute("aria-busy", "true");
      widget.setAttribute("data-loading-label", copy.loading);
      details.classList.add("reviews-loading");
    } else {
      widget.removeAttribute("aria-busy");
      details.classList.remove("reviews-loading");
    }
  }

  function loadReviewScripts() {
    if (!hasReviewComponent() || reviewScriptsLoading) return;
    var target = document.querySelector('[data-third-party-reviews="true"]');
    var details = findReviewDetails(target);
    if (details && !details.open) return;

    reviewScriptsLoading = true;
    removeReviewConsentNote(details);
    setReviewLoading(details, true);

    // Wait until the opened <details> element has a measurable layout before
    // Elfsight scans the widget container.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        if (document.querySelector('[class*="elfsight-app-"]') && !hasScriptSource("elfsightcdn.com/platform.js")) {
          var ef = document.createElement("script");
          ef.id = "elfsight-platform";
          ef.defer = true;
          ef.async = true;
          ef.src = "https://elfsightcdn.com/platform.js";
          ef.addEventListener("load", function () { setReviewLoading(details, false); });
          ef.addEventListener("error", function () {
            reviewScriptsLoading = false;
            setReviewLoading(details, false);
          });
          document.head.appendChild(ef);
        } else {
          setReviewLoading(details, false);
        }
      });
    });
  }

  function setupReviewLoader() {
    if (!hasReviewComponent() || reviewLoaderArmed) return;
    var target = document.querySelector('[data-third-party-reviews="true"]');
    reviewDetails = findReviewDetails(target);
    if (!reviewDetails) {
      reviewLoaderArmed = true;
      if (readChoice() === "all") loadReviewScripts();
      return;
    }

    reviewLoaderArmed = true;
    reviewDetailsHandler = function () {
      if (!reviewDetails || !reviewDetails.open) return;
      if (readChoice() === "all") loadReviewScripts();
      else {
        showReviewConsentNote(reviewDetails);
        openCookieSettings();
      }
    };
    reviewDetails.addEventListener("toggle", reviewDetailsHandler);
    if (reviewDetails.open) reviewDetailsHandler();
  }

  function grant() {
    if (window.BANHALMI_ANALYTICS && typeof window.BANHALMI_ANALYTICS.grant === "function") window.BANHALMI_ANALYTICS.grant();
    setupReviewLoader();
    removeReviewConsentNote(reviewDetails);
    if (reviewDetails && reviewDetails.open) loadReviewScripts();
  }

  function revokeThirdPartyScripts() {
    if (window.BANHALMI_ANALYTICS && typeof window.BANHALMI_ANALYTICS.revoke === "function") window.BANHALMI_ANALYTICS.revoke();
    reviewScriptsLoading = false;
    ["elfsight-platform"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    document.querySelectorAll('iframe[src*="elfsight"],script[src*="elfsight"]').forEach(function (el) { el.remove(); });
    document.querySelectorAll('[class*="elfsight-app-"]').forEach(function (widget) {
      widget.innerHTML = "";
      widget.removeAttribute("aria-busy");
    });
    if (reviewDetails && reviewDetails.open) showReviewConsentNote(reviewDetails);
  }

  function openCookieSettings() {
    if (!bar) return;
    bar.classList.add("show");
    var first = bar.querySelector("button");
    if (first) first.focus({preventScroll:true});
  }

  setupReviewLoader();
  if (bar) {
    var initialChoice = readChoice();
    if (!initialChoice) bar.classList.add("show");
    else if (initialChoice === "all") grant();
    var accept = bar.querySelector("[data-accept]"), decline = bar.querySelector("[data-decline]");
    if (accept) accept.addEventListener("click", function () {
      saveChoice("all");
      bar.classList.remove("show");
      grant();
    });
    if (decline) decline.addEventListener("click", function () {
      var wasAll = readChoice() === "all";
      saveChoice("essential");
      revokeThirdPartyScripts();
      bar.classList.remove("show");
      if (wasAll) window.location.reload();
    });
  }
  document.querySelectorAll("[data-cookie-settings]").forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      openCookieSettings();
    });
  });


  // Budget guidance for the guided quote builder
  document.querySelectorAll('[data-budget-select]').forEach(function(sel){
    var box = document.querySelector(sel.getAttribute('data-target'));
    var lang = sel.getAttribute('data-lang') || 'en';
    var copy = {
      en: {
        small:'This usually fits a focused 30-minute Executive Headshot: one strong portrait for LinkedIn, press or a website profile.',
        medium:'This usually fits an Executive Portrait session with calmer preparation, guided image selection and more strategic use.',
        large:'This can support Personal Branding or a broader portrait set for website, media and public communication.',
        xlarge:'This range is suitable for team, event or corporate visual systems, depending on scope and usage rights.',
        custom:'For larger or mixed projects, a personal quote is the right way to define scope, licensing and delivery rhythm.',
        unsure:'If the budget is not clear yet, describe the result you need. I will recommend the smallest format that can honestly do the job.'
      },
      hu: {
        small:'Ez jellemzően egy fókuszált, 30 perces Executive Headshot keret: egy erős portré LinkedInre, sajtóhoz vagy weboldalra.',
        medium:'Ebbe általában egy nyugodtabb Executive Portrait folyamat fér bele, előkészítéssel, irányított képkiválasztással és stratégiai felhasználással.',
        large:'Ez már alkalmas personal branding vagy több képből álló portrésorozat tervezésére weboldalra, médiára és nyilvános kommunikációra.',
        xlarge:'Ez a tartomány csapat-, rendezvény- vagy vállalati vizuális rendszerhez illik, a terjedelemtől és felhasználási jogoktól függően.',
        custom:'Nagyobb vagy vegyes projektnél személyes ajánlat szükséges, hogy a terjedelem, jogok és átadási ritmus tiszta legyen.',
        unsure:'Ha még nem biztos a keret, írja le, milyen eredményre van szüksége. A legkisebb korrekt formátumot fogom javasolni.'
      },
      de: {
        small:'Das passt meist zu einem fokussierten 30-Minuten Executive Headshot: ein starkes Portrait für LinkedIn, Presse oder Website.',
        medium:'Das passt meist zu einer Executive Portrait Session mit ruhiger Vorbereitung, geführter Auswahl und strategischer Nutzung.',
        large:'Damit lässt sich Personal Branding oder ein breiteres Portrait-Set für Website, Medien und öffentliche Kommunikation planen.',
        xlarge:'Dieser Rahmen eignet sich für Team-, Event- oder Corporate-Visual-Systeme, abhängig von Umfang und Nutzungsrechten.',
        custom:'Für größere oder gemischte Projekte ist ein persönliches Angebot sinnvoll, damit Umfang, Rechte und Lieferung klar sind.',
        unsure:'Wenn das Budget noch offen ist, beschreiben Sie das gewünschte Ergebnis. Ich empfehle das kleinste Format, das die Aufgabe ehrlich erfüllen kann.'
      }
    };
    function update(){
      if(!box) return;
      while(box.firstChild){ box.removeChild(box.firstChild); }
      var strong = document.createElement('strong');
      strong.textContent = (sel.options[sel.selectedIndex]? sel.options[sel.selectedIndex].text: '');
      box.appendChild(strong);
      box.appendChild(document.createElement('br'));
      box.appendChild(document.createTextNode((copy[lang][sel.value] || '')));
    }
    sel.addEventListener('change', update); update();
  });


  // Contact and quote forms — send JSON to the configured endpoint.
  // Forms require a verified JSON-capable endpoint. Use the first-party Worker route in site-config.js.
  function readField(form, name) {
    var checked = form.querySelector('[name="' + name + '"]:checked');
    if (checked) return String(checked.value || '').trim();
    var el = form.querySelector('[name="' + name + '"]');
    return el ? String(el.value || '').trim() : '';
  }
  function readChecked(form, name) {
    return Array.prototype.slice.call(form.querySelectorAll('[name="' + name + '"]:checked')).map(function (el) { return el.value; });
  }
  function readRadio(form, name) {
    var el = form.querySelector('[name="' + name + '"]:checked');
    return el? el.value: '';
  }
  function normalizeVatId(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  function isEuReverseChargeEligible(vatId, companyName, customerType, billingCountry) {
    var prefixes = ['BE','BG','CZ','DK','DE','EE','IE','EL','GR','ES','FR','HR','IT','CY','LV','LT','LU','HU','MT','NL','PL','PT','RO','SI','SK','FI','SE'];
    var raw = normalizeVatId(vatId);
    var country = String(billingCountry || '').toUpperCase();
    if (customerType !== 'business' || !companyName || raw.length < 4) return false;
    var prefix = raw.slice(0, 2);
    var normalizedCountry = country === 'GR' ? 'EL' : country;
    return prefix !== 'AT' && prefixes.indexOf(prefix) !== -1 && normalizedCountry === prefix;
  }
  function normalizeUiLanguage(lang) {
    var value = String(lang || 'en').toLowerCase();
    if (value.indexOf('hu') === 0) return 'hu';
    if (value.indexOf('de') === 0) return 'de';
    return 'en';
  }
  function cleanOptionLabel(label) {
    if (!label) return '';
    var clone = label.cloneNode(true);
    clone.querySelectorAll('.info-tip,[data-tooltip]').forEach(function (node) { node.remove(); });
    return (clone.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function selectedOptionText(form, name) {
    var field = form && form.elements ? form.elements[name] : null;
    if (!field) return '';
    if (field.tagName === 'SELECT' && field.selectedIndex >= 0) {
      return (field.options[field.selectedIndex].textContent || '').trim();
    }
    var checked = form.querySelector('[name="' + name + '"]:checked');
    if (checked) {
      var id = checked.id;
      var label = id ? form.querySelector('label[for="' + id.replace(/"/g, '\"') + '"]') : checked.closest('label');
      if (label) return cleanOptionLabel(label);
      return String(checked.value || '').trim();
    }
    return readField(form, name);
  }
  function addonLabel(code, lang) {
    var map = {
      en:{mobile:'Mobile studio',instantretouch:'Immediate on-site retouching',stylist:'Stylist',hair:'Hair stylist',makeup:'Make-up artist',express:'Express delivery',artdirection:'Art direction'},
      hu:{mobile:'Mobil stúdió',instantretouch:'Azonnali helyszíni retusálás',stylist:'Stylist',hair:'Fodrász',makeup:'Sminkes',express:'Expressz átadás',artdirection:'Művészeti irányítás'},
      de:{mobile:'Mobiles Studio',instantretouch:'Sofortige Retusche vor Ort',stylist:'Styling',hair:'Hair-Styling',makeup:'Make-up',express:'Expresslieferung',artdirection:'Art Direction'}
    };
    lang = normalizeUiLanguage(lang);
    return (map[lang] && map[lang][code]) || code;
  }
  function categoryLabel(category, lang) {
    lang = normalizeUiLanguage(lang);
    var map = {
      en: {individual:'Individual portrait', group:'Group portraits', brand:'Brand photography', art:'Fine art photography', event:'C-level event photography'},
      hu: {individual:'Egyéni portré', group:'Csoportos portré', brand:'Brand fotózás', art:'Művészi fotózás', event:'C-szintű rendezvényfotózás'},
      de: {individual:'Einzelporträt', group:'Gruppenporträts', brand:'Brand-Fotografie', art:'Fine-Art-Fotografie', event:'C-Level-Eventfotografie'}
    };
    return (map[lang] && map[lang][category]) || category;
  }

  function quoteLocalizedText(lang) {
    lang = normalizeUiLanguage(lang);
    return {
      en:{formTitle:'BANHALMI guided quote request',durations:{headshotcv:'10 minutes',quick30:'30 minutes',guided60:'1 hour',guided120:'2 hours',brand60:'1 hour',brand120:'2 hours',brand180:'3 hours',brand240:'4 hours',art60:'1 hour',art120:'2 hours',art180:'3 hours',event60:'1 hour',event120:'2 hours',event180:'3 hours',event240:'4 hours',eventFullDay:'full day / up to 8 hours'},retouch:{selected:'selected retouched images',instant:'immediate on-site retouching selected',later:'later retouching',brand:'image selection and retouching per selected image',art:'fine-art retouching per selected image',event:'estimated delivered event images; standard event selection and colour correction are included, detailed portrait retouching is quoted separately'},groupPackage:'Quality group portrait',hours:'hour(s)',amcham:'Professional Network Benefit',additional:'additional retouched images at no extra cost',total:'total',pending:'50% additional retouched images once the final image count is confirmed.'},
      hu:{formTitle:'BANHALMI vezetett árajánlatkérés',durations:{headshotcv:'10 perc',quick30:'30 perc',guided60:'1 óra',guided120:'2 óra',brand60:'1 óra',brand120:'2 óra',brand180:'3 óra',brand240:'4 óra',art60:'1 óra',art120:'2 óra',art180:'3 óra',event60:'1 óra',event120:'2 óra',event180:'3 óra',event240:'4 óra',eventFullDay:'egész nap / legfeljebb 8 óra'},retouch:{selected:'kiválasztott retusált képek',instant:'azonnali helyszíni retusálás kiválasztva',later:'utólagos retusálás',brand:'képkiválasztás és retusálás kiválasztott képenként',art:'művészi retusálás kiválasztott képenként',event:'becsült átadott eseményképek; a standard válogatás és színkorrekció a csomag része, a részletes portréretus külön ajánlat'},groupPackage:'Minőségi csoportos portré',hours:'óra',amcham:'Professional Network Benefit',additional:'további retusált kép felár nélkül',total:'összesen',pending:'a végleges képszám jóváhagyása után 50% további retusált kép jár.'},
      de:{formTitle:'BANHALMI geführte Angebotsanfrage',durations:{headshotcv:'10 Minuten',quick30:'30 Minuten',guided60:'1 Stunde',guided120:'2 Stunden',brand60:'1 Stunde',brand120:'2 Stunden',brand180:'3 Stunden',brand240:'4 Stunden',art60:'1 Stunde',art120:'2 Stunden',art180:'3 Stunden',event60:'1 Stunde',event120:'2 Stunden',event180:'3 Stunden',event240:'4 Stunden',eventFullDay:'ganzer Tag / bis zu 8 Stunden'},retouch:{selected:'ausgewählte retuschierte Bilder',instant:'sofortige Retusche vor Ort ausgewählt',later:'nachträgliche Retusche',brand:'Bildauswahl und Retusche je ausgewähltem Bild',art:'Fine-Art-Retusche je ausgewähltem Bild',event:'voraussichtlich gelieferte Eventbilder; Standardauswahl und Farbkorrektur sind enthalten, detaillierte Porträtretusche wird separat angeboten'},groupPackage:'Qualitatives Gruppenporträt',hours:'Stunde(n)',amcham:'Professional Network Benefit',additional:'zusätzliche retuschierte Bilder ohne Aufpreis',total:'insgesamt',pending:'50 % zusätzliche retuschierte Bilder nach Bestätigung der endgültigen Bildanzahl.'}
    }[lang];
  }
  function buildQuotePayload(form) {
    var lang = normalizeUiLanguage(form.getAttribute('data-lang') || document.documentElement.lang || 'en');
    var quoteEngine = window.BANHALMI_QUOTE;
    var estimate = quoteEngine && typeof quoteEngine.paint === 'function'? quoteEngine.paint(form): quoteEngine && typeof quoteEngine.calculate === 'function'? quoteEngine.calculate(form): null;
    var category = readRadio(form, 'category') || 'individual';
    var companyName = readField(form, 'company');
    var vatId = readField(form, 'vat_id');
    var customerType = readField(form, 'customer_type');
    var billingCountry = readField(form, 'billing_country');
    var reverseEligible = estimate ? !!estimate.reverseEligible : isEuReverseChargeEligible(vatId, companyName, customerType, billingCountry);
    var addons = readChecked(form, 'addons');
    var ql = quoteLocalizedText(lang);
    var payload = {
      language: lang,
      pageUrl: window.location.href,
      turnstileToken: readField(form, 'cf-turnstile-response'),
      formType: 'quote',
      payloadVersion: 'banhalmi-quote-v5-full-audit',
      formTitle: ql.formTitle,
      category: categoryLabel(category, lang),
      categoryCode: category,
      packageName: '',
      duration: '',
      peopleCount: '',
      retouchedImages: estimate? String(estimate.retouchedImagesTotal || readField(form, 'retouched_images')): readField(form, 'retouched_images'),
      retouchedImagesPerPerson: readField(form, 'retouched_images'),
      retouchedImagesTotal: estimate? String(estimate.retouchedImagesTotal || readField(form, 'retouched_images')): readField(form, 'retouched_images'),
      instantRetouchHours: estimate? String(estimate.instantRetouchHours || 0): '0',
      retouchMode: '',
      photographerCount: estimate? String(estimate.photographerCount || 1): '1',
      projectGoals: readChecked(form, 'project_goals').join(', '),
      amchamMember:!!form.querySelector('[name="amcham_member"]:checked'),
      amchamCountry: readField(form, 'amcham_country'),
      amchamBenefit: '',
      locationType: readRadio(form, 'location') || readField(form, 'location'),
      locationDetails: readField(form, 'specific_location'),
      travelCountry: readField(form, 'travel_country'),
      travelPricingStatus: estimate && estimate.customTravel ? 'custom-quote-required' : 'included-or-not-applicable',
      displayedTotalExcludesInternationalTravel: !!(estimate && estimate.customTravel),
      preferredSlots: [1,2,3].map(function(i){
        var date = readField(form,'preferred_date_'+i);
        var daypartCode = readField(form,'preferred_daypart_'+i);
        var daypartLabel = selectedOptionText(form,'preferred_daypart_'+i);
        return date ? {date:date, daypartCode:daypartCode, daypartLabel:daypartLabel} : null;
      }).filter(Boolean).sort(function(a,b){return a.date.localeCompare(b.date);}),
      preferredDates: [1,2,3].map(function(i){ var d=readField(form,'preferred_date_'+i), t=selectedOptionText(form,'preferred_daypart_'+i); return d?{date:d,label:d+' ('+(t||'')+')'}:null; }).filter(Boolean).sort(function(a,b){return a.date.localeCompare(b.date);}).map(function(x){return x.label;}).join(', '),
      dateCoordinationRequested: !!form.querySelector('[name="date_coordination_requested"]:checked'),
      addons: addons.join(', '),
      addonLabels: addons.map(function(code){ return addonLabel(code, lang); }).join(', '),
      budget: readField(form, 'budget'),
      baseCurrency: 'EUR',
      netAmount: estimate? String(estimate.net): readField(form, 'estimate_net'),
      vatRate: '20%',
      potentialZeroVatAfterVerification: reverseEligible,
      vatAmount: estimate? String(estimate.vat): readField(form, 'estimate_vat'),
      grossAmount: estimate? String(estimate.gross): readField(form, 'estimate_gross'),
      displayCurrency: estimate? String(estimate.displayCurrency): (readField(form, 'estimate_display_currency') || (lang==='hu'?'HUF':'EUR')),
      displayExchangeRate: estimate? String(estimate.displayRate): (readField(form, 'estimate_display_rate') || (lang==='hu'?'400':'1')),
      displayNetAmount: estimate? String(estimate.displayNet): readField(form, 'estimate_display_net'),
      displayVatAmount: estimate? String(estimate.displayVat): readField(form, 'estimate_display_vat'),
      displayGrossAmount: estimate? String(estimate.displayGross): readField(form, 'estimate_display_gross'),
      reverseCharge: false,
      reverseChargeEligibilityPendingVerification: reverseEligible,
      vatLegalNote: lang==='hu'?'A 0%-os ÁFA csak a cég, a közösségi adószám és a vonatkozó jogszabályi feltételek ellenőrzése után lesz érvényes.':lang==='de'?'Die 0%-Behandlung wird erst nach Prüfung des Unternehmens, der UID und der anwendbaren gesetzlichen Voraussetzungen gültig.':'0% VAT becomes valid only after the company, VAT ID and applicable legal requirements have been verified.',
      euVatNumber: customerType === 'business' ? normalizeVatId(vatId) : '',
      name: readField(form, 'name'),
      email: readField(form, 'email'),
      phone: readField(form, 'phone'),
      customerType: customerType,
      billingCountry: billingCountry,
      companyName: customerType === 'business' ? companyName : '',
      message: readField(form, 'message'),
      privacyAcknowledged:!!form.querySelector('[name="privacy_acknowledged"]:checked'),
      sendCopy:!!form.querySelector('[name="send_copy"]:checked'),
      estimateSummary: estimate? estimate.parts: readField(form, 'estimate_summary'),
      estimateVatMode: estimate? estimate.vatMode: readField(form, 'estimate_vat_mode')
    };
    if (category === 'individual') {
      payload.packageName = readRadio(form, 'individual_mode');
      payload.packageCode = payload.packageName;
      payload.packageLabel = selectedOptionText(form, 'individual_mode') || payload.packageName;
      payload.durationCode = payload.packageName;
      payload.duration = ql.durations[payload.packageName] || '';
      payload.retouchMode = ql.retouch.selected;
    } else if (category === 'group') {
      payload.peopleCount = readField(form, 'people_count');
      payload.photographerCount = estimate? String(estimate.photographerCount || 1): '1';
      payload.retouchMode = readChecked(form,'addons').indexOf('instantretouch')>=0? ql.retouch.instant: ql.retouch.later;
      payload.packageCode = 'group-quality-portrait';
      payload.packageName = ql.groupPackage;
      payload.packageLabel = ql.groupPackage;
      payload.durationCode = readField(form, 'group_hours');
      payload.duration = readField(form, 'group_hours') + ' ' + ql.hours;
    } else if (category === 'brand') {
      payload.peopleCount = readField(form, 'brand_people_count');
      payload.packageName = readRadio(form, 'brand_duration');
      payload.packageCode = payload.packageName;
      payload.packageLabel = selectedOptionText(form, 'brand_duration') || payload.packageName;
      payload.durationCode = payload.packageName;
      payload.duration = ql.durations[payload.packageName] || '';
      payload.retouchMode = ql.retouch.brand;
    } else if (category === 'art') {
      payload.packageCode = [readRadio(form, 'art_type'), readField(form, 'art_duration') || 'art60'].filter(Boolean).join(' / ');
      payload.packageName = payload.packageCode;
      payload.packageLabel = [selectedOptionText(form, 'art_type'), selectedOptionText(form, 'art_duration')].filter(Boolean).join(' — ') || payload.packageCode;
      payload.durationCode = readField(form, 'art_duration') || 'art60';
      payload.duration = ql.durations[payload.durationCode] || '';
      payload.retouchMode = ql.retouch.art;
    } else if (category === 'event') {
      payload.packageName = readRadio(form, 'event_duration');
      payload.packageCode = payload.packageName;
      payload.packageLabel = selectedOptionText(form, 'event_duration') || payload.packageName;
      payload.durationCode = payload.packageName;
      payload.duration = ql.durations[payload.packageName] || '';
      payload.retouchMode = ql.retouch.event;
      payload.eventGuestCount = readField(form, 'event_guest_count');
      payload.eventParallelTracks = readField(form, 'event_parallel_tracks');
      payload.eventExtraPhotographers = readField(form, 'event_extra_photographers');
      payload.eventRecommendedPhotographerCount = estimate?String(estimate.eventRecommendedPhotographers||estimate.photographerCount||1):'1';
      payload.eventDeliveredImagesEstimate = estimate?String(estimate.eventDeliveredImagesEstimate||readField(form,'retouched_images')):readField(form,'retouched_images');
    }
    var selectedRetouches = parseInt(payload.retouchedImagesTotal || payload.retouchedImages || '0', 10) || 0;
    if (payload.amchamMember && category !== 'event' && selectedRetouches > 0) {
      var extra = Math.ceil(selectedRetouches * 0.5);
      payload.amchamBenefit = ql.amcham + ': +' + extra + ' ' + ql.additional + ' (' + (selectedRetouches + extra) + ' ' + ql.total + ').';
    } else if (payload.amchamMember && category !== 'event') {
      payload.amchamBenefit = ql.amcham + ': ' + ql.pending;
    } else if (payload.amchamMember && category === 'event') {
      payload.amchamBenefit = lang==='hu'?'AmCham eseményprojektnél: a kedvezmény részletei a végleges ajánlatban kerülnek meghatározásra.':lang==='de'?'AmCham-Eventprojekt: Der konkrete Vorteil wird im finalen Angebot festgelegt.':'AmCham event project: the specific benefit is defined in the final offer.';
    }
    return payload;
  }
  function buildGenericPayload(form) {
    var data = new FormData(form);
    var payload = { language: form.getAttribute('data-lang') || document.documentElement.lang || 'en', pageUrl: window.location.href, payloadVersion: 'banhalmi-contact-v2', formType: form.getAttribute('data-form-kind') || 'contact', formTitle: form.getAttribute('data-form-title') || 'BANHALMI contact form', category: form.getAttribute('data-form-kind') === 'contact'? 'Contact': '' };
    data.forEach(function (value, key) {
      if (key === 'website') return;
      payload[key] = value;
    });
    payload.privacyAcknowledged =!!form.querySelector('[name="privacy_acknowledged"]:checked');
    delete payload.privacy_acknowledged;
    return payload;
  }

  function updateProjectSummary(form) {
    var box = form.querySelector('[data-project-summary]');
    if (!box) return;
    var lang = normalizeUiLanguage(form.getAttribute('data-lang') || document.documentElement.lang || 'en');
    var labels = {
      en: {service:'Service', location:'Location', date:'Preferred date', photographers:'Photographer(s)', retouch:'Retouched images / person and total', budget:'Budget', amcham:'AmCham member', yes:'Yes — Professional Network Benefit applies', no:'No / not specified'},
      hu: {service:'Szolgáltatás', location:'Helyszín', date:'Időpontpreferencia', photographers:'Fotósok száma', retouch:'Retusált képek / fő és összesen', budget:'Költségkeret', amcham:'AmCham-tagság', yes:'Igen — szakmai hálózati kedvezmény figyelembe véve', no:'Nem / nincs megadva'},
      de: {service:'Leistung', location:'Ort', date:'Wunschtermin', photographers:'Fotograf:innen', retouch:'Retuschierte Bilder / Person und gesamt', budget:'Budgetrahmen', amcham:'AmCham-Mitgliedschaft', yes:'Ja — Netzwerkvorteil berücksichtigt', no:'Nein / nicht angegeben'}
    };
    var l = labels[lang] || labels.en;
    var service = categoryLabel(readRadio(form, 'category') || 'individual', lang);
    var locationType = selectedOptionText(form, 'location');
    var exactLocation = readField(form, 'specific_location');
    var location = exactLocation ? [locationType, exactLocation].filter(Boolean).join(' — ') : (locationType || '—');
    var date = [1,2,3].map(function(i){ var d=readField(form,'preferred_date_'+i), t=selectedOptionText(form,'preferred_daypart_'+i); return d?{date:d,label:d+' ('+(t||'')+')'}:null; }).filter(Boolean).sort(function(a,b){return a.date.localeCompare(b.date);}).map(function(x){return x.label;}).join(', ') || (form.querySelector('[name="date_coordination_requested"]:checked') ? (lang==='hu'?'Egyeztetést kérek':lang==='de'?'Terminabstimmung':'Please coordinate') : '—');
    var est = window.BANHALMI_QUOTE && window.BANHALMI_QUOTE.calculate ? window.BANHALMI_QUOTE.calculate(form) : null;
    var photographers = est ? String(est.photographerCount || 1) : '1';
    var retouchesPerPerson = readField(form, 'retouched_images') || '—';
    var summaryCategory=readRadio(form,'category');
    var retouches = est && (summaryCategory==='group' || summaryCategory==='brand') ? (retouchesPerPerson + (lang==='hu'?' kép / fő, összesen ':lang==='de'?' Bilder / Person, insgesamt ':' images / person, total ') + est.retouchedImagesTotal) : (summaryCategory==='event'?(retouchesPerPerson+(lang==='hu'?' becsült átadott kép':lang==='de'?' voraussichtlich gelieferte Bilder':' estimated delivered images')):retouchesPerPerson);
    if(est && est.instantRetouchHours){retouches += (lang==='hu'?' · azonnali retus: ':lang==='de'?' · Sofortretusche: ':' · immediate retouch: ')+est.instantRetouchHours+(lang==='hu'?' megkezdett óra':lang==='de'?' angefangene Stunde(n)':' started hour(s)');}
    var budget = readField(form, 'budget') || '—';
    var amcham = form.querySelector('[name="amcham_member"]:checked')? l.yes: l.no;
    function set(sel, text) { var el = box.querySelector(sel); if (el) el.textContent = text; }
    set('[data-summary-service]', l.service + ': ' + service);
    set('[data-summary-location]', l.location + ': ' + location);
    set('[data-summary-date]', l.date + ': ' + date);
    set('[data-summary-photographers]', l.photographers + ': ' + photographers);
    set('[data-summary-retouch]', l.retouch + ': ' + retouches);
    set('[data-summary-budget]', l.budget + ': ' + budget);
    set('[data-summary-amcham]', l.amcham + ': ' + amcham);
    var copy = form.querySelector('[data-amcham-copy]');
    if (copy) { copy.hidden =!form.querySelector('[name="amcham_member"]:checked'); }
  }
  document.querySelectorAll('[data-amcham-toggle]').forEach(function(input){
    var form = input.closest('form');
    input.addEventListener('change', function(){ if(form) updateProjectSummary(form); });
  });
  document.querySelectorAll('[data-smart-quote]').forEach(function(form){
    form.addEventListener('input', function(){ updateProjectSummary(form); });
    form.addEventListener('change', function(){ updateProjectSummary(form); });
    updateProjectSummary(form);
  });

  document.querySelectorAll("[data-contact-form]").forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var quoteEngine = window.BANHALMI_QUOTE;
      if ((form.getAttribute('data-form-kind') === 'quote' || (form.elements.form_type && form.elements.form_type.value === 'quote')) && quoteEngine && typeof quoteEngine.isPricingReady === 'function' && !quoteEngine.isPricingReady()) { var pricingNote=form.querySelector('[data-pricing-status]'); if(pricingNote){pricingNote.hidden=false;pricingNote.scrollIntoView({behavior:'smooth',block:'center'});} return; }
      if ((form.getAttribute('data-form-kind') === 'quote' || (form.elements.form_type && form.elements.form_type.value === 'quote')) && quoteEngine && typeof quoteEngine.validate === 'function' && !quoteEngine.validate(form, true)) { return; }
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (form.elements.website && form.elements.website.value) { form.elements.website.value = ""; } /* clear accidental autofill instead of silently dropping the submission; the backend honeypot still catches direct bot POSTs */
      var isQuote = form.getAttribute('data-form-kind') === 'quote' || (form.elements.form_type && form.elements.form_type.value === 'quote');
      var payload = isQuote? buildQuotePayload(form): buildGenericPayload(form);
      payload.pageUrl = window.location.href;
      payload.submittedAt = new Date().toISOString();
      var config = window.BANHALMI_CONFIG || {};
      var endpoint = config.formEndpoint || (isQuote? config.quoteEndpoint: config.contactEndpoint) || window.BANHALMI_FORM_ENDPOINT || "";
      var note = form.querySelector("[data-form-note]");
      var submit = form.querySelector('[type="submit"]');
      var submitLabel = submit ? submit.textContent : '';
      function setSubmitBusy(isBusy) {
        if (!submit) return;
        var lang = form.getAttribute('data-lang') || document.documentElement.lang || 'en';
        var key = lang.indexOf('hu') === 0 ? 'hu' : lang.indexOf('de') === 0 ? 'de' : 'en';
        var busyCopy = { en:'Sending…', de:'Wird gesendet…', hu:'Küldés folyamatban…' };
        submit.disabled = !!isBusy;
        if (isBusy) { submit.setAttribute('aria-busy', 'true'); submit.textContent = busyCopy[key] || busyCopy.en; }
        else { submit.removeAttribute('aria-busy'); submit.textContent = submitLabel; }
      }
      function message(type) {
        var lang = form.getAttribute('data-lang') || document.documentElement.lang || 'en';
        var successCopy = isQuote ? {
          en:'Thank you. Your quote request has been sent.',
          de:'Vielen Dank. Ihre Anfrage wurde gesendet.',
          hu:'Köszönöm. Az ajánlatkérés elküldésre került.'
        } : {
          en:'Thank you. Your message has been sent.',
          de:'Vielen Dank. Ihre Nachricht wurde gesendet.',
          hu:'Köszönöm. Az üzenet elküldésre került.'
        };
        var successUnverifiedCopy = isQuote ? {
          en:'Thank you. Your quote request has been sent. Please check your confirmation email; if it does not arrive, write directly to the contact address.',
          de:'Vielen Dank. Ihre Anfrage wurde gesendet. Bitte prüfen Sie die Bestätigungs-E-Mail; falls sie nicht ankommt, schreiben Sie bitte direkt an die Kontaktadresse.',
          hu:'Köszönöm. Az ajánlatkérés elküldésre került. Kérem, ellenőrizze a visszaigazoló e-mailt; ha nem érkezik meg, írjon közvetlenül a kapcsolati címre.'
        } : {
          en:'Thank you. Your message has been sent. Please check your confirmation email; if it does not arrive, write directly to the contact address.',
          de:'Vielen Dank. Ihre Nachricht wurde gesendet. Bitte prüfen Sie die Bestätigungs-E-Mail; falls sie nicht ankommt, schreiben Sie bitte direkt an die Kontaktadresse.',
          hu:'Köszönöm. Az üzenet elküldésre került. Kérem, ellenőrizze a visszaigazoló e-mailt; ha nem érkezik meg, írjon közvetlenül a kapcsolati címre.'
        };
        var copy = {
          success: successCopy,
          successUnverified: successUnverifiedCopy,
          error: {
            en:'The browser could not verify the server response. Please send the request by email or try again.',
            de:'Der Browser konnte die Serverantwort nicht verifizieren. Bitte senden Sie die Anfrage per E-Mail oder versuchen Sie es erneut.',
            hu:'A böngésző nem tudta ellenőrizni a szerver válaszát. Kérem, küldje el e-mailben, vagy próbálja újra.'
          }
        };
        var key = lang.indexOf('hu') === 0? 'hu': lang.indexOf('de') === 0? 'de': 'en';
        return (copy[type] && copy[type][key]) || copy[type].en;
      }
      function showNote(text, isError) {
        setSubmitBusy(false);
        if (note) {
          note.hidden = false;
          note.textContent = text || message('success');
          note.style.color = isError? '#8a2f18': 'var(--gold-deep)';
          note.scrollIntoView({ behavior: reduce? "auto": "smooth", block: "center" });
        }
      }
      function openMailFallback() {
        var supportEmail = (window.BANHALMI_CONFIG && window.BANHALMI_CONFIG.supportEmail) || 'hello@norbertbanhalmi.com';
        var subject = encodeURIComponent((isQuote? 'BANHALMI quote request — ': 'BANHALMI enquiry — ') + (payload.category || payload.subject || payload.service || 'photography'));
        var body = encodeURIComponent(Object.keys(payload).map(function (key) { return key + ': ' + payload[key]; }).join("\n"));
        window.location.href = "mailto:" + supportEmail + "?subject=" + subject + "&body=" + body;
      }
      function fallbackMailto(options) {
        options = options || {};
        setSubmitBusy(false);
        var isAppsScript = /script\.google\.com\/macros\/s\//.test(endpoint || '');
        if (options.fromVerifiedSubmit && isAppsScript) {
          var lang = form.getAttribute('data-lang') || document.documentElement.lang || 'en';
          var key = lang.indexOf('hu') === 0? 'hu': lang.indexOf('de') === 0? 'de': 'en';
          var copy = {
            en:'The request may have reached the server, but the browser could not verify the Google Apps Script response. Please check your confirmation email; do not resend unless no confirmation arrives.',
            de:'Die Anfrage wurde möglicherweise gesendet, aber der Browser konnte die Google-Apps-Script-Antwort nicht verifizieren. Bitte prüfen Sie die Bestätigungs-E-Mail und senden Sie nicht erneut, außer es kommt keine Bestätigung an.',
            hu:'Az üzenet valószínűleg elindult, de a böngésző nem tudta ellenőrizni a Google Apps Script válaszát. Kérem, nézze meg, érkezik-e visszaigazoló e-mail; csak akkor küldje újra, ha nem érkezik megerősítés.'
          };
          showNote(copy[key] || copy.en, true);
          return;
        }
        openMailFallback();
        showNote(message('error'), true);
      }
      function submitVerified() {
        return fetch(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "text/plain;charset=utf-8", "Accept": "application/json,text/plain,*/*" },
          mode: "cors",
          credentials: "omit",
          keepalive: true
        }).then(function(response){
          if (!response) throw new Error('No response from form endpoint');
          return response.text().then(function(text){
            var data = {};
            try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { raw:text }; }
            if (!response.ok || (data && data.ok === false)) {
              var err = new Error((data && data.error) || ('Form endpoint returned HTTP ' + response.status));
              err.status = response.status; err.payload = data; throw err;
            }
            return data;
          });
        });
      }
      setSubmitBusy(true);
      if (endpoint && window.fetch) {
        submitVerified().then(function(data){
          showNote(message(data && data.unverified? 'successUnverified': 'success') + (data && data.submissionId? ' ID: ' + data.submissionId: ''), false);
          form.reset();
          if (window.turnstile) { try { window.turnstile.reset(); } catch (e) {} }
          if (isQuote && window.BANHALMI_QUOTE && typeof window.BANHALMI_QUOTE.paint === 'function') { window.BANHALMI_QUOTE.paint(form); updateProjectSummary(form); }
        }).catch(function(error){
          if (window.turnstile) { try { window.turnstile.reset(); } catch (e) {} }
          var text = String(error && error.message || '');
          if (/configuration|WORKER_SHARED_SECRET|gateway/i.test(text)) {
            var lang = form.getAttribute('data-lang') || document.documentElement.lang || 'en';
            var key = lang.indexOf('hu') === 0? 'hu': lang.indexOf('de') === 0? 'de': 'en';
            var configCopy = {
              en:'The form service is not fully configured yet. Please send the request by email; the website administrator has been notified.',
              hu:'Az űrlapszolgáltatás beállítása még nem teljes. Kérem, küldje el a megkeresést e-mailben; a weboldal kezelője értesítést kapott.',
              de:'Der Formulardienst ist noch nicht vollständig konfiguriert. Bitte senden Sie die Anfrage per E-Mail; die Websiteverwaltung wurde informiert.'
            };
            showNote(configCopy[key] || configCopy.en, true);
          } else { fallbackMailto({fromVerifiedSubmit:true}); }
        });
      } else {
        fallbackMailto();
      }
    });
  });

  // ---------- Portfolio gallery: lazy-load, filter, lightbox ----------
  var grid = document.querySelector("[data-gallery]");
  if (grid) {
    // Lazy-load images via data-src
    var imgs = grid.querySelectorAll("img[data-src]");
    function load(img) {
      if (img.dataset.avif && document.createElement('canvas').toDataURL('image/avif').indexOf('data:image/avif') === 0) {
        img.src = img.dataset.avif;
      } else {
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        img.src = img.dataset.src;
      }
      img.addEventListener("load", function () { img.classList.add("loaded"); });
      img.removeAttribute("data-src");
    }
    if ("IntersectionObserver" in window) {
      var lio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { load(e.target); lio.unobserve(e.target); } });
      }, { rootMargin: "300px 0px" });
      imgs.forEach(function (im) { lio.observe(im); });
    } else {
      imgs.forEach(load);
    }

    // Category filter
    var filters = document.querySelectorAll("[data-filter]");
    var sections = document.querySelectorAll("[data-cat-section]");
    filters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = btn.getAttribute("data-filter");
        filters.forEach(function (b) { b.setAttribute("aria-pressed", b === btn); });
        sections.forEach(function (s) {
          var show = (cat === "all" || s.getAttribute("data-cat-section") === cat);
          s.classList.toggle("pf-hidden",!show);
        });
      });
    });

    // Lightbox
    var lb = document.querySelector("[data-lightbox]");
    if (lb) {
      var lbImg = lb.querySelector("img");
      var lbCap = lb.querySelector(".lb-cap");
      var items = [];
      var current = 0;
      function refreshItems() {
        items = Array.prototype.slice.call(grid.querySelectorAll(".pf-item:not(.pf-hidden) [data-large]"));
      }
      function show(i) {
        refreshItems();
        if (!items.length) return;
        current = (i + items.length) % items.length;
        var el = items[current];
        lbImg.src = el.getAttribute("data-large");
        lbCap.textContent = el.getAttribute("data-cap") || "";
        lb.classList.add("open");
        document.body.style.overflow = "hidden";
      }
      function close() { lb.classList.remove("open"); document.body.style.overflow = ""; lbImg.src = ""; }
      grid.addEventListener("click", function (ev) {
        var t = ev.target.closest("[data-large]");
        if (!t) return;
        refreshItems();
        show(items.indexOf(t));
      });
      lb.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });
      lb.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
      lb.querySelector(".lb-close").addEventListener("click", close);
      lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
      document.addEventListener("keydown", function (e) {
        if (!lb.classList.contains("open")) return;
        if (e.key === "Escape") close();
        else if (e.key === "ArrowRight") show(current + 1);
        else if (e.key === "ArrowLeft") show(current - 1);
      });
    }
  }

  // Apple-inspired motion system — restrained, accessible and performance-safe.
  (function () {
    // Mobile visitors get the finished content immediately. The editorial motion
    // layer is decorative and its full-DOM scan is not worth blocking the main
    // thread on compact/mobile CPUs. Desktop keeps the original motion system.
    var compactViewport = window.matchMedia && window.matchMedia("(max-width: 680px)").matches;
    if (compactViewport) return;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var canObserve = "IntersectionObserver" in window;
    var rootElement = document.documentElement;
    var skipSelector = "form, nav, footer, .nav-links, .cookie, .universal-lightbox, .age-verification-dialog, [data-no-motion]";

    function shouldSkip(element) {
      return !element || !!element.closest(skipSelector);
    }

    var textNodes = Array.prototype.slice.call(document.querySelectorAll(
      "main h1, main h2, main h3, main h4, main .lead, main .eyebrow, main p, main li, main blockquote, main dt, main dd"
    )).filter(function (element) {
      return !shouldSkip(element);
    });

    var parentCounts = new WeakMap();
    textNodes.forEach(function (element) {
      element.classList.add("text-reveal");
      var parent = element.parentElement || document.body;
      var count = parentCounts.get(parent) || 0;
      element.style.setProperty("--motion-delay", Math.min(count, 4) * 38 + "ms");
      parentCounts.set(parent, count + 1);
    });

    var mediaNodes = Array.prototype.slice.call(document.querySelectorAll([
      ".editorial-image",
      ".service-hero-image",
      ".case-study-hero-image",
      ".pf-item",
      ".collage-gallery figure",
      ".service-lower-gallery-item",
      ".banhalmi-gallery-item",
      ".banhalmi-fine-art-gallery-item",
      ".hero-figure",
      ".person-profile-hero-media",
      ".amcham-profile-media",
      ".about-portrait-split figure",
      ".oeuvre-teaser figure",
      ".archive-card figure",
      ".image-open"
    ].join(","))).filter(function (element) {
      return !shouldSkip(element) && !element.closest(".universal-lightbox");
    });

    mediaNodes.forEach(function (element, index) {
      element.classList.add("apple-media", "media-reveal");
      element.style.setProperty("--motion-delay", Math.min(index % 4, 3) * 42 + "ms");
    });

    // CSS only hides enhanced elements after this class is present, so content remains visible if JS fails.
    rootElement.classList.add("motion-ready");

    function revealImmediately() {
      textNodes.forEach(function (element) { element.classList.add("is-visible"); });
      mediaNodes.forEach(function (element) { element.classList.add("is-motion-visible"); });
    }

    if (reduceMotion || !canObserve) {
      revealImmediately();
      return;
    }

    var textObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        textObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -7% 0px" });

    var mediaObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-motion-visible");
        mediaObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });

    textNodes.forEach(function (element) { textObserver.observe(element); });
    mediaNodes.forEach(function (element) { mediaObserver.observe(element); });

    // Safety net: if an observer callback is ever missed (fast programmatic
    // scroll, tab throttling, browser quirk), force full visibility so
    // content can never be left stuck below full opacity.
    setTimeout(revealImmediately, 1800);
  })();

  // Hero remains static by design: no scroll-linked layout reads or parallax writes.

  // Service lower galleries — progressive reveal for performance without removing SEO-visible HTML when JavaScript is disabled.
  document.querySelectorAll('.service-lower-gallery-grid').forEach(function(grid){
    var items = Array.prototype.slice.call(grid.querySelectorAll('.service-lower-gallery-item'));
    if (items.length <= 18 || grid.dataset.galleryEnhanced === 'true') return;
    grid.dataset.galleryEnhanced = 'true';
    grid.classList.add('is-gallery-collapsed');
    var lang = (document.documentElement.lang || 'en').toLowerCase();
    var isHu = lang.indexOf('hu') === 0;
    var isDe = lang.indexOf('de') === 0;
    var openText = isHu ? 'További képek' : isDe ? 'Weitere Bilder' : 'More images';
    var closeText = isHu ? 'Kevesebb kép' : isDe ? 'Weniger Bilder' : 'Fewer images';
    var wrap = document.createElement('div');
    wrap.className = 'service-gallery-toggle';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-ghost';
    btn.setAttribute('aria-expanded','false');
    btn.textContent = openText;
    btn.addEventListener('click', function(){
      var collapsed = grid.classList.toggle('is-gallery-collapsed');
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      btn.textContent = collapsed ? openText : closeText;
      if (collapsed) grid.scrollIntoView({behavior:'smooth', block:'start'});
    });
    wrap.appendChild(btn);
    grid.insertAdjacentElement('afterend', wrap);
  });

})();

/* BANHALMI universal gallery lightbox with 18+ self-declaration gate — 2026-07-08. */
(function(){
  var galleries = Array.prototype.slice.call(document.querySelectorAll('[data-universal-gallery]'));
  var lb = document.querySelector('[data-universal-lightbox]');
  if(!galleries.length || !lb) return;
  var items=[]; var current=0; var pendingIndex=null; var lastTrigger=null;
  var img=lb.querySelector('img'); var cap=lb.querySelector('figcaption'); var linkBox=lb.querySelector('.universal-lightbox-links'); if(!linkBox){linkBox=document.createElement('div');linkBox.className='universal-lightbox-links';cap.insertAdjacentElement('afterend',linkBox);}
  var lang=(document.documentElement.lang||'en').toLowerCase();
  var copy=lang.indexOf('hu')===0 ? {
    title:'Felnőtteknek szóló művészi tartalom',
    body:'A kiválasztott kép intim vagy művészi testtanulmányt tartalmaz. A megnyitással megerősíted, hogy elmúltál 18 éves.',
    accept:'Elmúltam 18 éves — megnyitás', decline:'Még nem / bezárás'
  } : lang.indexOf('de')===0 ? {
    title:'Künstlerischer Inhalt für Erwachsene',
    body:'Das ausgewählte Bild enthält eine intime oder künstlerische Körperstudie. Mit dem Öffnen bestätigst du, mindestens 18 Jahre alt zu sein.',
    accept:'Ich bin 18 oder älter — öffnen', decline:'Noch nicht / schließen'
  } : {
    title:'Adult artistic content',
    body:'The selected image contains an intimate or artistic body study. By opening it, you confirm that you are 18 years of age or older.',
    accept:'I am 18 or older — open', decline:'Not yet / close'
  };
  var ageVerified=false;
  try{ageVerified=sessionStorage.getItem('banhalmi_age_18_verified')==='yes';}catch(e){}
  function collect(){items=[];galleries.forEach(function(g){items=items.concat(Array.prototype.slice.call(g.querySelectorAll('[data-lightbox-src]')));});}
  function isRestricted(el){return !!el && el.getAttribute('data-age-restricted')==='true';}
  function buildAgeDialog(){
    var d=document.createElement('div'); d.className='age-verification-dialog'; d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true'); d.setAttribute('aria-hidden','true'); d.setAttribute('aria-labelledby','age-verification-title');
    d.innerHTML='<div class="age-verification-panel"><div class="age-verification-kicker" aria-hidden="true">18+</div><h2 id="age-verification-title"></h2><p></p><div class="age-verification-actions"><button type="button" class="btn btn-primary" data-age-accept></button><button type="button" class="btn btn-ghost" data-age-decline></button></div></div>';
    d.querySelector('h2').textContent=copy.title; d.querySelector('p').textContent=copy.body; d.querySelector('[data-age-accept]').textContent=copy.accept; d.querySelector('[data-age-decline]').textContent=copy.decline;
    d.querySelector('[data-age-accept]').addEventListener('click',function(){ageVerified=true;try{sessionStorage.setItem('banhalmi_age_18_verified','yes');}catch(e){}closeAgeDialog(false);var idx=pendingIndex;pendingIndex=null;if(idx!==null)openAt(idx);});
    d.querySelector('[data-age-decline]').addEventListener('click',function(){pendingIndex=null;closeAgeDialog(true);});
    d.addEventListener('click',function(e){if(e.target===d){pendingIndex=null;closeAgeDialog(true);}});
    document.body.appendChild(d); return d;
  }
  var ageDialog=null;
  function ensureAgeDialog(){
    if(!ageDialog){ageDialog=buildAgeDialog();ageDialog.inert=true;}
    return ageDialog;
  }
  function showAgeDialog(index,trigger){pendingIndex=index;lastTrigger=trigger||null;var dialog=ensureAgeDialog();dialog.inert=false;dialog.classList.add('open');dialog.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';dialog.querySelector('[data-age-accept]').focus();}
  function closeAgeDialog(restore){if(!ageDialog)return;ageDialog.classList.remove('open');ageDialog.setAttribute('aria-hidden','true');ageDialog.inert=true;document.body.style.overflow='';if(restore&&lastTrigger)lastTrigger.focus();}
  function requestOpen(index,trigger){collect();if(!items.length)return;index=(index+items.length)%items.length;if(isRestricted(items[index])&&!ageVerified){showAgeDialog(index,trigger||items[index]);return;}openAt(index);}
  function openAt(index){collect();if(!items.length)return;lb.inert=false;current=(index+items.length)%items.length;var el=items[current];img.src=el.getAttribute('data-lightbox-src');img.alt=el.getAttribute('data-lightbox-cap')||'';cap.textContent=el.getAttribute('data-lightbox-cap')||'';linkBox.innerHTML='';for(var n=1;n<=12;n++){var href=el.getAttribute('data-lightbox-link-'+n);var label=el.getAttribute('data-lightbox-link-'+n+'-label');if(href&&label){var a=document.createElement('a');a.href=href;if(/^https?:\/\//i.test(href)){a.target='_blank';a.rel='noopener noreferrer';}a.textContent=label+' ↗';linkBox.appendChild(a);}}linkBox.hidden=!linkBox.children.length;lb.classList.add('open');lb.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';lb.querySelector('.universal-lightbox-close').focus();}
  function close(){lb.classList.remove('open');lb.setAttribute('aria-hidden','true');lb.inert=true;document.body.style.overflow='';img.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';img.alt='';if(lastTrigger){lastTrigger.setAttribute('aria-expanded','false');lastTrigger.focus();}}
  galleries.forEach(function(g){g.addEventListener('click',function(e){var b=e.target.closest('[data-lightbox-src]');if(!b)return;collect();lastTrigger=b;requestOpen(items.indexOf(b),b);});});
  lb.querySelector('.universal-lightbox-close').addEventListener('click',close);
  lb.querySelector('.universal-lightbox-next').addEventListener('click',function(){requestOpen(current+1);});
  lb.querySelector('.universal-lightbox-prev').addEventListener('click',function(){requestOpen(current-1);});
  lb.addEventListener('click',function(e){if(e.target===lb)close();});
  document.addEventListener('keydown',function(e){
    if(ageDialog&&ageDialog.classList.contains('open')){if(e.key==='Escape'){pendingIndex=null;closeAgeDialog(true);}return;}
    if(!lb.classList.contains('open'))return;
    if(e.key==='Escape')close(); if(e.key==='ArrowRight')requestOpen(current+1); if(e.key==='ArrowLeft')requestOpen(current-1);
  });
})();


/* Privacy-enhanced YouTube poster activation */
(() => {
  const activate = (poster) => {
    if (!poster || poster.dataset.youtubeLoaded === 'true') return;
    const id = poster.dataset.youtubeId;
    if (!id) return;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    iframe.title = 'YouTube video';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    poster.dataset.youtubeLoaded = 'true';
    poster.replaceChildren(iframe);
  };
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.youtube-poster-button');
    if (button) activate(button.closest('.youtube-poster'));
  });
})();


/* BANHALMI accessible information modal for quote options — 2026-07-16. */
(function(){
  'use strict';
  var buttons=Array.prototype.slice.call(document.querySelectorAll('.info-tip[data-tooltip]'));
  if(!buttons.length)return;
  var language=(document.documentElement.lang||'en').toLowerCase();
  var labels=language.indexOf('hu')===0?{title:'Információ',close:'Bezárás'}:language.indexOf('de')===0?{title:'Information',close:'Schließen'}:{title:'Information',close:'Close'};
  var modal=document.createElement('div');
  modal.className='info-modal';
  modal.hidden=true;
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-labelledby','quote-info-modal-title');
  modal.innerHTML='<div class="info-modal-panel" role="document"><div class="info-modal-header"><span class="info-modal-symbol" aria-hidden="true">i</span><h2 id="quote-info-modal-title"></h2><button class="info-modal-close" type="button" aria-label=""></button></div><div class="info-modal-content" data-info-modal-content></div></div>';
  var titleNode=modal.querySelector('h2');
  titleNode.textContent=labels.title;
  var closeButton=modal.querySelector('.info-modal-close');
  closeButton.textContent='×';
  closeButton.setAttribute('aria-label',labels.close);
  document.body.appendChild(modal);
  var content=modal.querySelector('[data-info-modal-content]');
  var lastTrigger=null;
  function open(trigger){
    var text=(trigger.getAttribute('data-tooltip')||trigger.getAttribute('aria-label')||'').trim();
    if(!text)return;
    if(lastTrigger&&lastTrigger!==trigger)lastTrigger.setAttribute('aria-expanded','false');
    lastTrigger=trigger;
    trigger.setAttribute('aria-expanded','true');
    var label=trigger.closest('label');
    if(label){var strong=label.querySelector('strong');var labelClone=(strong||label).cloneNode(true);labelClone.querySelectorAll('.info-tip,[data-tooltip]').forEach(function(node){node.remove();});var optionTitle=(labelClone.textContent||'').replace(/\s+/g,' ').trim();titleNode.textContent=optionTitle||labels.title;}else{titleNode.textContent=labels.title;}
    content.textContent=text;
    modal.hidden=false;
    requestAnimationFrame(function(){modal.classList.add('is-open');});
    document.body.classList.add('info-modal-open');
    closeButton.focus();
  }
  function close(){
    modal.classList.remove('is-open');
    document.body.classList.remove('info-modal-open');
    if(lastTrigger)lastTrigger.setAttribute('aria-expanded','false');
    window.setTimeout(function(){
      modal.hidden=true;
      content.textContent='';
      titleNode.textContent=labels.title;
      if(lastTrigger)lastTrigger.focus();
    },180);
  }
  document.addEventListener('click',function(event){
    var trigger=event.target.closest('.info-tip[data-tooltip]');
    if(trigger){
      event.preventDefault();
      event.stopPropagation();
      open(trigger);
      return;
    }
    if(event.target===modal)close();
  });
  closeButton.addEventListener('click',close);
  document.addEventListener('keydown',function(event){
    if(modal.hidden)return;
    if(event.key==='Escape'){event.preventDefault();close();}
    if(event.key==='Tab'){
      event.preventDefault();
      closeButton.focus();
    }
  });
  buttons.forEach(function(button){
    button.setAttribute('aria-haspopup','dialog');
    button.setAttribute('aria-expanded','false');
  });
})();

/* Hero video: identical on EN/HU/DE, but deliberately absent from the
   critical loading path. The still image remains the LCP element. Video source
   URLs live in data-src and are attached only after real pointer intent or a
   tap. Reduced-motion visitors never download the video. */
(function(){
  var figure=document.querySelector('.hero.hero-image-first .hero-figure');
  if(!figure)return;
  var video=figure.querySelector('.hero-video');
  if(!video)return;
  var canHover=!window.matchMedia||window.matchMedia('(hover:hover)').matches;
  var reducedMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reducedMotion)return;
  var sourcesBound=false;

  function bindSources(){
    if(sourcesBound)return;
    var sources=video.querySelectorAll('source[data-src]');
    sources.forEach(function(source){
      source.src=source.getAttribute('data-src');
      source.removeAttribute('data-src');
    });
    sourcesBound=true;
    video.load();
  }
  function play(){
    bindSources();
    if(video.readyState>0){try{video.currentTime=0;}catch(e){}}
    var playPromise=video.play();
    if(playPromise&&playPromise.catch)playPromise.catch(function(){});
  }
  function stop(){
    video.pause();
  }

  if(canHover){
    figure.addEventListener('mouseenter',play,{passive:true});
    figure.addEventListener('mouseleave',stop,{passive:true});
    return;
  }

  figure.addEventListener('click',function(event){
    event.preventDefault();
    var isPlaying=figure.classList.contains('is-tapped');
    if(isPlaying){
      figure.classList.remove('is-tapped');
      stop();
    }else{
      figure.classList.add('is-tapped');
      play();
    }
  });
  document.addEventListener('click',function(event){
    if(figure.classList.contains('is-tapped')&&!figure.contains(event.target)){
      figure.classList.remove('is-tapped');
      stop();
    }
  });
})();


/* EXECUTIVE-WHATSAPP-CONTACT-V1:START */
(function () {
  "use strict";

  var root = document.documentElement;
  var lang = String(root.lang || "en").toLowerCase();
  var locale = lang.indexOf("hu") === 0 ? "hu" : (lang.indexOf("de") === 0 ? "de" : "en");
  var copy = {
    en: {
      label: "Contact Norbert Bánhalmi on WhatsApp",
      title: "WhatsApp contact",
      message: "Hello Norbert, I am contacting you from the BANHALMI website regarding a photography project."
    },
    de: {
      label: "Norbert Bánhalmi über WhatsApp kontaktieren",
      title: "Kontakt über WhatsApp",
      message: "Hallo Norbert, ich kontaktiere Sie über die BANHALMI Website wegen eines Fotoprojekts."
    },
    hu: {
      label: "Kapcsolatfelvétel Bánhalmi Norberttel WhatsAppon",
      title: "WhatsApp kapcsolat",
      message: "Kedves Norbert, a BANHALMI weboldalról keresem egy fotózással kapcsolatban."
    }
  }[locale];

  if (!document.querySelector(".whatsapp-contact") && document.querySelector("main")) {
    var link = document.createElement("a");
    link.className = "whatsapp-contact";
    link.href = "https://wa.me/4367761655592?text=" + encodeURIComponent(copy.message);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", copy.label);
    link.title = copy.title;
    link.setAttribute("data-contact-channel", "whatsapp");
    link.innerHTML = '<svg aria-hidden="true" viewBox="0 0 32 32" focusable="false"><path d="M16.04 3A12.9 12.9 0 0 0 5 22.58L3.3 29l6.57-1.72A12.93 12.93 0 1 0 16.04 3Zm0 23.52c-1.9 0-3.75-.51-5.37-1.47l-.39-.23-3.9 1.02 1.04-3.8-.25-.4A10.58 10.58 0 1 1 16.04 26.52Zm5.8-7.92c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.31-.82 1.03-1 1.24-.19.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57a9.55 9.55 0 0 1-1.76-2.19c-.18-.32-.02-.49.14-.65.14-.14.32-.37.47-.55.16-.19.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.71-1.72-.98-2.36-.26-.62-.52-.54-.71-.55h-.61c-.21 0-.55.08-.84.4-.29.31-1.11 1.08-1.11 2.64s1.14 3.07 1.29 3.28c.16.21 2.23 3.41 5.41 4.78.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.15-1.51.26-.74.26-1.37.18-1.5-.08-.13-.29-.21-.61-.37Z"/></svg>';
    document.body.appendChild(link);
  }

  var cookieBar = document.querySelector(".cookie");
  function syncCookieOffset() {
    document.body.classList.toggle("whatsapp-cookie-visible", !!(cookieBar && cookieBar.classList.contains("show")));
  }
  if (cookieBar) {
    syncCookieOffset();
    new MutationObserver(syncCookieOffset).observe(cookieBar, {attributes:true, attributeFilter:["class"]});
  }
})();
/* EXECUTIVE-WHATSAPP-CONTACT-V1:END */
