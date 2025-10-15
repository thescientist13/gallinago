import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

class Runner {
  constructor(enableStdOut = false, forwardParentArgs = false) {
    this.enableStdOut = enableStdOut; // debugging tests
    this.forwardParentArgs = forwardParentArgs;
    this.setupFiles = [];
    this.childProcess = null;
  }

  setup(rootDir, setupFiles = [], options = { create: true }) {
    this.setupFiles = setupFiles;

    return new Promise((resolve, reject) => {
      if (path.isAbsolute(rootDir)) {
        this.rootDir = rootDir;

        if (options.create) {
          fs.mkdirSync(this.rootDir, { recursive: true });
        }

        if (setupFiles.length > 0) {
          setupFiles.forEach((file) => {
            fs.mkdirSync(path.dirname(file.destination), { recursive: true });
            fs.copyFileSync(file.source, file.destination);
          });
        }

        resolve();
      } else {
        reject('Error: rootDir is not an absolute path');
      }
    });
  }

  runCommand(binPath, args) {
    return new Promise((resolve, reject) => {
      const executable = 'node';
      const isWindows = os.platform() === 'win32';
      const cliPath = binPath;
      const forwardArgs = this.forwardParentArgs ? process.execArgv : [];
      const finalArgs = [...forwardArgs, cliPath];
      let err = '';

      if (Array.isArray(args)) {
        finalArgs.push(...args);
      } else if (typeof args === 'string') {
        finalArgs.push(args);
      }

      if (!fs.existsSync(binPath)) {
        reject(`Error: Cannot find path ${binPath}`);
      }

      this.childProcess = spawn(executable, finalArgs, {
        cwd: this.rootDir,
        shell: false,
        detached: !isWindows
      });

      this.childProcess.on('close', code => {
        if (err !== '' && code && code !== 0) {
          reject(err);
          return;
        }
        resolve();
      });

      this.childProcess.stderr.on('data', (data) => {
        err = data.toString('utf8');
        if (this.enableStdOut) {
          console.error(err);
        }
      });

      this.childProcess.stdout.on('data', (data) => {
        if (this.enableStdOut) {
          console.log(data.toString('utf8'));
        }
      });
    });
  }

  stopCommand() {
    return new Promise((resolve) => {
      if (this.childProcess) {
        this.childProcess.on('exit', resolve);
        this.childProcess.kill();
      } else {
        resolve()
      }
    });
  }

  teardown(additionalFiles = []) {
    return new Promise((resolve, reject) => {
      try {
        (this.setupFiles || []).concat(additionalFiles).forEach((file) => {
          const deletePath = file.destination
            ? file.destination
            : file;

          if (fs.existsSync(deletePath)) {
            if (fs.lstatSync(deletePath).isDirectory()) {
              fs.rmSync(deletePath, { recursive: true });
            } else {
              fs.unlinkSync(deletePath);
            }
          }
        });

        this.setupFiles = [];
        resolve();
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }
}

export {
  Runner
};