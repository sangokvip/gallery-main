import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from '@playwright/test';

const host = '127.0.0.1';
const port = Number(process.env.ADMIN_AUTH_VERIFY_PORT || 4183);
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

async function assertNoOverflow(page, label, width) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyText: document.body.textContent || ''
  }));

  if (metrics.scrollWidth > metrics.clientWidth + 1) {
    throw new Error(`${label} has horizontal overflow at ${width}px: ${metrics.scrollWidth} > ${metrics.clientWidth}`);
  }

  return metrics.bodyText;
}

async function openAdmin(page) {
  await page.goto(`${baseUrl}/sangok.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
}

async function login(page) {
  await page.getByPlaceholder('用户名').fill('admin-preview');
  await page.getByPlaceholder('密码').fill('preview-password');
  await page.getByRole('button', { name: '登录' }).click();
  await page.waitForFunction(() => document.body?.textContent?.includes('后台快捷跳转'), { timeout: 10000 });
}

async function assertDashboard(page, width) {
  const bodyText = await assertNoOverflow(page, 'admin dashboard', width);
  for (const text of ['后台快捷跳转', '测评记录', '会员管理', '安全管理', '系统设置', '站点页面', '最近测评']) {
    if (!bodyText.includes(text)) {
      throw new Error(`admin dashboard missing "${text}" at ${width}px`);
    }
  }
}

async function assertRecordDetailCount(page, width) {
  await page.getByRole('button', { name: '详情' }).first().click();
  await page.waitForFunction(() => document.body?.textContent?.includes('评测项'), { timeout: 10000 });
  const bodyText = await assertNoOverflow(page, 'admin record detail', width);
  if (!bodyText.includes('108') || !bodyText.includes('评测项')) {
    throw new Error(`admin detail did not show 108 items at ${width}px`);
  }
  await page.getByRole('button', { name: '✕' }).click();
}

async function assertRecords(page, width) {
  await page.locator('[data-admin-tab="records"]').click();
  await page.waitForFunction(() => document.body?.textContent?.includes('共 36 条记录'), { timeout: 10000 });
  let bodyText = await assertNoOverflow(page, 'admin records', width);
  if (!bodyText.includes('mock-record-001') || !bodyText.includes('108 项')) {
    throw new Error(`admin records did not show true result count at ${width}px`);
  }

  await page.getByLabel('跳转页码').fill('2');
  await page.getByRole('button', { name: '跳转' }).click();
  await page.waitForFunction(() => document.body?.textContent?.includes('mock-record-021'), { timeout: 10000 });
  bodyText = await assertNoOverflow(page, 'admin records page jump', width);
  if (!bodyText.includes('2 / 2') || !bodyText.includes('mock-record-021')) {
    throw new Error(`admin records page jump failed at ${width}px`);
  }
}

async function assertMembers(page, width) {
  await page.locator('[data-admin-tab="members"]').click();
  await page.waitForFunction(() => document.body?.textContent?.includes('会员筛选'), { timeout: 10000 });
  let bodyText = await assertNoOverflow(page, 'admin members', width);
  for (const text of ['会员账号', '有效订阅', '待审核订单', '会员筛选', '联系方式', '订单审核', '本地预览待审核订单', '本地高级会员']) {
    if (!bodyText.includes(text)) {
      throw new Error(`admin members missing "${text}" at ${width}px`);
    }
  }

  await page.getByPlaceholder('昵称 / 邮箱 / QQ / 微信 / 电话').fill('premium');
  await page.waitForFunction(() => document.body?.textContent?.includes('premium@example.com'), { timeout: 10000 });
  await assertNoOverflow(page, 'admin members search', width);
  const memberTableText = await page.locator('.member-list-table').innerText();
  if (!memberTableText.includes('本地高级会员') || memberTableText.includes('本地基础会员')) {
    throw new Error(`admin member search failed at ${width}px`);
  }

  await page.locator('.member-list-table').getByRole('button', { name: '详情' }).first().click();
  await page.waitForFunction(() => document.body?.textContent?.includes('账号标识'), { timeout: 10000 });
  bodyText = await assertNoOverflow(page, 'admin member detail', width);
  for (const text of ['账号标识', '会员测评记录', '订单记录', 'premium_preview', 'mock-record-001', '108 项']) {
    if (!bodyText.includes(text)) {
      throw new Error(`admin member detail missing "${text}" at ${width}px`);
    }
  }

  await page.getByRole('button', { name: '测评详情' }).first().click();
  await page.waitForFunction(() => document.body?.textContent?.includes('评测项'), { timeout: 10000 });
  bodyText = await assertNoOverflow(page, 'admin member record detail', width);
  if (!bodyText.includes('108') || !bodyText.includes('评测项')) {
    throw new Error(`admin member record detail did not show 108 items at ${width}px`);
  }
  await page.locator('.modal-close').last().click();
  await page.locator('.modal-close').first().click();
}

async function assertAuthenticatedAdmin(browser, width) {
  const page = await browser.newPage({ viewport: { width, height: 920 } });
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

  await openAdmin(page);
  await login(page);
  await assertDashboard(page, width);
  await assertRecordDetailCount(page, width);
  await assertRecords(page, width);
  await assertMembers(page, width);

  if (errors.length) {
    throw new Error(`admin authenticated browser errors at ${width}px:\n${errors.join('\n')}`);
  }

  await page.close();
}

const server = spawn('npm', ['run', 'dev', '--', '--host', host, '--port', String(port), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    VITE_ADMIN_MOCK: '1'
  }
});

try {
  await waitForServer(server);
  const browser = await chromium.launch();
  try {
    for (const width of widths) {
      console.log(`checking authenticated admin at ${width}px`);
      await assertAuthenticatedAdmin(browser, width);
    }
  } finally {
    await browser.close();
  }
  console.log(`authenticated admin verification passed on ${baseUrl}`);
} finally {
  server.kill('SIGTERM');
  await Promise.race([
    once(server, 'exit'),
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);
}
