# gallinago

[**Gallinago**](https://en.wikipedia.org/wiki/Snipe) is a NodeJS package designed to assist with running of CLIs against directories that can be pre-scaffolded as needed to reproduce various configuration and folder structures your CLI may need to support for its users.  Perfect for testing!


## Overview 
Often times while creating CLIs, it is helpful to be able to test the final output of the tool in response to the input of various configurations of your CLI.  Config files, directory scaffolding will all likely (and hopefolly)  idempotent output thay can be validated.  With a testing framework like mocha, you could use Gallinago to verify things like:
- Were the right files made?
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
1. an absolute path to your CLI
1. An absolute path to the diretory you want Gallinago to do its work in

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

// teardown any created files in outputDir
await runner.teardown()
```

## API

### Runner
The `Runner` constructor returns a new instance of `Runner`.

```js
const Runner = require('gallinago').Runner;
const runner = new Runner();  // pass true to the constructor to enable stdout
```

### Runner.setup (required)
`Runner.setup` initializes a targetDirectory for the command to run in.  Returns a `Promise`.

```js
await runner.setup(__dirname);
```

### Runner.runCommand
`Runner.runCommand` runs the script provided to into against the target directory provided in `Runner.setup`.  Use the second param to pass any args to your CLI.  Returns a `Promise`.

```js
await runner.runCommand(
  '/path/to/cli.js',
  '--version'
);
```

### Runner.teardown
`Runner.teardown` delets the target directory providxed in `Runner.setup`.  Returns a `Promise`.

```js
await runner.teardown();
```

_See the [our tests](https://github.com/thescientist13/gallinago/blob/master/test/cases/runner-cli/runner.cli.spec.js) to see **Gallinago** in action!_