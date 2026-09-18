/* BANHALMI mega menu v32 loader.
   Presentation authority is canonicalized in fluid-4k-rhythm.css; this loader only starts the menu core. */
(function(){'use strict';
  if(document.querySelector('script[data-banhalmi-mega-menu-core]'))return;
  var core=document.createElement('script');
  core.src='/assets/js/mega-menu-v65-base.js?v=20260917-pricing-service-v32';
  core.defer=true;
  core.setAttribute('data-banhalmi-mega-menu-core','');
  core.onload=function(){
    var button=document.querySelector('.menu-btn');
    var menu=document.getElementById('bn-mega-menu');
    if(button && document.activeElement===button && menu && menu.hidden){
      setTimeout(function(){ button.click(); },0);
    }
  };
  document.head.appendChild(core);
})();
