import { assert } from 'chai';
import { TestCliHelper, IWorkspace } from '@api-client/core';
import Read from '../../src/commands/space/Read.js';
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
    describe('Read', () => {
      let created: IWorkspace[];

      before(async () => {
        const generated = await helper.testPost('/test/generate/spaces?size=1');
        created = JSON.parse(generated.body as string) as IWorkspace[];
      });
      

      it('reads the space from the store and prints the space info', async () => {
        const srcSpace = created[0];
        const cmd = new Read(Read.command);
        const result = await TestCliHelper.grabOutput(async () => {
          await cmd.run({
            env: helper.environment(),
            space: srcSpace.key,
          });
        });
        const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
        const [key, oName, access, owner] = lines;
        assert.include(key, srcSpace.key);
        assert.include(oName, srcSpace.info.name as string);
        assert.include(access, 'owner');
        assert.include(owner, 'default');
      });

      it('throws when space is not found', async () => {
        const cmd = new Read(Read.command);
        let e: Error | undefined;
        try {
          await cmd.run({
            env: helper.environment(),
            space: 'test',
          });
        } catch (cause) {
          e = cause as Error;
        }
        assert.ok(e, 'has the error');
        if (e) {
          assert.equal(e.message, 'Not found.');
        }
      });
    });
  });
});
