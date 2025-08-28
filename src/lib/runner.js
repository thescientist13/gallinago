import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

class Runner {
  // JS strings can be up to 2^53 - 1 in length,
  // so no need to worry about overflow
  // https://262.ecma-international.org/16.0/index.html#sec-ecmascript-language-types-string-type
  #stdOutBuffer = '';
  #stdErrBuffer = '';

  #stdOutSubscribers = [];
  #stdErrSubscribers = [];

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

  runCommand(binPath, args, options = { background: false }) {
    return new Promise((resolve, reject) => {
      const executable = 'node';
      const isWindows = os.platform() === 'win32';
      const forwardArgs = this.forwardParentArgs ? process.execArgv : [];
      const finalArgs = [...forwardArgs, binPath];

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

      this.childProcess.on('close', (code) => {
        if (code !== 0) {
          reject(code);
          return;
        }
        resolve();
      });

      this.childProcess.stderr.on('data', (data) => {
        err += data.toString("utf8"); // Max string size ~1GiB

        if (this.enableStdOut) {
          console.error(text);
        }

        this.#stdErrSubscribers.forEach((callback) => callback(text));
      });

      this.childProcess.stdout.on('data', (data) => {
        const text = data.toString('utf8');
        this.#stdOutBuffer += text;

        if (this.enableStdOut) {
          console.log(text);
        }

        this.#stdOutSubscribers.forEach((callback) => callback(text));
      });

      if (options.background) {
        resolve();
      }
    });
  }

  getStdOut() {
    return this.#stdOutBuffer;
  }

  getStdErr() {
    return this.#stdErrBuffer;
  }

  onStdOut(callback, options = { replay: true }) {
    if (options.replay && this.#stdOutBuffer.length > 0) {
      callback(this.#stdOutBuffer);
    }

    this.#stdOutSubscribers.push(callback);
  }

  onStdErr(callback, options = { replay: true }) {
    if (options.replay && this.#stdErrBuffer.length > 0) {
      callback(this.#stdErrBuffer);
    }

    this.#stdErrSubscribers.push(callback);
  }

  stopCommand() {
    return new Promise((resolve) => {
      if (this.childProcess) {
        this.childProcess.on('exit', resolve);
        this.childProcess.kill();
      } else {
        resolve();
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