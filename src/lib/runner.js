import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn, spawnSync } from 'child_process';

class Runner {
  constructor(enableStdOut = false, forwardParentArgs = false) {
    this.enableStdOut = enableStdOut; // debugging tests
    this.forwardParentArgs = forwardParentArgs;
    this.setupFiles = [];
    this.childProcess = null;
  }

  setup(rootDir, setupFiles = []) {
    this.setupFiles = setupFiles;

    return new Promise((resolve, reject) => {
      if (path.isAbsolute(rootDir)) {

        if (!fs.existsSync(rootDir)) {
          fs.mkdirSync(rootDir);
        }

        this.rootDir = rootDir;

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

  runCommand(binPath, args = '', options = { async: false }) {
    return new Promise(async (resolve, reject) => {
      const cliPath = binPath;
      const finalArgs = this.forwardParentArgs ? process.execArgv : [];
      const spawnAction = options.async ? spawn : spawnSync;
      let err = '';

      if (!fs.existsSync(binPath)) {
        reject(`Error: Cannot find path ${binPath}`);
      }

      const isWindows = os.platform() === 'win32';
      const runner = isWindows ? 'node.cmd' : 'node';
      this.childProcess = spawnAction(runner, [...finalArgs, cliPath, args], {
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
          console.error(err); // eslint-disable-line
        }
        reject(err);
      });

      this.childProcess.stdout.on('data', (data) => {
        if (this.enableStdOut) {
          console.log(data.toString('utf8')); // eslint-disable-line
        }
      });
    });
  }

  stopCommand() {
    if (this.childProcess) {
      if (os.platform() === 'win32') {
        spawn('taskkill', ['/pid', this.childProcess.pid, '/t', '/f']);
      } else {
        process.kill(-this.childProcess.pid, 'SIGKILL');
      }
    }
  }

  teardown(additionalFiles = []) {
    return new Promise(async (resolve, reject) => {
      try {
        this.setupFiles.concat(additionalFiles).forEach((file) => {
          const deletePath = file.destination
            ? file.destination
            : file;

          if (fs.lstatSync(deletePath).isDirectory()) {
            fs.rmSync(deletePath, { recursive: true });
          } else {
            fs.unlinkSync(deletePath);
          }
        });
        this.setupFiles = [];

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export {
  Runner
};