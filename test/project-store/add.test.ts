import { assert } from 'chai';
import { StoreSdk, Workspace, TestCliHelper } from '@api-client/core';
import Add from '../../src/commands/project/Add.js';
import getSetup from '../helpers/getSetup.js';
import { SetupConfig } from '../helpers/interfaces.js';
import { IConfigEnvironment } from '../../src/lib/Config.js';

describe('Project', () => {
  let env: SetupConfig;
  let sdk: StoreSdk;
  let token: string;
  let space: string;

  before(async () => {
    env = await getSetup();
    sdk = new StoreSdk(env.singleUserBaseUri);
    const info = await sdk.auth.createSession();
    token = info.token;
    sdk.token = token;
    space = await sdk.space.create(Workspace.fromName('test'));
  });

  function environment(): IConfigEnvironment {
    return {
      key: 'test',
      name: 'default',
      source: 'net-store',
      authenticated: true,
      token,
      location: env.singleUserBaseUri,
    }
  }

  describe('Store', () => {
    describe('add', () => {
      const name = 'test api';

      it('creates a project in a space', async () => {
        const cmd = new Add(Add.command);
        const result = await TestCliHelper.grabOutput(async () => {
          await cmd.run(name, {
            space,
            env: environment(),
          });
        });
        const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
        const [key, oName, environments, folders, requests, schemes] = lines;
        assert.include(key, 'key');
        assert.include(oName, name);
        assert.include(environments, '(none)');
        assert.include(folders, '(none)');
        assert.include(requests, '(none)');
        assert.include(schemes, '(none)');
      });

      it('adds the version information', async () => {
        const cmd = new Add(Add.command);
        const result = await TestCliHelper.grabOutput(async () => {
          await cmd.run(name, {
            space,
            env: environment(),
            projectVersion: '0.1.0',
          });
        });
        const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
        const [, oName, version] = lines;
        assert.include(oName, name);
        assert.include(version, '0.1.0');
      });
    });
  });
});
