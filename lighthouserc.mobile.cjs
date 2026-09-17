module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node tools/perf-static-server.mjs _site 4175',
      startServerReadyPattern: 'PERF_SERVER_READY',
      startServerReadyTimeout: 10000,
      url: [
        'http://127.0.0.1:4175/',
        'http://127.0.0.1:4175/hu/',
        'http://127.0.0.1:4175/de-at/',
        'http://127.0.0.1:4175/requestaquote/',
        'http://127.0.0.1:4175/hu/ajanlatkeres/',
        'http://127.0.0.1:4175/de-at/anfrage/'
      ],
      numberOfRuns: 3,
      settings: {
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 1,
          disabled: false
        },
        throttlingMethod: 'simulate',
        chromeFlags: '--headless --no-sandbox --disable-dev-shm-usage'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.97 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 1 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
        'total-blocking-time': ['error', { maxNumericValue: 100 }]
      }
    },
    upload: { target: 'filesystem', outputDir: './artifacts/lighthouse-mobile' }
  }
};
