const requiredPages = [
  { path: '/', text: '会员中心' },
  { path: '/female.html', text: '会员中心' },
  { path: '/male.html', text: '会员中心' },
  { path: '/s.html', text: '会员中心' },
  { path: '/lgbt.html', text: '会员中心' },
  { path: '/member.html', text: '会员中心' },
  { path: '/share.html?token=missing', text: '分享不可用' },
  { path: '/sangok.html', text: '管理后台' },
  { path: '/message.html', text: 'I Love Dirty Talk' }
];

const requiredHeaders = {
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer'
};

function getSiteUrl() {
  const raw = process.env.SITE_URL || process.env.PRODUCTION_SITE_URL || process.env.VERCEL_URL;
  if (!raw) return null;
  const withProtocol = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, '');
}

async function readText(response) {
  const text = await response.text();
  return text.slice(0, 500000);
}

function record(results, name, ok, detail) {
  results.push({ name, ok, detail });
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyPage(baseUrl, target, results) {
  const response = await fetchWithTimeout(`${baseUrl}${target.path}`, {
    headers: { 'User-Agent': 'codex-member-production-check' }
  });
  const text = await readText(response);
  record(results, `page:${target.path}:status`, response.ok, `HTTP ${response.status}`);
  record(
    results,
    `page:${target.path}:content`,
    text.includes(target.text),
    text.includes(target.text) ? `found "${target.text}"` : `missing "${target.text}"`
  );

  if (target.path === '/share.html?token=missing') {
    const robotsMeta = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(text)
      || /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(text);
    record(results, 'page:/share.html:noindex', robotsMeta, robotsMeta ? 'share page has noindex' : 'share page missing noindex');
  }

  return response;
}

async function verifyHeaders(response, results) {
  for (const [header, expected] of Object.entries(requiredHeaders)) {
    const actual = response.headers.get(header) || '';
    record(
      results,
      `header:${header}`,
      actual.toLowerCase() === expected.toLowerCase(),
      actual || 'missing'
    );
  }

  const csp = response.headers.get('content-security-policy') || '';
  record(results, 'header:content-security-policy', csp.includes("default-src 'self'") && csp.includes('frame-ancestors'), csp || 'missing');
}

async function verifyRobotsAndSitemap(baseUrl, results) {
  const robotsResponse = await fetchWithTimeout(`${baseUrl}/robots.txt`);
  const robots = await readText(robotsResponse);
  record(results, 'robots:status', robotsResponse.ok, `HTTP ${robotsResponse.status}`);
  record(results, 'robots:member_allowed', robots.includes('Allow: /member.html'), 'member allow rule');
  record(results, 'robots:sitemap', robots.includes(`${baseUrl}/sitemap.xml`) || robots.includes('/sitemap.xml'), 'sitemap entry');

  const sitemapResponse = await fetchWithTimeout(`${baseUrl}/sitemap.xml`);
  const sitemap = await readText(sitemapResponse);
  record(results, 'sitemap:status', sitemapResponse.ok, `HTTP ${sitemapResponse.status}`);
  for (const path of ['/', '/female.html', '/male.html', '/s.html', '/lgbt.html', '/member.html']) {
    const expected = `${baseUrl}${path === '/' ? '/' : path}`;
    record(results, `sitemap:${path}`, sitemap.includes(expected), expected);
  }
  record(results, 'sitemap:share_excluded', !sitemap.includes('/share.html'), 'share pages should not be indexed');
}

async function main() {
  const baseUrl = getSiteUrl();
  const requireEnv = process.argv.includes('--require-env');

  if (!baseUrl) {
    const message = 'site production verification skipped: set SITE_URL or PRODUCTION_SITE_URL';
    if (requireEnv) {
      console.error(message);
      process.exit(1);
    }
    console.log(message);
    return;
  }

  const results = [];
  const homeResponse = await verifyPage(baseUrl, requiredPages[0], results);
  await verifyHeaders(homeResponse, results);
  for (const target of requiredPages.slice(1)) {
    await verifyPage(baseUrl, target, results);
  }
  await verifyRobotsAndSitemap(baseUrl, results);

  const failures = results.filter(item => !item.ok);
  for (const item of results) {
    console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name} - ${item.detail}`);
  }

  if (failures.length) {
    console.error(`site production verification failed: ${failures.length} failed`);
    process.exit(1);
  }

  console.log('site production verification passed');
}

main().catch(error => {
  console.error(error?.message || error);
  process.exit(1);
});
