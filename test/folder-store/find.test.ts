import { assert } from 'chai';
import { HttpProject, TestCliHelper } from '@api-client/core';
import Find from '../../src/commands/project/folder/Find.js';
import getSetup, { SetupConfig } from '../helpers/getSetup.js';
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

  after(async () => {
    await helper.testDelete(`/test/reset/spaces`);
    await helper.testDelete(`/test/reset/projects`);
    await helper.testDelete(`/test/reset/sessions`);
  });

  describe('Data store', () => {
    describe('Folder', () => {
      describe('Find', () => {
        it('searches for folders in the name filed', async () => {
          const source = new HttpProject();
          const f1 = source.addFolder('a name 1');
          const f2 = source.addFolder('a náme 2');
          source.addFolder('another 3');
          const id = await helper.sdk.project.create(space, source);

          const query = 'nam';
          const cmd = new Find(Find.command);
          const result = await TestCliHelper.grabOutput(async () => {
            await cmd.run(query, {
              space,
              project: id,
              env: helper.environment(),
            });
          });
          const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
          
          const [title, headers, d1, d2, d3] = lines;
          assert.include(title, 'Project folders', 'table has the title');
          assert.include(headers, 'Key', 'table has the column names');
          assert.include(d1, f1.key, 'has the first folder');
          assert.include(d2, f2.key, 'has the second folder');
          assert.isUndefined(d3, 'has no more results');
        });
      });
    });
  });
});
