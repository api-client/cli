import { assert } from 'chai';
import { HttpProject, ProjectFolder, Environment, TestCliHelper } from '@api-client/core';
import Delete from '../../src/commands/project/environment/Delete.js';
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
      describe('Delete', () => {
        let f1: ProjectFolder;
        let e1: Environment;
        let project: string;
  
        beforeEach(async () => {
          const source = new HttpProject();
          f1 = source.addFolder('f1');
          e1 = source.addEnvironment('e1');
          project = await helper.sdk.project.create(space, source);
        });
  
        it('removes an environment from the project', async () => {
          const cmd = new Delete(Delete.command);
          await TestCliHelper.grabOutput(async () => {
            await cmd.run(e1.key, {
              space,
              project,
              env: helper.environment(),
            });
          });
          const read = new HttpProject(await helper.sdk.project.read(space, project));
          assert.deepEqual(read.environments, []);
        });
  
        it('removes an environment from a folder', async () => {
          const cmd = new Delete(Delete.command);
          await TestCliHelper.grabOutput(async () => {
            await cmd.run(e1.key, {
              space,
              project,
              env: helper.environment(),
            });
          });
          const read = new HttpProject(await helper.sdk.project.read(space, project));
          const folder = read.findFolder(f1.key) as ProjectFolder;
          assert.deepEqual(folder.environments, []);
        });
  
        it('ignores errors when --safe', async () => {
          const cmd = new Delete(Delete.command);
          await TestCliHelper.grabOutput(async () => {
            await cmd.run(e1.key, {
              space,
              project,
              env: helper.environment(),
            });
          });
        });
      });
    });
  });
});
