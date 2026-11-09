# gallinago

[![GitHub release](https://img.shields.io/github/tag/thescientist13/gallinago.svg)](https://github.com/thescientist13/gallinago/tags)
[![GitHub issues](https://img.shields.io/github/issues-pr-raw/thescientist13/gallinago.svg)](https://github.com/thescientist13/gallinago/issues)
[![NodeJS compatibility](https://img.shields.io/node/v/gallinago.svg)](https://nodejs.org/en/about/previous-releases)
[![Deno compatibility](https://img.shields.io/deno/v/gallinago.svg)](https://docs.deno.com/runtime/fundamentals/stability_and_releases/)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/thescientist13/gallinago/master/LICENSE.md)

[**Gallinago**](https://en.wikipedia.org/wiki/Snipe) is designed to assist with the running and testing of CLIs and binaries in a simple and controlled way.  It is best used in combination with fixtures and pre-scaffolded directories such that you can reproduce the various configuration and folder structures your CLI may need to support for its users and then validate the output.  Perfect for testing!

Supports NodeJS and Deno.

![gallinago](./.github/assets/gallinago.jpg)

## Overview

Often times while creating CLIs, it can be helpful to test the final output given the various configurations of a CLI.  Running a CLI using config files and user files will all likely (and hopefully) result in idempotent output that can be validated over and over.  With a testing framework like [**mocha**](https://mochajs.org/), you could use Gallinago to run your CLI and verify that output to validate things like:
- Were the right files created?
- Was the output what I expected?
- Were _too_ many files created?
- Does it work for configuration A?
- Does it work for configuration B?
- etc

## Install

Use npm or your favorite package manager to install Gallinago as a (dev) dependency.
```sh
$ npm install gallinago --dev
```

## Usage

To use Gallinago, you will just need two things
1. An absolute path to your CLI
1. An absolute path to the directory you want Gallinago to run your CLI in

```js
import path from 'path';
import { Runner } = from 'gallinago';
import { fileURLToPath, URL } from 'url';

const runner = new Runner();

const cliPath = fileURLToPath(new URL('./path/to/your/cli.js', import.meta.url)); // required
const buildDir = fileURLToPath(new URL('./build', import.meta.url)); // required

// this will also create the directory as well
await runner.setup(buildDir);

// runs your CLI
// use the args option to pass any args
await runner.runCommand(cliPath);

// teardown buildDir
await runner.teardown();
```

> _See [our tests](https://github.com/thescientist13/gallinago/blob/master/test/cases/runner-cli/runner.cli.spec.js) to see **Gallinago** in action!_

## API

### Runner

The `Runner` constructor returns a new instance of `Runner`.

```js
import { Runner } from 'gallinago';

const runner = new Runner();
```

#### Options

`Runner` accepts an optional options object:

```js
new Runner({ enableStdOut, forwardParentArgs, runtimeArgs });
```

- `enableStdOut` (`boolean`, default: `false`) - log the child process output to `stdout` and `stderr`.
- `forwardParentArgs` (`boolean`, default: `false`) - forward runtime flags from the parent process to the child process.
- `runtimeArgs` (`string[]`, default: `process.execArgv`) - the runtime flags to forward when `forwardParentArgs` is enabled.

Providing `runtimeArgs` is useful when the flags needed by the child process are not available through `process.execArgv`, as can happen when running under Deno:

```js
const runner = new Runner({
  forwardParentArgs: true,
  runtimeArgs: ['--import', new URL('./register.js', import.meta.url).href]
});
```

### Runner.setup (required)

`Runner.setup` initializes a directory for your CLI to be run in.  Returns a `Promise`.

```js
await runner.setup(__dirname);
```

Optionally, you can provide "setup" files if you want to copy additional files into the target directory, say from _node_modules_ or a fixtures folder.  You can provide these files as an array of objects.

* `source`: string path or `file:` URL of the file to copy
* `destination`: string path or `file:` URL of where to copy the file to

The optional second argument is an options object with the following properties:
- `setupFiles` - an array of `{ source, destination }` objects (default is `[]`)
- `create` - automatically create the directory provided in the first param (default is `true`)

```js
await runner.setup(__dirname, {
  setupFiles: [{
    source: new URL('./node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js', import.meta.url),
    destination: new URL('./build/webcomponents-bundle.js', import.meta.url)
  }],
  create: true
});
```

### Runner.runCommand

`Runner.runCommand` runs the script provided to Gallinago against the directory provided in `Runner.setup`.  Use the `args` option to pass a string or array of arguments to your CLI (default is `[]`).  Returns a `Promise`.

```js
await runner.runCommand(
  '/path/to/cli.js',
  { args: '--version' }
);
```

You can also provide an array in `args` to support forwarding individual args, useful when using projects like [**commander**](https://www.npmjs.com/package/commander):

```js
await runner.runCommand(
  '/path/to/cli.js',
  { args: ["--name", "my-app"] }
);
```

The promise resolves when the command exits with code `0`, even if it writes to stderr. A nonzero exit, signal termination, or spawn failure rejects with an `Error`. The error includes `command`, `cwd`, `exitCode`, `signal`, `stdout`, and `stderr` properties. The output properties contain the last 65,536 characters of each stream. The error message shows stdout and stderr in separate labeled sections. For a spawn failure, `exitCode` is `null` and the original error is available as `cause`.

#### Options

`runCommand` accepts an optional options object as the second argument. Combine `args` and `onStdOut` as needed:

```js
runner.runCommand(
  '/path/to/cli.js',
  { args: '--version', onStdOut: (text) => console.log(text) }
);
```

##### onStdOut
This is a callback function that is invoked with a string each time the child process writes to std out. Defaults to `null`.  In conjunction with `stopCommand`, this can be useful to listen for when a long running command is "ready", like waiting for a web server to start.

```js
before(async function () {
  await runner.setup(outputPath);

  await new Promise((resolve, reject) => {
    runner.runCommand(
      '/path/to/cli.js',
      { args: "develop", onStdOut: (message) => {
        if (message.includes(`Started local development server at http://localhost:8080`)) {
          resolve();
        }
      }}
    ).catch(reject)
  });
});
```

### Runner.teardown

`Runner.teardown` deletes any `setupFiles` provided in `Runner.setup`.  Returns a `Promise`.

```js
await runner.teardown();
```

You can pass additional files or directories to `teardown` to have **gallinago** delete those too.

```js
await runner.teardown([
  path.join(__dirname, 'build'),
  path.join(__dirname, 'fixtures'),
  .
  .
  .
]);
```

### Runner.stopCommand

In certain circumstances, the command (process) you are running may do a couple things:
- Spawn its own child process(es), [which is independent of the lifecycle of its parent process](https://azimi.me/2014/12/31/kill-child_process-node-js.html)
- Not close itself (and thus never [`resolve()` the `on.close` event callback](https://github.com/thescientist13/gallinago/blob/0.3.0/src/lib/runner.js#L67))

> _This isn't an issue per se, but if the (child) process doesn't stop, it will prevent the current (parent) process from completing.  The most common case for something like this to happen is when starting a [(web) server](https://koajs.com/).  Servers don't usually stop unless told to, usually by killing their process manually using something like [**PM2**](https://pm2.keymetrics.io/), or if in a shell, using CTR+C on the keyboard._

To support this in Gallinago, you can use `Runner.stopCommand` to kill any and all processes associated with your `runCommand`.

```js
await runner.stopCommand();
```

If the child has already exited, `stopCommand()` resolves immediately. If a request to stop a running child fails, the promise rejects. A successful stop request still waits for the child to exit.

> _`stopCommand()` has no timeout after a successful kill request. A child that ignores termination needs a separate timeout policy in the caller._
