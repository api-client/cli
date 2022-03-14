# Testing

Before you start, we testing whether the CLI command properly handle command options and passing it to the SDK (from the `@api-client/core` library).

We do not repeat tests from the `@api-client/net-store` library. Please, focus on the commands. If a command requires a custom code then probably this logic belongs to the SDK or to the store. Please, consider crating a PS in these packages in such case.

## Testing ts

A popular testing framework for TypeScript applications is Jest. However, Jest doesn't support ESM libraries (they say they do but I am not capable to understanding their manual). Because of that we use Mocha with the `ts-node`. It is a little bit cumbersome but works good enough to properly test the library.

The configuration is defined in the `.mocharc.yaml`. This is where temporarily you can reduce the files to a specific one you are working on right now.

Please, do not change the rest of the configuration.

## Parallel mode

We do not support mocha's parallel mode. The tests are using a single instance of the API store. In the parallel mode you cannot guarantee ste initial state of the store when starting your tests.

## Testing servers

When tests start a several servers are being created:

- OAuth2 mocking server - to work with the data store in the multi-user environment
- The data store in the multi-user environment
- The data store in the single-user environment
- Custom express server for testing HTTP calls

You can access the servers base information with the `test/helpers/getSetup.ts` library:

```ts
import getSetup, { SetupConfig } from '../helpers/getSetup.js';
describe('Project', () => {
  let env: SetupConfig;
  let helper: StoreHelper;

  before(async () => {
    env = await getSetup();
    helper = new StoreHelper(env.singleUserBaseUri);
    await helper.initStore();
  });

  // ...
});
```

Combine this with the `StoreHelper` that has functions to initialize a session in the store and make authenticated requests.
