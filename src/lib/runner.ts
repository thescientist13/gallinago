import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';

interface RunnerOptions {
  enableStdOut?: boolean;
  forwardParentArgs?: boolean;
  runtimeArgs?: string[];
}

interface SetupFile {
  source: string | URL;
  destination: string | URL;
}

interface SetupOptions {
  setupFiles?: SetupFile[];
  create?: boolean;
}

interface RunCommandOptions {
  args?: string | string[];
  onStdOut?: ((message: string) => void) | null;
}

export interface RunnerInterface {
  /**
   * @throws {string} Rejects when rootDir is not an absolute path.
   * @throws {Error} Rejects if directory creation or file copying fails.
   */
  setup(rootDir: string, options?: SetupOptions): Promise<void>;
  /**
   * @throws {TypeError} Throws synchronously if onStdOut is truthy and not a function.
   * @throws {Error} Rejects if binPath does not exist.
   * @throws {CommandError} Rejects on spawn failure, nonzero exit, or signal termination.
   */
  runCommand(binPath: string, options?: RunCommandOptions): Promise<void>;
  /**
   * @throws {Error} Rejects if stopping the child process fails or the child emits an error while stopping.
   */
  stopCommand(): Promise<void>;
  /**
   * @throws {Error} Rejects if inspecting or deleting a setup file or additional path fails.
   */
  teardown(additionalFiles?: (string | URL)[]): Promise<void>;
}

/**
 * Diagnostic error from runCommand() for a spawn failure, nonzero exit, or signal
 * termination. Other failures can produce ordinary errors; narrow caught values
 * before treating them as CommandError.
 */
export interface CommandError extends Error {
  command: string;
  cwd: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  cause?: Error;
}

interface CommandErrorDetails {
  command: string;
  cwd: string;
  code?: number | null;
  signal?: NodeJS.Signals | null;
  stdout?: string;
  stderr?: string;
  cause?: Error;
}

const MAX_CAPTURED_OUTPUT_LENGTH = 64 * 1024;

function appendOutput(output: string, chunk: string): string {
  return (output + chunk).slice(-MAX_CAPTURED_OUTPUT_LENGTH);
}

function createCommandError({ command, cwd, code = null, signal = null, stdout = '', stderr = '', cause }: CommandErrorDetails): CommandError {
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
  const error = new Error(message, cause ? { cause } : undefined) as Error & { cause?: Error };

  return Object.assign(error, {
    command,
    cwd,
    exitCode: code,
    signal,
    stdout,
    stderr
  });
}

class Runner implements RunnerInterface {
  declare enableStdOut: boolean;
  declare forwardParentArgs: boolean;
  declare runtimeArgs: string[];
  declare setupFiles: SetupFile[];
  declare childProcess: ChildProcessWithoutNullStreams | null;
  declare rootDir?: string;

  constructor({ enableStdOut = false, forwardParentArgs = false, runtimeArgs = process.execArgv }: RunnerOptions = {}) {
    this.enableStdOut = enableStdOut; // debugging tests
    this.forwardParentArgs = forwardParentArgs;
    this.runtimeArgs = runtimeArgs;
    this.setupFiles = [];
    this.childProcess = null;
  }

  /**
   * @throws {string} Rejects when rootDir is not an absolute path.
   * @throws {Error} Rejects if directory creation or file copying fails.
   */
  setup(rootDir: string, { setupFiles = [], create = true }: SetupOptions = {}): Promise<void> {
    this.setupFiles = setupFiles;

    return new Promise<void>((resolve, reject) => {
      if (path.isAbsolute(rootDir)) {
        this.rootDir = rootDir;

        if (create) {
          fs.mkdirSync(this.rootDir, { recursive: true });
        }

        if (setupFiles.length > 0) {
          setupFiles.forEach((file) => {
            const destinationDirectory = typeof file.destination === 'string'
              ? path.dirname(file.destination)
              : new URL('.', file.destination);
            fs.mkdirSync(destinationDirectory, { recursive: true });
            fs.copyFileSync(file.source, file.destination);
          });
        }

        resolve();
      } else {
        reject('Error: rootDir is not an absolute path');
      }
    });
  }

  /**
   * @throws {TypeError} Throws synchronously if onStdOut is truthy and not a function.
   * @throws {Error} Rejects if binPath does not exist.
   * @throws {CommandError} Rejects on spawn failure, nonzero exit, or signal termination.
   */
  runCommand(binPath: string, { args = [], onStdOut = null }: RunCommandOptions = {}): Promise<void> {
    if (onStdOut && typeof onStdOut !== 'function') {
      throw new TypeError('onStdOut must be passed a function or null');
    }

    return new Promise<void>((resolve, reject) => {
      const deno = (globalThis as typeof globalThis & { Deno?: { execPath(): string } }).Deno;
      const isDeno = Boolean(deno);
      const executable = deno ? deno.execPath() : process.execPath;
      const isWindows = os.platform() === 'win32';
      const commandArgs = isDeno ? ['run', '-A'] : [];
      const forwardArgs = this.forwardParentArgs ? this.runtimeArgs : [];
      const finalArgs = [...commandArgs, ...forwardArgs, binPath];
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
      const commandError = (details: Pick<CommandErrorDetails, 'code' | 'signal' | 'cause'>) => createCommandError({
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
        reject(commandError({ cause: cause as Error }));
        return;
      }

      this.childProcess = child;
      let childError: Error | undefined;

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

  /**
   * @throws {Error} Rejects if stopping the child process fails or the child emits an error while stopping.
   */
  stopCommand(): Promise<void> {
    const child = this.childProcess;

    if (!child || child.exitCode !== null || child.signalCode !== null) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const onExit = () => {
        child.removeListener('error', onError);
        resolve();
      };
      const onError = (error: Error) => {
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

  /**
   * @throws {Error} Rejects if inspecting or deleting a setup file or additional path fails.
   */
  teardown(additionalFiles: (string | URL)[] = []): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        [...(this.setupFiles || []), ...additionalFiles].forEach((file) => {
          const deletePath = typeof file === 'string' || file instanceof URL ? file : file.destination;

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
