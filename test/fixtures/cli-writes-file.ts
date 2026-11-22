import fs from 'node:fs';

fs.writeFileSync('message.txt', process.argv[2] ?? 'hello');
