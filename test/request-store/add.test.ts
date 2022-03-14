import { assert } from 'chai';
import { HttpProject, ProjectFolder, TestCliHelper } from '@api-client/core';
import Add from '../../src/commands/project/request/Add.js';
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
      describe('Add', () => {
        describe('Unit', () => {
          let f2: ProjectFolder;
          let project: string;

          beforeEach(async () => {
            const source = new HttpProject();
            source.addFolder('f1');
            f2 = source.addFolder('f2');
            f2.addRequest('r1');
            f2.addRequest('r2');
            project = await helper.sdk.project.create(space, source);
          });

          const url = 'https://api.com';

          it('adds a request to the project and prints the project', async () => {
            await TestCliHelper.grabOutput(async () => {
              const cmd = new Add(Add.command);
              await cmd.run(url, {
                space,
                project,
                env: helper.environment(),
              });
            });
            
            const read = new HttpProject(await helper.sdk.project.read(space, project));
            const requests = read.listRequests();
            assert.lengthOf(requests, 1, 'has the request');
            assert.equal(requests[0].info.name, 'https://api.com', 'has the name');
            assert.equal(requests[0].expects.url, 'https://api.com', 'has the url');
          });

          it('adds the name of the request', async () => {
            await TestCliHelper.grabOutput(async () => {
              const cmd = new Add(Add.command);
              await cmd.run(url, {
                space,
                project,
                env: helper.environment(),
                name: 'test request',
              });
            });
            
            const read = new HttpProject(await helper.sdk.project.read(space, project));
            const requests = read.listRequests();
            assert.equal(requests[0].info.name, 'test request');
          });
        });
      });
    });
  });
});
