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

  /* Small-desktop footer geometry is a committed authority stylesheet loaded
     after the canonical rhythm. This guarantees that production hardening
     cannot reintroduce the old 12-track 1180-1439px overflow geometry. */
  var footerHref = '/assets/css/footer-geometry-v32.css?v=20260917-footer-v32';
  var footerLink = document.querySelector('link[data-footer-geometry]');
  if (footerLink) {
    if (footerLink.getAttribute('href') !== footerHref) footerLink.setAttribute('href', footerHref);
  } else {
    footerLink = document.createElement('link');
    footerLink.rel = 'stylesheet';
    footerLink.href = footerHref;
    footerLink.setAttribute('data-footer-geometry','');
    document.head.appendChild(footerLink);
  }

  /* Dedicated menu geometry is an explicit design-authority stylesheet, not
     an inline/runtime patch. Loading it after the canonical rhythm gives the
     approved menu composition deterministic precedence on every page. */
  var menuHref = '/assets/css/mega-menu-harmony-v31.css?v=20260917-menu-harmony-v31';
  var menuLink = document.querySelector('link[data-mega-menu-harmony]');
  if (menuLink) {
    if (menuLink.getAttribute('href') !== menuHref) menuLink.setAttribute('href', menuHref);
  } else {
    menuLink = document.createElement('link');
    menuLink.rel = 'stylesheet';
    menuLink.href = menuHref;
    menuLink.setAttribute('data-mega-menu-harmony','');
    document.head.appendChild(menuLink);
  }

  /* Runtime owns disclosure state only. Pixel geometry belongs to committed stylesheets. */
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
