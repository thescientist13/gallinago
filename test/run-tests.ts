import { readdirSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const isDeno = args[0] === '--deno';
if (isDeno) args.shift();

// Pass the glob directly to Node so discovery also works in Windows shells.
// Deno uses explicit paths because its test discovery conventions differ.
const casesPath = path.join('test', 'cases');
const specs = isDeno
  ? readdirSync(casesPath).flatMap((directory) =>
    readdirSync(path.join(casesPath, directory))
      .filter((file) => file.endsWith('.spec.ts'))
      .map((file) => path.join(casesPath, directory, file))
  )
  : ['test/cases/**/*.spec.ts'];

// Deno has no equivalent to Node's test timeout flag.
const runtimeArgs = isDeno
  ? args.filter((arg) => !arg.startsWith('--test-timeout='))
  : args;

// Type checking is handled by npm run check using the project Node typings.
const child = spawn(isDeno ? 'deno' : process.execPath, [
  ...(isDeno
    ? ['test', '--no-check', '-A', '--preload', './test/test-register-deno.ts']
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
