import { assert } from 'chai';
import { HttpProject, TestCliHelper } from '@api-client/core';
import Read from '../../src/commands/project/environment/Read.js';
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
    describe('Environment', () => {
      describe('Read', () => {
        it('prints a project level environment', async () => {
          const project = new HttpProject();
          const e1 = project.addEnvironment('e1');
          const id = await helper.sdk.project.create(space, project);
  
          const cmd = new Read(Read.command);
          const result = await TestCliHelper.grabOutput(async () => {
            await cmd.run(e1.key, {
              space,
              project: id,
              env: helper.environment(),
            });
          });
          const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
  
          const [key, name, variables, server] = lines;
          
          assert.include(name, 'name', 'has the "name" name');
          assert.include(name, 'e1', 'has the "name" value');
  
          assert.include(key, 'key', 'has the "key" name');
          assert.include(key, e1.key, 'has the "key" value');
  
          assert.include(variables, 'variables', 'has the "variables" name');
          assert.include(variables, '(none)', 'has the default "variables" value');
  
          assert.include(server, 'server', 'has the "server" name');
          assert.include(server, '(none)', 'has the default "server" value');
        });
  
        it('prints a folder level environment', async () => {
          const project = new HttpProject();
          const f1 = project.addFolder('f1');
          const e1 = f1.addEnvironment('e1');
          const id = await helper.sdk.project.create(space, project);
  
          const cmd = new Read(Read.command);
          const result = await TestCliHelper.grabOutput(async () => {
            await cmd.run(e1.key, {
              space,
              project: id,
              env: helper.environment(),
            });
          });
          const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
          const [key, name, variables, server] = lines;
          
          assert.include(name, 'name', 'has the "name" name');
          assert.include(name, 'e1', 'has the "name" value');
  
          assert.include(key, 'key', 'has the "key" name');
          assert.include(key, e1.key, 'has the "key" value');
  
          assert.include(variables, 'variables', 'has the "variables" name');
          assert.include(variables, '(none)', 'has the default "variables" value');
  
          assert.include(server, 'server', 'has the "server" name');
          assert.include(server, '(none)', 'has the default "server" value');
        });
      });
    });
  });
});
