const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

class Runner {
  constructor(enableStdOut) {
    this.rootDir = process.cwd();
    this.enableStdOut = enableStdOut; // debugging tests
  }

  setup(cwd) {
    // console.log('setupTestBed for cwd', cwd);
    return new Promise(async (resolve, reject) => {
      try {
        this.rootDir = cwd;

        resolve();
      } catch (err) {
        reject(err);
      }

    });
  }

  runCommand(binPath, args) {
    console.debug('binPath', binPath);
    console.debug('args', args);
    return new Promise(async (resolve, reject) => {
      const cliPath = path.join(process.cwd(), binPath);
      let err = '';
      
      const runner = os.platform() === 'win32' ? 'node.cmd' : 'node';
      const npm = spawn(runner, [cliPath, args], {
        cwd: this.rootDir,
        shell: true
      });

      npm.on('close', code => {
        if (code !== 0) {
          reject(err);
          return;
        }
        resolve();
      });

      npm.stderr.on('data', (data) => {
        err = data.toString('utf8');
        if (this.enableStdOut) {
          console.error(err); // eslint-disable-line
        }
        reject(err);
      });

      npm.stdout.on('data', (data) => {
        if (this.enableStdOut) {
          console.log(data.toString('utf8')); // eslint-disable-line
        }
      });
    });
  }

  // teardown() {
  //   return new Promise(async(resolve, reject) => {
  //     try {
  //       await fs.remove(path.join(this.rootDir, '.greenwood'));
  //       await fs.remove(path.join(this.rootDir, 'public'));

  //       await Promise.all(setupFiles.map((file) => {
  //         return fs.remove(path.join(this.rootDir, file.dir.split('/')[0]));
  //       }));
  //       resolve();
  //     } catch (err) {
  //       reject(err);
  //     }
  //   });
  // }
}

module.exports = Runner;