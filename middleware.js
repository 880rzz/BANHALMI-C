export const config = {
  matcher: '/:path*'
};

function redirectTarget(request) {
  const incoming = new URL(request.url);
  const host = (request.headers.get('host') || incoming.hostname).toLowerCase();

  let languageBase;
  if (host.includes('banhalminorbert.hu') || host.includes('banhalmi-hu-redirect')) {
    languageBase = 'https://www.norbertbanhalmi.com/hu/';
  } else if (host.includes('banhalmi.at') || host.includes('banhalmi-at-redirect')) {
    languageBase = 'https://www.norbertbanhalmi.com/de-at/';
  } else {
    return null;
  }

  const cleanPath = incoming.pathname.replace(/^\/+/, '');
  const target = new URL(cleanPath, languageBase);
  target.search = incoming.search;
  return target;
}

export default function middleware(request) {
  const target = redirectTarget(request);
  if (!target) {
    return new Response('Unknown redirect host', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'x-robots-tag': 'noindex'
      }
    });
  }

  return new Response(null, {
    status: 308,
    headers: {
      Location: target.href,
      'Cache-Control': 'public, max-age=0, s-maxage=86400'
    }
  });
}
