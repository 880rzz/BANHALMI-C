module.exports = {
  content: [
    '_site/index.html',
    '_site/hu/index.html',
    '_site/de-at/index.html',
    '_site/assets/js/*.js'
  ],
  css: ['_site/assets/css/site.css'],
  output: '/tmp/banhalmi-home-css',
  safelist: {
    standard: [
      'active',
      'open',
      'in',
      'hidden',
      'loaded',
      'ready',
      'is-visible',
      'is-open'
    ],
    deep: [
      /^site-/,
      /^nav-/,
      /^menu-/,
      /^mega-/,
      /^lang-/,
      /^hero-/,
      /^btn/,
      /^reveal/,
      /^cookie-/,
      /^consent-/,
      /^lightbox/,
      /^info-/,
      /^bn-/,
      /^title-accent/,
      /^surface-/,
      /^fp-/,
      /^footer-/
    ]
  }
};
