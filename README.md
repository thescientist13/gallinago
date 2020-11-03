# gallinago
[![GitHub release](https://img.shields.io/github/tag/thescientist13/gallinago.svg)](https://github.com/thescientist13/gallinago/tags)
![GitHub Actions status](https://github.com/thescientist13/gallinago/workflows/Master%20Integration/badge.svg)
[![GitHub issues](https://img.shields.io/github/issues-pr-raw/thescientist13/gallinago.svg)](https://github.com/thescientist13/gallinago/issues)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/thescientist13/gallinago/master/LICENSE.md)

[**Gallinago**](https://en.wikipedia.org/wiki/Snipe) is a NodeJS package designed to assist with the running of CLIs against directories that can be pre-scaffolded as needed to reproduce various configuration and folder structures your CLI may need to support for its users.  Perfect for testing!

![gallinago](./.github/assets/gallinago.jpg)

## Overview 
Often times while creating CLIs, it can be helpful to test the final output given the various configurations of the CLI.  Running a CLI using config files and user files will all likely (and hopefully) result in idempotent output that can be validated over and over.  With a testing framework like [**mocha**](https://mochajs.org/), you could use Gallinago to verify that output to validate things like:
- Were the right files created?
- Was the output what I expected?
- Were _too_ many files created?
- Does it work for configuration A?
- Does it work for configuration B?
- etc


## Install
Use npm or Yarn (1.x) to install Gallinago as a (dev) dependency.
```sh
# npm
$ npm install gallinago --dev

# yarn
$ yarn add gallinago --dev
```


## Usage
To use Gallinago, you will just need two things
1. An absolute path to your CLI
1. An absolute path to the directory you want Gallinago to run your CLI in

```js
const path = require('path');
const Runner = require('gallinago').Runner;
const runner = new Runner();

const cliPath = path.join('/path/to/cli.js'); // required
const buildDir = path.join(__dirname, './build'); // required

// this will also create the directory as well 
await runner.setup(buildDir);

// runs your CLI
// use the second param to pass any args
await runner.runCommand(cliPath);

// teardown buildDir
await runner.teardown();
```

## API

### Runner
The `Runner` constructor returns a new instance of `Runner`.

```js
const Runner = require('gallinago').Runner;
const runner = new Runner();  // pass true to the constructor to enable stdout
```

### Runner.setup (required)
`Runner.setup` initializes a directory for your CLI to be run in.  Returns a `Promise`.

```js
await runner.setup(__dirname);
```

Optionally, you can provide "setup" files if you want to copy additional files into the target directory, say from _node_modules_ or a fixtures folder.  You can provide these files as an array of objects.

* `source`: path of the file to copy
* `destination`: path of where to copy the file to

```js
await runner.setup(__dirname, [{
  source: path.join(process.cwd(), 'node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js'),
  destination: path.join(__dirname, 'build', 'webcomponents-bundle.js')
}]);
```

### Runner.runCommand
`Runner.runCommand` runs the script provided to Gallinago against the directory provided in `Runner.setup`.  Use the second param to pass any args to your CLI.  Returns a `Promise`.

```js
await runner.runCommand(
  '/path/to/cli.js',
  '--version'
);
```

### Runner.teardown
`Runner.teardown` deletes the directory provided in `Runner.setup`.  Returns a `Promise`.

```js
await runner.teardown();
```

_See the [our tests](https://github.com/thescientist13/gallinago/blob/master/test/cases/runner-cli/runner.cli.spec.js) to see **Gallinago** in action!_
