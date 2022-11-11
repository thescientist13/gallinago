import fs from 'fs';

const forwardArgs = process.execArgv;

fs.writeFileSync(
  new URL('./output/args.txt', import.meta.url),
  `${forwardArgs[0]}=${forwardArgs[1]}`
);