import {spawnSync} from 'node:child_process';

const shell = process.platform === 'win32' ? 'cmd' : 'sh';
const shellFlag = process.platform === 'win32' ? '/c' : '-lc';

function run(command, options = {}) {
  const result = spawnSync(shell, [shellFlag, command], {
    stdio: options.capture ? 'pipe' : 'inherit',
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf-8'
  });
  return result;
}

function runOrThrow(command, hint) {
  const result = run(command);
  if (result.status !== 0) {
    const message = hint ? `\n${hint}` : '';
    throw new Error(`Command failed: ${command}${message}`);
  }
}

async function main() {
  const dockerVersion = run('docker --version', {capture: true});
  if (dockerVersion.status !== 0) {
    throw new Error('Docker is required. Install Docker Desktop and ensure `docker` is available in PATH.');
  }

  runOrThrow('docker compose up -d --wait db', 'Failed to start local postgres container.');
  runOrThrow('npx prisma db push --skip-generate', 'Failed to sync Prisma schema to database.');
  runOrThrow('npx prisma generate', 'Failed to generate Prisma client.');
  runOrThrow('npm run db:seed', 'Failed to seed local database.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
