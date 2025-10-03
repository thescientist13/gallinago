import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

class Runner {
  #rootDir;
  #setupFiles = [];
  #childProcess = null;

  #enableDebug = false;
  #forwardParentArgs = false;

  // JS strings can be up to 2^53 - 1 in length,
  // so no need to worry about overflow
  // https://262.ecma-international.org/16.0/index.html#sec-ecmascript-language-types-string-type
  #stdOutBuffer = '';
  #stdErrBuffer = '';

  #stdOutSubscribers = [];
  #stdErrSubscribers = [];

  constructor(enableDebug = false, forwardParentArgs = false) {
    this.#enableDebug = enableDebug; // debugging tests
    this.#forwardParentArgs = forwardParentArgs;
  }

  async setup(rootDir, setupFiles = null, options = { create: true }) {
    setupFiles ??= [];

    this.#setRootDir(rootDir);
    this.#setSetupFiles(setupFiles);

    if (options.create) {
      try {
        await fs.mkdir(this.#rootDir, { recursive: true });
      } catch (err) {
        if (err.message?.startsWith('EEXIST: file already exists')) {
          // Do nothing
        } else {
          throw err;
        }
      }
    }

    for (const file of setupFiles) {
      await fs.mkdir(path.dirname(file.destination), { recursive: true });
      await fs.copyFile(file.source, file.destination);
    }
  }

  async runCommand(binPath, args, options = { background: false }) {
    const executable = 'node';
    const isWindows = os.platform() === 'win32';
    const forwardArgs = this.#forwardParentArgs ? process.execArgv : [];
    const finalArgs = [...forwardArgs, binPath];

    if (Array.isArray(args)) {
      finalArgs.push(...args);
    } else if (typeof args === 'string') {
      finalArgs.push(args);
    }

    await this.#throwIfBinNotExist(binPath);

    this.#childProcess = spawn(executable, finalArgs, {
      cwd: this.#rootDir,
      shell: false,
      detached: !isWindows,
    });

    this.#childProcess.stdout.on('data', this.#handleStdOut.bind(this));
    this.#childProcess.stderr.on('data', this.#handleStdErr.bind(this));

    if (options.background) {
      // Resolve immediately so caller can start processing outputs
      return new Promise((resolve, reject) => {
        this.#childProcess.on('spawn', resolve);
        this.#childProcess.on('error', reject);
      });
    } else {
      // Resolve when process exits
      return new Promise((resolve, reject) => {
        this.#childProcess.on('error', reject);
        this.#childProcess.on('close', (code) => {
          if (code) {
            reject(
              new Error(`Error: Child process exited with error code ${code}.`)
            );
          } else {
            resolve();
          }
        });
      });
    }
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
    if (!this.#childProcess) {
      return;
    }

    if (!this.#childProcess.kill()) {
      const processID = this.#childProcess.pid;
      throw new Error(
        `Error: Failed to kill child process (PID: ${processID})`
      );
    }
  }

  async teardown(additionalFiles = []) {
    try {
      for (const file of [...this.#setupFiles, ...additionalFiles]) {
        const deletePath = file.destination ? file.destination : file;

        await fs.rm(deletePath, { recursive: true });
      }

      this.#setupFiles = [];
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  #handleStdOut(data) {
    const text = data.toString('utf8');
    this.#stdOutBuffer += text;

    if (this.#enableDebug) {
      console.log(text);
    }

    this.#stdOutSubscribers.forEach((callback) => callback(text));
  }

  #handleStdErr(data) {
    const text = data.toString('utf8');
    this.#stdErrBuffer += text;

    if (this.#enableDebug) {
      console.error(text);
    }

    this.#stdErrSubscribers.forEach((callback) => callback(text));
  }

  #setRootDir(rootDir) {
    if (!path.isAbsolute(rootDir)) {
      throw new Error('Error: rootDir is not an absolute path');
    }

    this.#rootDir = rootDir;
  }

  #setSetupFiles(setupFiles) {
    if (
      !Array.isArray(setupFiles) ||
      !setupFiles.every((file) => 'source' in file && 'destination' in file)
    ) {
      throw new Error(
        'SetupFiles must be an array with source and destination'
      );
    }

    this.#setupFiles = setupFiles;
  }

  async #throwIfBinNotExist(binPath) {
    try {
      await fs.access(binPath);
    } catch (err) {
      if (err.message.startsWith('ENOENT: no such file or directory')) {
        throw new Error(`Error: Cannot find path ${binPath}`);
      } else {
        throw err;
      }
    }
  }
}

export { Runner };
