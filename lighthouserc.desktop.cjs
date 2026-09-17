module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node tools/perf-static-server.mjs _site 4174',
      startServerReadyPattern: 'PERF_SERVER_READY',
      startServerReadyTimeout: 10000,
      url: [
        'http://127.0.0.1:4174/',
        'http://127.0.0.1:4174/hu/',
        'http://127.0.0.1:4174/de-at/',
        'http://127.0.0.1:4174/portrait/'
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
        'categories:seo': ['error', { minScore: 1 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.08 }],
        'total-blocking-time': ['error', { maxNumericValue: 150 }]
      }
    },
    upload: { target: 'filesystem', outputDir: './artifacts/lighthouse-desktop' }
  }
};
