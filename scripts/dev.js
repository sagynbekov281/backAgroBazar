const { spawn, execFile } = require('child_process');
const path = require('path');

const port = process.env.PORT || '4000';
const projectRoot = path.resolve(__dirname, '..');

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: true, ...options });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

function killProcessOnPort() {
  return new Promise((resolve) => {
    const platform = process.platform;

    if (platform === 'win32') {
      execFile('netstat', ['-ano', '-p', 'tcp'], (error, stdout) => {
        if (error) return resolve();
        const lines = stdout.split(/\r?\n/);
        const pid = lines
          .map(line => line.trim())
          .find(line => line.includes(`:${port}`) && line.includes('LISTENING'))
          ?.split(/\s+/)
          .pop();

        if (!pid) return resolve();

        execFile('taskkill', ['/F', '/PID', pid], (killError) => {
          if (killError) {
            console.warn(`Не удалось остановить процесс ${pid}:`, killError.message);
          }
          resolve();
        });
      });
      return;
    }

    execFile('lsof', ['-ti', `tcp:${port}`], (error, stdout) => {
      if (error) return resolve();
      const pids = stdout.split(/\r?\n/).filter(Boolean);
      if (!pids.length) return resolve();
      const killCommand = process.platform === 'darwin' ? 'kill' : 'kill';
      execFile(killCommand, ['-9', ...pids], (killError) => {
        if (killError) {
          console.warn(`Не удалось остановить процессы ${pids.join(', ')}:`, killError.message);
        }
        resolve();
      });
    });
  });
}

(async () => {
  await killProcessOnPort();
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  await runCommand(npxCommand, ['ts-node-dev', '--respawn', '--transpile-only', 'src/index.ts'], { cwd: projectRoot });
})();
