import { assert } from 'chai';
import { TestCliHelper } from '@api-client/core';
import Add from '../../src/commands/space/Add.js';
import getSetup, { SetupConfig } from '../helpers/getSetup.js';
import { StoreHelper } from '../helpers/StoreHelper.js';

describe('Space', () => {
  let env: SetupConfig;
  let helper: StoreHelper;

  before(async () => {
    env = await getSetup();
    helper = new StoreHelper(env.singleUserBaseUri);
    await helper.initStore();
  });

  after(async () => {
    await helper.testDelete(`/test/reset/spaces`);
    await helper.testDelete(`/test/reset/sessions`);
  });

  describe('Store', () => {
    describe('Add', () => {
      const name = 'a space';

      it('adds a space to the store and prints the space info', async () => {
        const cmd = new Add(Add.command);
        const result = await TestCliHelper.grabOutput(async () => {
          await cmd.run(name, {
            env: helper.environment(),
          });
        });
        const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
        const [key, oName, access, owner] = lines;
        assert.include(key, 'key');
        assert.include(oName, name);
        assert.include(access, 'owner');
        assert.include(owner, 'default');
      });

      it('persists the data in the store', async () => {
        const cmd = new Add(Add.command);
        const result = await TestCliHelper.grabOutput(async () => {
          await cmd.run(name, {
            env: helper.environment(),
          });
        });
        const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
        const [key] = lines;
        const id = key.substring(3).trim();
        const info = await helper.sdk.space.read(id);
        assert.equal(info.info.name as string, name);
      });
    });
  });
});
