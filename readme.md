# Advanced REST Client's HTTP Project CLI

> Work in progress

The CLI for ARC's HTTP projects. This is an alternative use of the data stored in the ARC's HTTP project. It provides a CLI built on top of ARC's core library (@advanced-rest-client/core).

This CLI allows developers to create, manipulate, and execute HTTP projects without ARC's UI.

## CLI

The CLI offers the following commands:

- project create
- project patch
- project move
- project clone
- project list
- project describe
- project folder
- project request
- project environment
- project run
- transform

> Work in progress

## Testing

### Testing in development

Testing and watching is little bit tricky because the library is TS and ESM at the same time. Tooling for Node lags behind browser's tooling and it requires several workarounds for the testing to work.

Terminal 1:

```sh
npm run tsc:watch
```

Terminal 2:

```sh
npm run test:mocha:watch2
```

### In the CI

```sh
npm run test
```
