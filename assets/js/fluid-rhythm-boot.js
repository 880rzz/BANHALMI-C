/* Loader for the canonical fluid 4K rhythm contract. Navigation authority lives in mega-menu.js plus the compact editorial menu contract. */
(function(){
  'use strict';
  var href = '/assets/css/fluid-4k-rhythm.css?v=20260917-visual-repair-v27';
  var existing = document.querySelector('link[data-fluid-4k-rhythm]');
  if (existing) {
    if (existing.getAttribute('href') !== href) existing.setAttribute('href', href);
  } else {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-fluid-4k-rhythm','');
    document.head.appendChild(link);
  }

  /* Typography integrity is global; CSS is canonicalized in fluid-4k-rhythm.css. */
  if (!document.querySelector('script[data-typography-integrity]')) {
    var typeScript = document.createElement('script');
    typeScript.src = '/assets/js/typography-integrity-v33.js?v=20260917-typography-v33';
    typeScript.defer = true;
    typeScript.setAttribute('data-typography-integrity','');
    document.head.appendChild(typeScript);
  }

  /* Runtime owns disclosure state only. Pixel geometry belongs to committed stylesheets. */
  var query = window.matchMedia('(min-width:1180px)');
  var groups = Array.prototype.slice.call(document.querySelectorAll('details.footer-accordion'));
  function syncFooterGroups(){
    groups.forEach(function(details){
      var compact = !query.matches;
      details.open = query.matches;
      var list = details.querySelector('ul');
      if (list) list.hidden = compact;
    });
  }
  if (groups.length) {
    syncFooterGroups();
    if (typeof query.addEventListener === 'function') query.addEventListener('change', syncFooterGroups);
    else if (typeof query.addListener === 'function') query.addListener(syncFooterGroups);
  }
})();
