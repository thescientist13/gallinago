# gallinago

[![GitHub release](https://img.shields.io/github/tag/thescientist13/gallinago.svg)](https://github.com/thescientist13/gallinago/tags)
[![GitHub issues](https://img.shields.io/github/issues-pr-raw/thescientist13/gallinago.svg)](https://github.com/thescientist13/gallinago/issues)
[![NodeJS compatibility](https://img.shields.io/node/v/gallinago.svg)](https://nodejs.org/en/about/previous-releases)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/thescientist13/gallinago/master/LICENSE.md)

[**Gallinago**](https://en.wikipedia.org/wiki/Snipe) is designed to assist with the running and testing of NodeJS CLIs and binaries in a simple and controlled way.  It is best used in combination with fixtures and pre-scaffolded directories such that you can reproduce the various configuration and folder structures your CLI may need to support for its users and then validate the output.  Perfect for testing!

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
// use the second param to pass any args
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

const runner = new Runner();  // pass true to the constructor to enable stdout
```

#### Options

`Runner` takes two boolean flags (`true`|`false`)
- Standard Out - pass `true` to have the Runner log to `stdout`
- Forward Parent Args - pass `true` and any `node` flags passed to the parent process will be made available to the child process

### Runner.setup (required)

`Runner.setup` initializes a directory for your CLI to be run in.  Returns a `Promise`.

```js
await runner.setup(__dirname);
```

Optionally, you can provide "setup" files if you want to copy additional files into the target directory, say from _node_modules_ or a fixtures folder.  You can provide these files as an array of objects.

* `source`: path of the file to copy
* `destination`: path of where to copy the file to

A third options object can be provided with the following supported options
- `create` - automatically create the directory provided in the first param (default is `true`)

```js
await runner.setup(__dirname, [{
  source: path.join(process.cwd(), 'node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js'),
  destination: path.join(__dirname, 'build', 'webcomponents-bundle.js')
}], {
  create: true
});
```

### Runner.runCommand

`Runner.runCommand` runs the script provided to Gallinago against the directory provided in `Runner.setup`.  Use the second param to pass any args to your CLI.  Returns a `Promise`.

```js
await runner.runCommand(
  '/path/to/cli.js',
  '--version'
);
```

You can also provide an array as the second param to support forwarding individual args, useful when using projects like [**commander**](https://www.npmjs.com/package/commander):

```js
await runner.runCommand(
  '/path/to/cli.js',
  ["--name", "my-app"]
);
```

#### Options

`runCommand` additionally takes an options object as the third param. With it you can further customize the runner:

```js
runner.runCommand(
  '/path/to/cli.js',
  '--version',
  { onStdOut: (text) => console.log(text) }
);
```

`onStdOut` - a callback function that is invoked with a string each time the child process writes to std out. Defaults to `null`.

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

> _**Note**: When used with something like mocha, you'll need to [use a `setTimeout` to work around the hung process and still advance the parent Mocha process](https://stackoverflow.com/a/24862303/417806).  See [our spec for this test case](https://github.com/thescientist13/gallinago/blob/master/test/cases/runner-cli-stop/runner.cli-stop.spec.js) for a complete example._
