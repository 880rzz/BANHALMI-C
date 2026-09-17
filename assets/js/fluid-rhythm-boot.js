/* Loader for the canonical fluid 4K rhythm contract. Navigation authority lives in mega-menu.js. */
(function(){
  'use strict';
  var href = '/assets/css/fluid-4k-rhythm.css?v=20260916-live-pixel-v22';
  var existing = document.querySelector('link[data-fluid-4k-rhythm]');
  if (existing) {
    if (existing.getAttribute('href') !== href) existing.setAttribute('href', href);
  } else {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-fluid-4k-rhythm', '');
    document.head.appendChild(link);
  }

  /* Runtime owns disclosure state only. Pixel geometry belongs to the canonical stylesheet. */
  var query = window.matchMedia('(min-width:1180px)');
  var groups = Array.prototype.slice.call(document.querySelectorAll('details.footer-accordion'));
  function syncFooterGroups(){
    groups.forEach(function(details){ details.open = query.matches; });
  }
  if (groups.length) {
    syncFooterGroups();
    if (typeof query.addEventListener === 'function') query.addEventListener('change', syncFooterGroups);
    else if (typeof query.addListener === 'function') query.addListener(syncFooterGroups);
  }
})();
