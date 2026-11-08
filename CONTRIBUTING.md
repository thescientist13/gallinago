# Contributing to Gallinago

## Setup

1. Clone the repo
1. Install the Node.js version in `.nvmrc` (or run `nvm run use`)
1. Run `npm ci`

## Development

The main development flows for this project are testing based.  Since Gallinago is written in TypeScript, run `npm run build:watch` in one terminal an `npm run test:tdd` in another.

To check linting and types:

- `npm run lint`
- `npm run check`

## Publishing

Below are the workflow steps for publishing Gallinago.

### Local Testing

For local testing and generating an initial tarball.

For example, to prepare the next minor version's first release candidate without creating a Git commit or tag:

```sh
$ npm version preminor --preid rc --no-git-tag-version
v0.13.0-rc.0

$ npm pack
```

> _`npm pack` runs the `prepack` build automatically and creates `gallinago-<version>.tgz`. You can check that the archive contains the correct files. You can also install the tarball in a separate project with `npm install /absolute/path/gallinago-<version>.tgz`._

### Release Candidate

After local testing, publish to npm with the **rc** tag.

For the `0.13.0-rc.0` example above:

```sh
$ npm publish ./gallinago-0.13.0-rc.0.tgz --tag rc
```

To publish another candidate, increment the existing RC version and pack again:

```sh
$ npm version prerelease --preid rc --no-git-tag-version
v0.13.0-rc.1

$ npm pack
```

---

Make sure to bump and tag the version for all RC releases:

```sh
$ git commit package.json package-lock.json -m "chore: bump to next release version 0.13.0-rc.0"
$ git tag -a 0.13.0-rc.0 -m "chore: tagging 0.13.0-rc.0 release"
$ git push origin <branch> --tags
```

### Stable Release

To publish to **latest** on npm.

Using the minor release above, this drops the `-rc.N`:

```sh
$ npm version minor --no-git-tag-version
v0.13.0

$ npm pack
$ npm publish ./gallinago-0.13.0.tgz --tag latest
```

After publishing a stable release, make sure to bump and tag the version:

```sh
$ git commit package.json package-lock.json -m "chore: bump to next release version 0.13.0"
$ git tag -a 0.13.0 -m "chore: tagging 0.13.0 release"
$ git push origin master --tags
```
