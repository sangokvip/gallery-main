import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from '@playwright/test';

const host = '127.0.0.1';
const port = Number(process.env.SHARE_VERIFY_PORT || 4184);
const baseUrl = `http://${host}:${port}`;
const widths = [320, 375, 390, 430, 768, 1024, 1440];

function waitForServer(child) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('dev server start timed out')), 20000);

    const onData = (chunk) => {
      const line = chunk.toString();
      if (line.includes(`http://${host}:${port}`) || line.includes('Local:')) {
        clearTimeout(timeout);
        resolve();
      }
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`dev server exited with code ${code}`));
    });
  });
}

async function assertNoErrors(page, errors, label, width) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyText: document.body.textContent || '',
    charts: document.querySelectorAll('.recharts-wrapper').length
  }));

  if (metrics.scrollWidth > metrics.clientWidth + 1) {
    throw new Error(`${label} has horizontal overflow at ${width}px: ${metrics.scrollWidth} > ${metrics.clientWidth}`);
  }

  if (errors.length) {
    throw new Error(`${label} browser errors at ${width}px:\n${errors.join('\n')}`);
  }

  return metrics;
}

async function newCheckedPage(browser) {
  const page = await browser.newPage();
  const errors = [];
  const localOrigin = new URL(baseUrl).origin;

  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    const text = message.text();
    if (message.type() === 'error' && !text.includes('Failed to load resource')) {
      if (text.startsWith('[Report Only]')) return;
      errors.push(text);
    }
  });
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.origin === localOrigin && response.status() >= 400) {
      errors.push(`${response.status()} ${url.pathname}`);
    }
  });

  return { page, errors };
}

async function assertProtectedShare(browser, width) {
  const { page, errors } = await newCheckedPage(browser);
  await page.setViewportSize({ width, height: 920 });
  await page.goto(`${baseUrl}/share.html?token=mock-share-token`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForFunction(() => document.body?.textContent?.includes('输入访问密码'), { timeout: 10000 });

  let metrics = await assertNoErrors(page, errors, 'protected share gate', width);
  if (!metrics.bodyText.includes('分享者为这份报告设置了访问密码')) {
    throw new Error(`protected share did not show password gate at ${width}px`);
  }

  await page.getByLabel('访问密码').fill('wrong-code');
  await page.getByRole('button', { name: '查看报告' }).click();
  await page.waitForFunction(() => document.body?.textContent?.includes('访问密码不正确'), { timeout: 10000 });

  await page.getByLabel('访问密码').fill('preview-code');
  await page.getByRole('button', { name: '查看报告' }).click();
  await page.waitForFunction(() => document.body?.textContent?.includes('本地预览加密分享'), { timeout: 10000 });
  await page.waitForFunction(() => document.body?.textContent?.includes('分享者已隐藏敏感明细项'), { timeout: 10000 });
  await page.waitForFunction(() => document.querySelectorAll('.recharts-wrapper').length >= 2, { timeout: 10000 });

  metrics = await assertNoErrors(page, errors, 'protected share report', width);
  for (const text of ['本地预览加密分享', '已评测项', '总项目', '评级分布', '突出维度', '报告摘要']) {
    if (!metrics.bodyText.includes(text)) {
      throw new Error(`protected share missing "${text}" at ${width}px`);
    }
  }

  if (metrics.bodyText.includes('本地预览项目')) {
    throw new Error(`protected share leaked hidden item details at ${width}px`);
  }

  if (metrics.charts < 2) {
    throw new Error(`protected share expected 2 charts at ${width}px, got ${metrics.charts}`);
  }

  await page.close();
}

async function assertOpenShare(browser, width) {
  const { page, errors } = await newCheckedPage(browser);
  await page.setViewportSize({ width, height: 920 });
  await page.goto(`${baseUrl}/share.html?token=mock-open-share-token`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForFunction(() => document.body?.textContent?.includes('本地预览公开分享'), { timeout: 10000 });
  await page.waitForFunction(() => document.querySelectorAll('.recharts-wrapper').length >= 2, { timeout: 10000 });

  const metrics = await assertNoErrors(page, errors, 'open share report', width);
  for (const text of ['本地预览公开分享', '已评测项', '总项目', '评级分布', '报告摘要']) {
    if (!metrics.bodyText.includes(text)) {
      throw new Error(`open share missing "${text}" at ${width}px`);
    }
  }

  await page.getByText(/^SSS \(\d+\)$/).first().waitFor({ timeout: 5000 });
  await page.getByText(/^SS \(\d+\)$/).first().waitFor({ timeout: 5000 });

  if (metrics.bodyText.includes('分享者已隐藏敏感明细项')) {
    throw new Error(`open share unexpectedly hid item details at ${width}px`);
  }

  if (metrics.charts < 2) {
    throw new Error(`open share expected 2 charts at ${width}px, got ${metrics.charts}`);
  }

  await page.close();
}

const server = spawn('npm', ['run', 'dev', '--', '--host', host, '--port', String(port), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    VITE_MEMBER_CENTER_MOCK: '1'
  }
});

try {
  await waitForServer(server);
  const browser = await chromium.launch();
  try {
    for (const width of widths) {
      console.log(`checking share reports at ${width}px`);
      await assertProtectedShare(browser, width);
      await assertOpenShare(browser, width);
    }
  } finally {
    await browser.close();
  }
  console.log(`share report verification passed on ${baseUrl}`);
} finally {
  server.kill('SIGTERM');
  await Promise.race([
    once(server, 'exit'),
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);
}
