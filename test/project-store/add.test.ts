import { assert } from 'chai';
import { TestCliHelper } from '@api-client/core';
import Add from '../../src/commands/project/Add.js';
import getSetup from '../helpers/getSetup.js';
import { SetupConfig } from '../helpers/interfaces.js';
import { StoreHelper } from '../helpers/StoreHelper.js';

describe('Project', () => {
  let env: SetupConfig;
  let helper: StoreHelper;
  let space: string;

  before(async () => {
    env = await getSetup();
    helper = new StoreHelper(env.singleUserBaseUri);
    await helper.initStoreSpace();
    space = helper.space as string;
  });

  describe('Store', () => {
    describe('add', () => {
      const name = 'test api';

      it('creates a project in a space', async () => {
        const cmd = new Add(Add.command);
        const result = await TestCliHelper.grabOutput(async () => {
          await cmd.run(name, {
            space,
            env: helper.environment(),
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
            env: helper.environment(),
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
