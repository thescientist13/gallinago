import fs from 'node:fs';

const forwardArgs = process.execArgv;

fs.writeFileSync(
  new URL('./output/args.txt', import.meta.url),
  JSON.stringify(forwardArgs)
);