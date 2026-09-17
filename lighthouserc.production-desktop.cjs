module.exports = {
  ci: {
    collect: {
      url: [
        'https://www.norbertbanhalmi.com/',
        'https://www.norbertbanhalmi.com/hu/',
        'https://www.norbertbanhalmi.com/de-at/'
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        chromeFlags: '--headless --no-sandbox --disable-dev-shm-usage'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.97 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 1 }]
      }
    },
    upload: { target: 'filesystem', outputDir: './artifacts/lighthouse-production-desktop' }
  }
};
