const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

class Runner {
  constructor(enableStdOut = false) {
    this.enableStdOut = enableStdOut; // debugging tests
    this.setupFiles = [];
    this.childProcess = null;
  }

  setup(rootDir, setupFiles = []) {
    this.setupFiles = setupFiles;

    return new Promise(async (resolve, reject) => {
      try {
        if (path.isAbsolute(rootDir)) {

          if (!fs.existsSync(rootDir)) {
            fs.mkdirSync(rootDir);
          }

          this.rootDir = rootDir;

          await Promise.all(setupFiles.map((file) => {
            return new Promise(async (resolve, reject) => {
              try {
                 
                await new Promise(async(resolve, reject) => {
                  try {
                    fs.mkdirSync(path.dirname(file.destination), { recursive: true });
                    fs.copyFileSync(file.source, file.destination);
                  } catch (e) {
                    reject(e);
                  }
                  
                  resolve();
                });
              } catch (e) {
                reject(e);
              }

              resolve();
            });
          }));
          resolve();
        } else {
          reject('Error: rootDir is not an absolute path');
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  runCommand(binPath, args) {
    return new Promise(async (resolve, reject) => {
      const cliPath = binPath;
      let err = '';

      const runner = os.platform() === 'win32' ? 'node.cmd' : 'node';
      this.childProcess = spawn(runner, [cliPath, args], {
        cwd: this.rootDir,
        shell: false,
        detached: true
      });

      this.childProcess.on('close', code => {
        if (code && code !== 0) {
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
      process.kill(-this.childProcess.pid, 'SIGKILL');
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
            fs.rmdirSync(deletePath, { recursive: true });
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

module.exports = Runner;