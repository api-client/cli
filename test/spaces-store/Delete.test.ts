import { assert } from 'chai';
import { TestCliHelper, IWorkspace } from '@api-client/core';
import Delete from '../../src/commands/space/Delete.js';
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
    describe('Delete', () => {
      let created: IWorkspace[];

      before(async () => {
        const generated = await helper.testPost('/test/generate/spaces?size=2');
        created = JSON.parse(generated.body as string) as IWorkspace[];
      });

      it('removes the space from the store and prints the confirmation', async () => {
        const srcSpace = created[0];
        const cmd = new Delete(Delete.command);
        const result = await TestCliHelper.grabOutput(async () => {
          await cmd.run({
            env: helper.environment(),
            space: srcSpace.key,
          });
        });
        assert.equal(result.trim(), `The space ${srcSpace.info.name} is deleted.`);
      });

      it('removed space cannot be read', async () => {
        const srcSpace = created[1];
        const cmd = new Delete(Delete.command);
        await TestCliHelper.grabOutput(async () => {
          await cmd.run({
            env: helper.environment(),
            space: srcSpace.key,
          });
        });
        const response = await helper.sdk.http.get(helper.sdk.getUrl(`/spaces/${srcSpace.key}`).toString());
        assert.equal(response.status, 404);
      });

      it('throws when space is not found', async () => {
        const cmd = new Delete(Delete.command);
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
