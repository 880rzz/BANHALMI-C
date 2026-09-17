const aliases = [
  ['https://banhalmi.at/', 'https://www.norbertbanhalmi.com/de-at/'],
  ['https://www.banhalmi.at/', 'https://www.norbertbanhalmi.com/de-at/'],
  ['https://banhalminorbert.hu/', 'https://www.norbertbanhalmi.com/hu/'],
  ['https://www.banhalminorbert.hu/', 'https://www.norbertbanhalmi.com/hu/']
];
const failures = [];
for (const [url, expected] of aliases) {
  try {
    const response = await fetch(`${url}?audit=${Date.now()}`, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
    const location = response.headers.get('location') || '';
    const absolute = location ? new URL(location, url).href : '';
    console.log(`${url} -> ${response.status} ${location}`);
    if (![301,302,307,308].includes(response.status)) failures.push(`${url}: expected HTTP redirect, received ${response.status}`);
    if (!absolute.startsWith(expected)) failures.push(`${url}: expected target beginning ${expected}, received ${absolute || '(none)'}`);
  } catch (error) {
    failures.push(`${url}: request failed (${error.message})`);
  }
}
for (const failure of failures) console.error(`FAIL ${failure}`);
if (failures.length) process.exitCode = 1;
else console.log('Alias-domain redirect audit passed.');
