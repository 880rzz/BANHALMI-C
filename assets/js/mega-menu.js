/* BANHALMI mega menu v30 loader.
   Preserves the v65 menu logic byte-for-byte in mega-menu-v65-base.js while
   loading the committed compact editorial menu stylesheet before execution. */
(function(){'use strict';
  var cssHref='/assets/css/mega-menu-harmony-v30.css?v=20260917-menu-harmony-v30';
  var link=document.querySelector('link[data-mega-menu-harmony]');
  if(!link){
    link=document.createElement('link');
    link.rel='stylesheet';
    link.href=cssHref;
    link.setAttribute('data-mega-menu-harmony','');
    document.head.appendChild(link);
  }else if(link.getAttribute('href')!==cssHref){
    link.setAttribute('href',cssHref);
  }
  if(document.querySelector('script[data-banhalmi-mega-menu-core]'))return;
  var core=document.createElement('script');
  core.src='/assets/js/mega-menu-v65-base.js?v=20260917-menu-harmony-v30';
  core.defer=true;
  core.setAttribute('data-banhalmi-mega-menu-core','');
  document.head.appendChild(core);
})();
