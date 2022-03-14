import { assert } from 'chai';
import { HttpProject, TestCliHelper } from '@api-client/core';
import Find from '../../src/commands/project/environment/Find.js';
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

  describe('Environment', () => {
    describe('Data store', () => {
      describe('Find', () => {
        it('searches for environments in the name filed', async () => {
          const project = new HttpProject();
          const f1 = project.addFolder('f1');
          const e1 = project.addEnvironment('a name 1')
          const e2 = f1.addEnvironment('names in environment')
          project.addEnvironment('another 3');
          const id = await helper.sdk.project.create(space, project);
  
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
          assert.include(title, 'Project environments', 'table has the title');
          assert.include(headers, 'Key', 'table has the column names');
          assert.include(d1, e2.key, 'has the first environment');
          assert.include(d2, e1.key, 'has the second environment');
          assert.isUndefined(d3, 'has no more results');
        });
      });
    });
  });
});
