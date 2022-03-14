import { assert } from 'chai';
import { HttpProject, ProjectFolder, TestCliHelper } from '@api-client/core';
import Delete from '../../src/commands/project/folder/Delete.js';
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
      describe('Delete', () => {
        let f1: ProjectFolder;
        let f2: ProjectFolder;
        let f3: ProjectFolder;
        let project: string;

        beforeEach(async () => {
          const source = new HttpProject();
          f1 = source.addFolder('f1');
          f2 = source.addFolder('f2');
          f3 = f2.addFolder('f3');
          project = await helper.sdk.project.create(space, source);
        });

        it('removes a folder from the project and prints the project', async () => {
          const cmd = new Delete(Delete.command);
          await TestCliHelper.grabOutput(async () => {
            await cmd.run(f1.key, {
              space,
              project,
              env: helper.environment(),
            });
          });
          const read = new HttpProject(await helper.sdk.project.read(space, project));
          const folder = read.findFolder(f1.key, { keyOnly: true });
          assert.notOk(folder);
        });

        it('removes a folder from a folder', async () => {
          const cmd = new Delete(Delete.command);
          await cmd.run(f2.key, {
            space,
            project,
            env: helper.environment(),
          });
          const read = new HttpProject(await helper.sdk.project.read(space, project));
          assert.ok(read.findFolder(f1.key, { keyOnly: true }));
          assert.notOk(read.findFolder(f2.key, { keyOnly: true }), 'removes the parent');
          assert.notOk(read.findFolder(f3.key, { keyOnly: true }), 'removes the child');
        });
      });
    });
  });
});
