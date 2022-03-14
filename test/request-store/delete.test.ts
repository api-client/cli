import { assert } from 'chai';
import { HttpProject, ProjectFolder, ProjectRequest, TestCliHelper } from '@api-client/core';
import Delete from '../../src/commands/project/request/Delete.js';
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
      describe('Delete', () => {
        describe('Unit', () => {
          let f1: ProjectFolder;
          let r1: ProjectRequest;
          let r2: ProjectRequest;
          let project: string;
    
          beforeEach(async () => {
            const source = new HttpProject();
            f1 = source.addFolder('f1');
            r1 = source.addRequest('r1');
            r2 = f1.addRequest('r2');
            
            project = await helper.sdk.project.create(space, source);
          });
    
          it('removes a request from the project and prints the project', async () => {
            await TestCliHelper.grabOutput(async () => {
              const cmd = new Delete(Delete.command);
              await cmd.run(r1.key, {
                space,
                project,
                env: helper.environment(),
              });
            });
            
            const read = new HttpProject(await helper.sdk.project.read(space, project));
            const request = read.findRequest(r1.key, { keyOnly: true });
            assert.notOk(request);
          });
    
          it('removes a request from a folder', async () => {
            await TestCliHelper.grabOutput(async () => {
              const cmd = new Delete(Delete.command);
              await cmd.run(r2.key, {
                space,
                project,
                env: helper.environment(),
              });
            });
            const read = new HttpProject(await helper.sdk.project.read(space, project));
            const request = read.findRequest(r2.key, { keyOnly: true });
            assert.notOk(request);
            const folder = read.findFolder(f1.key) as ProjectFolder;
            const requests = folder.listRequests();
            assert.deepEqual(requests, []);
          });
        });
      });
    });
  });
});
