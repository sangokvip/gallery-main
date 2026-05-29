import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from '@playwright/test';

const host = '127.0.0.1';
const port = Number(process.env.MEMBER_AUTH_VERIFY_PORT || 4182);
const baseUrl = `http://${host}:${port}`;
const widths = [320, 375, 390, 430, 768, 1024, 1440];
const requiredTexts = [
  '会员账号',
  '已登录：member-preview@example.test',
  '会员等级：premium',
  '会员表已连接',
  '会员权益',
  '开通 / 升级会员',
  '高级报告与私密分享',
  '高级报告',
  '评分数量趋势',
  '累计评级分布',
  '变化分析',
  '测评记录库',
  '本地预览设备',
  '已绑定 2 个测评身份',
  '旧设备身份',
  '换设备登录同一邮箱后'
];

function waitForServer(child) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('dev server start timed out')), 20000);

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
      reject(new Error(`dev server exited with code ${code}`));
    });
  });
}

async function assertAuthenticatedMemberCenter(browser, width) {
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

  await page.goto(`${baseUrl}/member.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  for (const text of requiredTexts) {
    try {
      await page.waitForFunction(
        (expected) => document.body?.textContent?.includes(expected),
        text,
        { timeout: 10000 }
      );
    } catch {
      throw new Error(`/member.html missing authenticated text "${text}" at ${width}px`);
    }
  }

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyText: document.body.textContent || '',
    charts: document.querySelectorAll('.recharts-wrapper').length,
    rows: document.querySelectorAll('.member-table tbody tr').length
  }));

  if (metrics.scrollWidth > metrics.clientWidth + 1) {
    throw new Error(`/member.html authenticated view has horizontal overflow at ${width}px: ${metrics.scrollWidth} > ${metrics.clientWidth}`);
  }

  if (metrics.charts < 2) {
    throw new Error(`/member.html expected at least 2 rendered charts at ${width}px, got ${metrics.charts}`);
  }

  if (metrics.rows < 3) {
    throw new Error(`/member.html expected mock record rows at ${width}px, got ${metrics.rows}`);
  }

  for (const text of requiredTexts) {
    if (!metrics.bodyText.includes(text)) {
      throw new Error(`/member.html missing authenticated text "${text}" after render at ${width}px`);
    }
  }

  if (errors.length) {
    throw new Error(`/member.html authenticated browser errors at ${width}px:\n${errors.join('\n')}`);
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
      console.log(`checking authenticated member center at ${width}px`);
      await assertAuthenticatedMemberCenter(browser, width);
    }
  } finally {
    await browser.close();
  }
  console.log(`authenticated member center verification passed on ${baseUrl}`);
} finally {
  server.kill('SIGTERM');
  await Promise.race([
    once(server, 'exit'),
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);
}
