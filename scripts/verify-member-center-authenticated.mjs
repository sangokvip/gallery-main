import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from '@playwright/test';

const host = '127.0.0.1';
const port = Number(process.env.MEMBER_AUTH_VERIFY_PORT || 4182);
const baseUrl = `http://${host}:${port}`;
const widths = [320, 375, 390, 430, 768, 1024, 1440];
const requiredTexts = [
  '已登录：member_preview',
  '长期云同步',
  '具体项目变化',
  '记录可导出',
  '账号与联系方式',
  '评分数量趋势',
  '累计评级分布',
  '变化分析',
  '测评记录库',
  '查看明细',
  '分享',
  '保存图片',
  '双人分析'
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
    rows: document.querySelectorAll('.member-table tbody tr').length,
    mobileCards: document.querySelectorAll('.record-mobile-card').length
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

  if (width <= 640 && metrics.mobileCards < 3) {
    throw new Error(`/member.html expected mobile record cards at ${width}px, got ${metrics.mobileCards}`);
  }

  await page.getByRole('button', { name: '查看明细' }).first().click();
  const detailsDialog = page.getByRole('dialog');
  await detailsDialog.getByText('综合强度').waitFor({ timeout: 5000 });
  await detailsDialog.getByText(/^SSS \(\d+\)$/).waitFor({ timeout: 5000 });
  await detailsDialog.getByText(/^SS \(\d+\)$/).waitFor({ timeout: 5000 });
  await detailsDialog.getByText(/^S \(\d+\)$/).waitFor({ timeout: 5000 });
  await page.getByRole('button', { name: '关闭' }).click();

  await page.getByRole('button', { name: /^分享$/ }).first().click();
  const shareDialog = page.getByRole('dialog');
  await shareDialog.getByText('分享链接打开后会记录浏览次数').waitFor({ timeout: 5000 });
  await shareDialog.getByText(/浏览 \d+ 次/).waitFor({ timeout: 5000 });
  await shareDialog.getByRole('button', { name: '生成分享链接' }).waitFor({ timeout: 5000 });
  await page.getByRole('button', { name: '关闭' }).click();

  await page.getByRole('button', { name: '保存图片' }).first().click();
  const imageDialog = page.getByRole('dialog');
  await imageDialog.getByText(/完成 \d+\/\d+ 项/).waitFor({ timeout: 5000 });
  await imageDialog.getByRole('button', { name: '保存图片' }).waitFor({ timeout: 5000 });
  await page.getByRole('button', { name: '关闭' }).click();

  await page.getByRole('button', { name: '双人分析' }).first().click();
  const pairDialog = page.getByRole('dialog');
  await pairDialog.getByText('双人分析报告').waitFor({ timeout: 5000 });
  await pairDialog.getByLabel('关系模式').waitFor({ timeout: 5000 });
  await pairDialog.getByText('契合度').waitFor({ timeout: 5000 });
  await pairDialog.getByText('边界冲突').waitFor({ timeout: 5000 });
  await page.getByRole('button', { name: '关闭' }).click();

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
