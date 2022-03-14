import { assert } from 'chai';
import { HttpProject, ProjectFolder, ProjectRequest, TestCliHelper } from '@api-client/core';
import Read from '../../src/commands/project/request/Read.js';
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
      describe('Read', () => {
        describe('Unit', () => {
          let f1: ProjectFolder;
          let r1: ProjectRequest;
          let r2: ProjectRequest;
          let project: string;

          beforeEach(async () => {
            const source = new HttpProject();
            f1 = source.addFolder('f1');
            r1 = source.addRequest('https://api.com/r1');
            r2 = f1.addRequest('https://api.com/r2');
            project = await helper.sdk.project.create(space, source);
          });

          it('prints basic request information', async () => {
            const result = await TestCliHelper.grabOutput(async () => {
              const cmd = new Read(Read.command);
              await cmd.run(r1.key, {
                space,
                project,
                env: helper.environment(),
              });
            });
            const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
            const [name, created, updated, url, method] = lines;
            
            assert.include(name, 'name', 'has the "name" name');
            assert.include(name, 'https://api.com/r1', 'has the "name" value');

            assert.include(created, 'created', 'has the "created" name');
            assert.include(updated, 'updated', 'has the "updated" name');

            assert.include(url, 'url', 'has the "url" name');
            assert.include(url, 'https://api.com/r1', 'has the "url" value');

            assert.include(method, 'method', 'has the "method" name');
            assert.include(method, 'GET', 'has the "method" value');
          });

          it('prints a table for a request with values with a folder parent', async () => {
            const result = await TestCliHelper.grabOutput(async () => {
              const cmd = new Read(Read.command);
              await cmd.run(r2.key, {
                space,
                project,
                env: helper.environment(),
              });
            });
            const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
            const [name, , , , , parent, parentKey] = lines;
            
            assert.include(name, 'https://api.com/r2', 'has the "name" value');

            assert.include(parent, 'parent', 'has the "parent" name');
            assert.include(parent, f1.info.name as string, 'has the "parent" value');

            assert.include(parentKey, 'parent key', 'has the "parent key" name');
            assert.include(parentKey, f1.key, 'has the "parent key" value');
          });
        });
      });
    });
  });
});
