import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const MAX_CAPTURED_OUTPUT_LENGTH = 64 * 1024;

function appendOutput(output, chunk) {
  return (output + chunk).slice(-MAX_CAPTURED_OUTPUT_LENGTH);
}

function createCommandError({ command, cwd, code = null, signal = null, stdout = '', stderr = '', cause }) {
  const reason = cause
    ? `could not start: ${cause.message}`
    : signal
      ? `terminated by signal ${signal}`
      : `exited with code ${code}`;
  const output = [
    stdout && `stdout:\n${stdout}`,
    stderr && `stderr:\n${stderr}`
  ].filter(Boolean).join('\n');
  const message = `Command ${reason}: ${command}\nWorking directory: ${cwd}${output ? `\n${output}` : ''}`;
  const error = new Error(message, cause ? { cause } : undefined);

  error.command = command;
  error.cwd = cwd;
  error.exitCode = code;
  error.signal = signal;
  error.stdout = stdout;
  error.stderr = stderr;

  return error;
}

class Runner {
  constructor({ enableStdOut = false, forwardParentArgs = false, runtimeArgs = process.execArgv } = {}) {
    this.enableStdOut = enableStdOut; // debugging tests
    this.forwardParentArgs = forwardParentArgs;
    this.runtimeArgs = runtimeArgs;
    this.setupFiles = [];
    this.childProcess = null;
  }

  setup(rootDir, { setupFiles = [], create = true } = {}) {
    this.setupFiles = setupFiles;

    return new Promise((resolve, reject) => {
      if (path.isAbsolute(rootDir)) {
        this.rootDir = rootDir;

        if (create) {
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

  runCommand(binPath, { args = [], onStdOut = null } = {}) {
    if (onStdOut && typeof onStdOut !== 'function') {
      throw new TypeError('onStdOut must be passed a function or null');
    }

    return new Promise((resolve, reject) => {
      const isDeno = Boolean(globalThis.Deno);
      const executable = isDeno ? globalThis.Deno.execPath() : process.execPath;
      const isWindows = os.platform() === 'win32';
      const cliPath = binPath;
      const commandArgs = isDeno ? ['run', '-A'] : [];
      const forwardArgs = this.forwardParentArgs ? this.runtimeArgs : [];
      const finalArgs = [...commandArgs, ...forwardArgs, cliPath];
      // Without setup(), the child uses the parent's cwd; report that same directory on failure.
      const cwd = this.rootDir ?? process.cwd();
      let stdout = '';
      let stderr = '';

      if (Array.isArray(args)) {
        finalArgs.push(...args);
      } else if (typeof args === 'string') {
        finalArgs.push(args);
      }

      if (!fs.existsSync(binPath)) {
        reject(new Error(`Error: Cannot find path ${binPath}`));
        return;
      }

      const command = [executable, ...finalArgs].map((arg) => JSON.stringify(arg)).join(' ');
      const commandError = (details) => createCommandError({
        command,
        cwd,
        stdout,
        stderr,
        ...details
      });
      let child;

      try {
        child = spawn(executable, finalArgs, {
          cwd,
          shell: false,
          detached: !isWindows
        });
      } catch (cause) {
        reject(commandError({ cause }));
        return;
      }

      this.childProcess = child;
      let childError;

      child.once('error', (cause) => {
        childError = cause;
      });

      child.once('close', (code, signal) => {
        if (childError || code !== 0 || signal !== null) {
          reject(commandError({ code: childError ? null : code, signal, cause: childError }));
          return;
        }
        resolve();
      });

      child.stderr.on('data', (data) => {
        const text = data.toString('utf8');
        stderr = appendOutput(stderr, text);

        if (this.enableStdOut) {
          console.error(text);
        }
      });

      child.stdout.on('data', (data) => {
        const text = data.toString('utf8');
        stdout = appendOutput(stdout, text);

        if (this.enableStdOut) {
          console.log(text);
        }

        if (onStdOut) {
          onStdOut(text);
        }
      });
    });
  }

  stopCommand() {
    const child = this.childProcess;

    if (!child || child.exitCode !== null || child.signalCode !== null) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const onExit = () => {
        child.removeListener('error', onError);
        resolve();
      };
      const onError = (error) => {
        child.removeListener('exit', onExit);
        reject(error);
      };

      child.once('exit', onExit);
      child.once('error', onError);

      try {
        if (!child.kill()) {
          child.removeListener('exit', onExit);
          child.removeListener('error', onError);

          if (child.exitCode !== null || child.signalCode !== null) {
            resolve();
          } else {
            reject(new Error(`Could not stop command with PID ${child.pid}`));
          }
        }
      } catch (error) {
        child.removeListener('exit', onExit);
        child.removeListener('error', onError);
        reject(error);
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
