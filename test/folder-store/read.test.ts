import { assert } from 'chai';
import { HttpProject, ProjectFolder, TestCliHelper } from '@api-client/core';
import Read from '../../src/commands/project/folder/Read.js';
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
      describe('Read', () => {

        let f1: ProjectFolder;
        let f2: ProjectFolder;
        let project: string;

        beforeEach(async () => {
          const source = new HttpProject();
          f1 = source.addFolder('empty folder');
          f2 = source.addFolder('full folder');
          f2.addFolder('A folder');
          f2.addFolder('Request actions');
          f2.addFolder('Other actions');
          f2.addFolder('Authentication service');
          f2.addFolder('Anomaly value');
          f2.addRequest('https://api.com/authernticate');
          f2.addRequest('https://api.com/otherwise');
          f2.addRequest('https://api.com/another');
          f2.addEnvironment('env 1');
          f2.addEnvironment('env 2');
          project = await helper.sdk.project.create(space, source);
        });

        it('prints a table for an empty folder with root parent', async () => {
          const cmd = new Read(Read.command);
          const result = await TestCliHelper.grabOutput(async () => {
            await cmd.run(f1.key, {
              space,
              project,
              env: helper.environment(),
            });
          });
          const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
          const [name, created, updated, environments, folders, requests] = lines;
          
          assert.include(name, 'name', 'has the "name" name');
          assert.include(name, 'empty folder', 'has the "name" value');

          assert.include(created, 'created', 'has the "created" name');
          assert.include(updated, 'updated', 'has the "updated" name');

          assert.include(environments, 'environments', 'has the "environments" name');
          assert.include(environments, '(none)', 'has the "environments" value');

          assert.include(folders, 'folders', 'has the "folders" name');
          assert.include(folders, '(none)', 'has the "folders" value');

          assert.include(requests, 'requests', 'has the "requests" name');
          assert.include(requests, '(none)', 'has the "requests" value');
        });

        it('prints a table for a folder with values with a folder parent', async () => {
          const cmd = new Read(Read.command);
          const result = await TestCliHelper.grabOutput(async () => {
            await cmd.run(f2.key, {
              space,
              project,
              env: helper.environment(),
            });
          });
          const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
          const [name, created, updated, environments, folders, requests] = lines;
          
          assert.include(name, 'name', 'has the "name" name');
          assert.include(name, 'full folder', 'has the "name" value');

          assert.include(created, 'created', 'has the "created" name');
          assert.include(updated, 'updated', 'has the "updated" name');

          assert.include(environments, 'environments', 'has the "environments" name');
          assert.include(environments, 'env 1, env 2', 'has the "environments" value');

          assert.include(folders, 'folders', 'has the "folders" name');
          assert.include(folders, 'A folder, Request actions,', 'has the "folders" value');

          assert.include(requests, 'requests', 'has the "requests" name');
          assert.include(requests, 'https://api.com/', 'has the "requests" value');
        });
      });
    });
  });
});
