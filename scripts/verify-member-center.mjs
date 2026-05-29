import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from '@playwright/test';

const host = '127.0.0.1';
const port = Number(process.env.MEMBER_VERIFY_PORT || 4181);
const baseUrl = `http://${host}:${port}`;
const coreWidths = [320, 375, 390, 430, 768, 1024, 1440];
const pages = [
  { path: '/member.html', text: '会员中心', widths: coreWidths },
  { path: '/share.html?token=missing', text: '分享不可用', widths: [320, 390, 430, 768, 1440] },
  { path: '/sangok.html', text: '管理后台', widths: coreWidths },
  { path: '/message.html', text: 'I Love Dirty Talk', widths: coreWidths },
  { path: '/index.html', text: '会员中心', widths: [320, 390, 430, 768, 1440] },
  { path: '/male.html', text: '会员中心', widths: [320, 390, 430, 768, 1440] },
  { path: '/s.html', text: '会员中心', widths: [320, 390, 430, 768, 1440] },
  { path: '/lgbt.html', text: '会员中心', widths: [320, 390, 430, 768, 1440] },
];

function waitForServer(child) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('preview server start timed out')), 20000);

    const onData = (chunk) => {
      const line = chunk.toString();
      if (line.includes(`http://${host}:${port}`) || line.includes(`Local:`)) {
        clearTimeout(timeout);
        resolve();
      }
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`preview server exited with code ${code}`));
    });
  });
}

async function assertPage(browser, target) {
  for (const width of target.widths) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    const errors = [];
    const localOrigin = new URL(baseUrl).origin;
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      const text = message.text();
      if (message.type() === 'error' && !text.includes('Failed to load resource')) {
        if (text.startsWith('[Report Only]')) return;
        if (text.includes('https://ep1.adtrafficquality.google/')) return;
        if (text.includes('from origin') && text.includes('has been blocked by CORS policy')) return;
        errors.push(text);
      }
    });
    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.origin === localOrigin && response.status() >= 400) {
        errors.push(`${response.status()} ${url.pathname}`);
      }
    });

    await page.goto(`${baseUrl}${target.path}`, { waitUntil: 'commit', timeout: 20000 });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    try {
      await page.waitForFunction(
        (text) => document.body?.textContent?.includes(text),
        target.text,
        { timeout: 8000 }
      );
    } catch (error) {
      throw new Error(`${target.path} missing expected text "${target.text}" before timeout at ${width}px`);
    }

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyText: document.body.textContent || '',
    }));

    if (metrics.scrollWidth > metrics.clientWidth + 1) {
      throw new Error(`${target.path} has horizontal overflow at ${width}px: ${metrics.scrollWidth} > ${metrics.clientWidth}`);
    }

    if (!metrics.bodyText.includes(target.text)) {
      throw new Error(`${target.path} missing expected text "${target.text}" at ${width}px`);
    }

    if (errors.length) {
      throw new Error(`${target.path} browser errors at ${width}px:\n${errors.join('\n')}`);
    }

    await page.close();
  }
}

const server = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitForServer(server);
  const browser = await chromium.launch();
  try {
    for (const target of pages) {
      console.log(`checking ${target.path}`);
      await assertPage(browser, target);
    }
  } finally {
    await browser.close();
  }
  console.log(`member center verification passed: ${pages.length} page groups on ${baseUrl}`);
} finally {
  server.kill('SIGTERM');
  await Promise.race([
    once(server, 'exit'),
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);
}
