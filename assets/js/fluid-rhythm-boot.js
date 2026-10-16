/* Typography integrity bootstrap. Presentation styles are delivered in site.css. */
(function(){
  'use strict';
  /* CSS is supplied by the single versioned site.css asset. */

  /* Typography integrity is global; CSS is canonicalized in site.css. */
  if (!document.querySelector('script[data-typography-integrity]')) {
    var typeScript = document.createElement('script');
    typeScript.src = '/assets/js/typography-integrity-v33.js?v=20260917-typography-v33';
    typeScript.defer = true;
    typeScript.setAttribute('data-typography-integrity','');
    document.head.appendChild(typeScript);
  }
})();
