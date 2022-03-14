import { assert } from 'chai';
import { HttpProject, ProjectFolder, TestCliHelper } from '@api-client/core';
import Add from '../../src/commands/project/folder/Add.js';
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
      describe('Add', () => {
        let project: string;
        
        beforeEach(async () => {
          const source = new HttpProject();
          project = await helper.sdk.project.create(space, source);
        });

        const name = 'test folder';

        it('adds a folder to the project and prints the project', async () => {
          const cmd = new Add(Add.command);
          await TestCliHelper.grabOutput(async () => {
            await cmd.run(name, {
              space,
              project,
              env: helper.environment(),
            });
          });
          
          const read = new HttpProject(await helper.sdk.project.read(space, project));
          const folders = read.listFolders();
          assert.lengthOf(folders, 1, 'has the folder');
          assert.equal(folders[0].info.name, 'test folder', 'has the name');
        });

        it('adds a folder to a folder', async () => {
          const cmd = new Add(Add.command);
          await cmd.run(name, {
            space,
            project,
            env: helper.environment(),
          });
          await cmd.run('sub folder', {
            space,
            project,
            env: helper.environment(),
            parent: name,
          });
          
          const read = new HttpProject(await helper.sdk.project.read(space, project));
          const parent = read.findFolder('test folder') as ProjectFolder;
          assert.ok(parent, 'has the parent');
          const folders = parent.listFolders();
          assert.lengthOf(folders, 1, 'has the folder');
          assert.equal(folders[0].info.name, 'sub folder', 'has the name');
        });

        it('does not add folder when the name already exists', async () => {
          const cmd = new Add(Add.command);
          await cmd.run(name, {
            space,
            project,
            env: helper.environment(),
          });
          await cmd.run(name, {
            space,
            project,
            env: helper.environment(),
            skipExisting: true,
          });

          const read = new HttpProject(await helper.sdk.project.read(space, project));
          const folders = read.listFolders();
          assert.lengthOf(folders, 1, 'has the folder');
        });

        it('adds duplicated folder name', async () => {
          const cmd = new Add(Add.command);
          await cmd.run(name, {
            space,
            project,
            env: helper.environment(),
          });
          await cmd.run(name, {
            space,
            project,
            env: helper.environment(),
          });
          const read = new HttpProject(await helper.sdk.project.read(space, project));
          const folders = read.listFolders();
          assert.lengthOf(folders, 2, 'has both folders');
        });

        it('adds a folder at position', async () => {
          const cmd = new Add(Add.command);
          await cmd.run(name, {
            space,
            project,
            env: helper.environment(),
          });
          await cmd.run('added folder', {
            space,
            project,
            env: helper.environment(),
            index: 0,
          });
          
          const read = new HttpProject(await helper.sdk.project.read(space, project));
          
          const folders = read.listFolders();
          assert.equal(folders[0].info.name, 'added folder');
        });
      });
    });
  });
});
