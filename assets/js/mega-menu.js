/* BANHALMI mega menu loader.
   The first pointer activation is queued while the core script is loading so
   one tap always opens the menu. Presentation authority remains in CSS. */
(function(){'use strict';
  if(document.querySelector('script[data-banhalmi-mega-menu-core]'))return;
  var pendingOpen=false;
  var button=document.querySelector('.menu-btn');
  function primeFirstOpen(e){
    if(document.getElementById('bn-mega-menu'))return;
    pendingOpen=true;
    e.preventDefault();
    e.stopImmediatePropagation();
  }
  if(button)button.addEventListener('click',primeFirstOpen,true);
  var core=document.createElement('script');
  core.src='/assets/js/mega-menu-v65-base.js?v=20260917-first-tap-root-cause';
  core.defer=true;
  core.setAttribute('data-banhalmi-mega-menu-core','');
  core.onload=function(){
    if(button)button.removeEventListener('click',primeFirstOpen,true);
    var menu=document.getElementById('bn-mega-menu');
    if(pendingOpen&&button&&menu&&menu.hidden){
      pendingOpen=false;
      setTimeout(function(){button.click();},0);
    }
  };
  document.head.appendChild(core);
})();