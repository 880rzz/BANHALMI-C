/* BANHALMI mega menu v31 loader.
   Preserves the v65 menu logic byte-for-byte in mega-menu-v65-base.js while
   loading the committed text-first menu stylesheet before execution. */
(function(){'use strict';
  var cssHref='/assets/css/mega-menu-harmony-v31.css?v=20260917-menu-harmony-v31';
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
  core.src='/assets/js/mega-menu-v65-base.js?v=20260917-menu-harmony-v31';
  core.defer=true;
  core.setAttribute('data-banhalmi-mega-menu-core','');
  document.head.appendChild(core);
})();
