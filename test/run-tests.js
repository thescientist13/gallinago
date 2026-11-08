import { readdirSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

// Node 18 and 20 do not expand test CLI globs, and Windows npm shells do not expand them either.
// Since our Node support is >= 18, we manually glob all spec files and run Node's native test runner programmatically.
// Once the minimum Node version and CI matrix are Node 22+, we can remove this wrapper.
const casesPath = path.join('test', 'cases');
const specs = readdirSync(casesPath).flatMap((directory) =>
  readdirSync(path.join(casesPath, directory))
    .filter((file) => file.endsWith('.spec.js'))
    .map((file) => path.join(casesPath, directory, file))
);
const args = process.argv.slice(2);
const isDeno = args[0] === '--deno';
if (isDeno) args.shift();

// --test-timeout is available in Node 20.11+ and 21.2+.
// Omit the npm-configured timeout on unsupported runtimes (including Node 18),
// which keep the default timeout of Infinity. Deno has no equivalent CLI flag,
// so its test run also has no timeout.
const [major, minor] = process.versions.node.split('.').map(Number);
const supportsTimeout = major >= 22
  || (major === 21 && minor >= 2)
  || (major === 20 && minor >= 11);
const runtimeArgs = !isDeno && supportsTimeout
  ? args
  : args.filter((arg) => !arg.startsWith('--test-timeout='));

const child = spawn(isDeno ? 'deno' : process.execPath, [
  ...(isDeno
    ? ['test', '-A', '--preload', './test/test-register-deno.js']
    : ['--test']),
  ...runtimeArgs,
  ...specs,
], { stdio: 'inherit' });

child.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on('exit', (code, signal) => {
  process.exitCode = signal ? 1 : code;
});
