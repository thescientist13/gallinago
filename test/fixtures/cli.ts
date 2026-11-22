#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function isDotFile(file = '') {
  if (file.indexOf('.') === 0 && (file.indexOf('git') < 0)) {
    return file;
  }
}

function isNotDirectory(file = '') {
  if (!fs.lstatSync(file).isDirectory()) {
    return file;
  }
}

const scanFiles = (userDirectory: string) => {
  return new Promise<string[]>((resolve, reject) => {
    try {
      const files = fs.readdirSync(userDirectory);
      const userFiles: string[] = [];

      const dotFiles = files
        .filter(isDotFile)
        .filter(file => isNotDirectory(`${userDirectory}/${file}`));

      resolve([...dotFiles, ...userFiles]);
    } catch (error) {
      console.log('Unexpected error scanning files', error);
      reject(error);
    }
  });
};

const validateUserPath = (args: string[]) => {
  return new Promise<string>((resolve, reject) => {
    if (args.length <= 2) {
      reject('Missing required paramater: path.  Usage is npx copy-dots /some/path');
      return;
    }

    const userPath = path.isAbsolute(args[2])
      ? args[2]
      : path.join(process.cwd(), args[2]);

    resolve(userPath);
  });
};

const run = async () => {

  try {
    console.log('Validating user directory...');
    const currentDirectory = process.cwd();
    const userPathAbsolute = await validateUserPath(process.argv);

    console.log('Reading options...');
    console.log('Scanning Files in user directory...', userPathAbsolute);
    const files = await scanFiles(userPathAbsolute);

    console.log('Copying filtered files into current directory...');
    files.forEach(file => {
      const fullPath = `${userPathAbsolute}/${file}`;

      console.log('copying file from', fullPath);
      console.log('copying file to', currentDirectory);
      fs.copyFileSync(fullPath, `${currentDirectory}/${file}`);
    });
  } catch (err) {
    console.error(err);
  }

  return Promise.resolve(process.exit);
};

run();