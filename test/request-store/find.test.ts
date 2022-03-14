import { assert } from 'chai';
import { HttpProject, ProjectRequest, TestCliHelper } from '@api-client/core';
import Find from '../../src/commands/project/request/Find.js';
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
    describe('Request', () => {
      describe('Find', () => {
        describe('Unit', () => {
          it('searches for requests in the name filed', async () => {
            const source = new HttpProject();
            const r1 = ProjectRequest.fromName('a name 1', source);
            r1.expects.url = 'https://api.com/r1';
            const r2 = ProjectRequest.fromName('a náme 2', source);
            r2.expects.url = 'https://api.com/r2';
            const r3 = ProjectRequest.fromName('another 3', source);
            r3.expects.url = 'https://api.com/r3';
            source.addRequest(r1);
            source.addRequest(r2);
            source.addRequest(r3);
            const id = await helper.sdk.project.create(space, source);

            const query = 'nam';

            const result = await TestCliHelper.grabOutput(async () => {
              const cmd = new Find(Find.command);
              await cmd.run(query, {
                space,
                project: id,
                env: helper.environment(),
              });
            });
            const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
            
            const [title, headers, d1, d2, d3] = lines;
            assert.include(title, 'Project requests', 'table has the title');
            assert.include(headers, 'Key', 'table has the column names');
            assert.include(d1, r1.key, 'has the first request');
            assert.include(d2, r2.key, 'has the second request');
            assert.isUndefined(d3, 'has no more results');
          });
        });
      });
    });
  });
});
