import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const sqlFiles = [
  'database/member_center_predeploy_check.sql',
  'database/create_member_center_tables.sql',
  'database/create_admin_member_session.sql',
  'database/member_center_deployment_check.sql',
  'database/member_center_e2e_check.sql'
];

const commands = [
  ['npm', ['run', 'prepare:member-deployment']],
  ['npm', ['run', 'verify:member-security']],
  ['npm', ['run', 'build']],
  ['npm', ['run', 'verify:member-center']],
  ['npm', ['run', 'verify:member-auth']],
  ['npm', ['run', 'verify:admin-auth']],
  ['npm', ['run', 'verify:share-report']],
  ['npm', ['run', 'verify:payment-webhook']],
  ['npm', ['run', 'verify:member-production']],
  ['npm', ['run', 'verify:site-production']],
  ['git', ['diff', '--check']]
];

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n$ ${[command, ...args].join(' ')}`);
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: process.env
    });

    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      }
    });
  });
}

function verifyDeploymentBundle() {
  const bundlePath = 'database/member_center_full_deploy.sql';
  if (!existsSync(bundlePath)) {
    throw new Error(`${bundlePath} is missing`);
  }

  const bundle = readFileSync(bundlePath, 'utf8');
  for (const file of sqlFiles) {
    const content = readFileSync(file, 'utf8');
    const hash = sha256(content);
    if (!bundle.includes(`-- ${sqlFiles.indexOf(file) + 1}. ${file}`)) {
      throw new Error(`${bundlePath} missing section for ${file}`);
    }
    if (!bundle.includes(`-- sha256: ${hash}`)) {
      throw new Error(`${bundlePath} has stale sha256 for ${file}`);
    }
  }

  console.log('deployment SQL bundle hash check passed');
}

function verifyWorklogs() {
  const dir = 'docs/worklogs';
  for (const file of readdirSync(dir).filter(name => name.endsWith('.json'))) {
    JSON.parse(readFileSync(`${dir}/${file}`, 'utf8'));
  }
  console.log('worklogs json parse passed');
}

function verifyNoListenerOn(port) {
  return new Promise((resolve, reject) => {
    const child = spawn('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk.toString(); });
    child.stderr.on('data', chunk => { output += chunk.toString(); });
    child.once('exit', (code) => {
      if (code === 1) {
        resolve();
        return;
      }
      if (code === 0) {
        reject(new Error(`port ${port} still has a listener:\n${output.trim()}`));
        return;
      }
      reject(new Error(`lsof failed for port ${port}: ${output.trim()}`));
    });
  });
}

async function verifyNoResidualServers() {
  for (const port of [4181, 4182, 4183, 4184]) {
    await verifyNoListenerOn(port);
  }
  console.log('verification ports are clean');
}

async function main() {
  for (const [command, args] of commands) {
    await run(command, args);
    if (command === 'npm' && args.join(' ') === 'run prepare:member-deployment') {
      verifyDeploymentBundle();
    }
  }

  verifyWorklogs();
  await verifyNoResidualServers();
  console.log('\nmember predeploy verification passed');
}

main().catch(error => {
  console.error(error?.message || error);
  process.exit(1);
});
