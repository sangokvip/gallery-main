import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const reportDir = 'docs/launch-reports';
const timestamp = new Date().toISOString();
const reportPath = `${reportDir}/${timestamp.replace(/[:.]/g, '-').slice(0, 19)}-member-launch-report.json`;

const commands = [
  {
    name: 'predeploy',
    command: 'npm',
    args: ['run', 'verify:member-predeploy']
  }
];

function envFlag(name) {
  return Boolean(process.env[name]);
}

function run(command, args) {
  return new Promise((resolve) => {
    const startedAt = new Date();
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });
    child.stderr.on('data', chunk => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.once('exit', (code) => {
      const finishedAt = new Date();
      resolve({
        command: [command, ...args].join(' '),
        exitCode: code,
        ok: code === 0,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        stdoutTail: stdout.slice(-12000),
        stderrTail: stderr.slice(-12000)
      });
    });
  });
}

function getGitStatus() {
  try {
    return execFileSync('git', ['status', '--short'], { encoding: 'utf8' });
  } catch (error) {
    return `git status failed: ${error.message}`;
  }
}

function buildSummary(commandResults) {
  const failed = commandResults.filter(item => !item.ok);
  if (failed.length > 0) {
    return {
      status: 'failed',
      message: `${failed.length} launch verification command(s) failed`
    };
  }

  const hasSupabaseEnv = envFlag('SUPABASE_URL') || envFlag('VITE_SUPABASE_URL');
  const hasAnonEnv = envFlag('SUPABASE_ANON_KEY') || envFlag('VITE_SUPABASE_ANON_KEY');
  const hasSiteEnv = envFlag('SITE_URL') || envFlag('PRODUCTION_SITE_URL') || envFlag('VERCEL_URL');
  const hasWebhookSecret = envFlag('MEMBER_WEBHOOK_SECRET');

  if (hasSupabaseEnv && hasAnonEnv && hasSiteEnv && hasWebhookSecret) {
    return {
      status: 'passed_with_remote_checks',
      message: 'Local, Supabase remote, signed webhook, and site remote checks were requested'
    };
  }

  return {
    status: 'passed_local_only',
    message: 'Local predeploy checks passed; remote production checks were skipped unless explicit env vars were set'
  };
}

async function main() {
  mkdirSync(reportDir, { recursive: true });

  const commandResults = [];
  for (const item of commands) {
    commandResults.push(await run(item.command, item.args));
  }

  const report = {
    schemaVersion: '1.0',
    reportId: reportPath.split('/').pop().replace(/\.json$/, ''),
    generatedAt: timestamp,
    summary: buildSummary(commandResults),
    environmentPresence: {
      SUPABASE_URL: envFlag('SUPABASE_URL'),
      SUPABASE_ANON_KEY: envFlag('SUPABASE_ANON_KEY'),
      VITE_SUPABASE_URL: envFlag('VITE_SUPABASE_URL'),
      VITE_SUPABASE_ANON_KEY: envFlag('VITE_SUPABASE_ANON_KEY'),
      SITE_URL: envFlag('SITE_URL'),
      PRODUCTION_SITE_URL: envFlag('PRODUCTION_SITE_URL'),
      VERCEL_URL: envFlag('VERCEL_URL'),
      MEMBER_WEBHOOK_SECRET: envFlag('MEMBER_WEBHOOK_SECRET'),
      SUPABASE_SERVICE_ROLE_KEY: envFlag('SUPABASE_SERVICE_ROLE_KEY')
    },
    commands: commandResults,
    gitStatusShort: getGitStatus(),
    requiredProductionFollowUps: [
      '在 Supabase SQL Editor 执行 database/member_center_full_deploy.sql，并确认 deployment check 结果全部 ok=true。',
      '部署成功后，如需数据库端到端演练，再单独执行 database/member_center_e2e_check.sql；它会写入并清理临时测试数据。',
      '部署 supabase/functions/member-payment-webhook 并配置 MEMBER_WEBHOOK_SECRET 和 SUPABASE_SERVICE_ROLE_KEY。',
      '用显式 SUPABASE_URL/SUPABASE_ANON_KEY/MEMBER_WEBHOOK_SECRET 执行 npm run verify:member-production -- --require-env --require-webhook-secret。',
      '用显式 SITE_URL 执行 npm run verify:site-production -- --require-env。',
      '用真实用户名密码完成会员注册/登录、订单提交、后台审核、高级报告、私密分享和支付回调验证。'
    ]
  };

  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`member launch report written: ${reportPath}`);

  if (commandResults.some(item => !item.ok)) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error?.message || error);
  process.exit(1);
});
