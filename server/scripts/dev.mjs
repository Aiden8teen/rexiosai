import { spawn } from 'node:child_process';

// The root api:dev script builds once before starting these watchers.
// Nest's decorator metadata requires tsc rather than a TS stripping runtime.
const children = [
  spawn(process.execPath, ['node_modules/typescript/lib/tsc.js', '--watch', '--preserveWatchOutput'], { stdio: 'inherit' }),
  spawn(process.execPath, ['--watch', 'dist/main.js'], { stdio: 'inherit' }),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop());
for (const child of children) {
  child.on('error', error => { console.error(error); stop(1); });
  child.on('exit', code => { if (!stopping) stop(code || 0); });
}
