import { assert } from 'chai';
import { HttpProject } from '@api-client/core';
import { exeCommand, splitTable, cleanTerminalOutput } from '../helpers/CliHelper.js';
import Read from '../../src/commands/project/Read.js';
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

  describe('Store', () => {
    describe('read', () => {
      describe('Units', () => {
        it('prints the basic info', async () => {
          const source = HttpProject.fromName('test');
          const project = await helper.sdk.project.create(space, source);
          const cmd = new Read(Read.command);
          const result = await exeCommand(async () => {
            await cmd.run({
              space,
              project,
              env: helper.environment(),
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [key, name, envs, folders, requests, schemas] = lines;
          assert.include(key, 'key', 'has the "key" line');
          assert.include(key, source.key, 'has the "key" value');
          assert.include(name, 'name', 'has the "name" line');
          assert.include(name, source.info.name as string, 'has the "name" value');
          assert.include(envs, 'environments', 'has the "environments" line');
          assert.include(envs, '(none)', 'has the "environments" default value');
          assert.include(folders, 'folders', 'has the "folders" line');
          assert.include(folders, '(none)', 'has the "folders" default value');
          assert.include(requests, 'requests', 'has the "requests" line');
          assert.include(requests, '(none)', 'has the "requests" default value');
          assert.include(schemas, 'schemas', 'has the "schemas" line');
          assert.include(schemas, '(none)', 'has the "schemas" default value');
        });
    
        it('prints the environments', async () => {
          const source = HttpProject.fromName('test');
          source.addEnvironment('env 1');
          source.addEnvironment('env 2');
          source.addEnvironment('env 3');
          const project = await helper.sdk.project.create(space, source);
          const cmd = new Read(Read.command);
          const result = await exeCommand(async () => {
            await cmd.run({
              space,
              project,
              env: helper.environment(),
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [, , envs] = lines;
          assert.include(envs, 'environments', 'has the "environments" line');
          assert.include(envs, 'env 1, env 2, env 3', 'has the "environments" value');
        });
    
        it('prints the folders', async () => {
          const source = HttpProject.fromName('test');
          source.addFolder('f 1');
          source.addFolder('f 2');
          source.addFolder('f 3');
          const project = await helper.sdk.project.create(space, source);
          const cmd = new Read(Read.command);
          const result = await exeCommand(async () => {
            await cmd.run({
              space,
              project,
              env: helper.environment(),
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [, , , folders] = lines;
          assert.include(folders, 'folders', 'has the "folders" line');
          assert.include(folders, 'f 1, f 2, f 3', 'has the "folders" value');
        });
    
        it('prints the folders', async () => {
          const source = HttpProject.fromName('test');
          source.addRequest('r 1');
          source.addRequest('r 2');
          source.addRequest('r 3');
          const project = await helper.sdk.project.create(space, source);
          const cmd = new Read(Read.command);
          const result = await exeCommand(async () => {
            await cmd.run({
              space,
              project,
              env: helper.environment(),
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [, , , , requests] = lines;
          assert.include(requests, 'requests', 'has the "requests" line');
          assert.include(requests, 'r 1, r 2, r 3', 'has the "requests" default value');
        });
    
        it('prints the schemas', async () => {
          const source = HttpProject.fromName('test');
          source.addSchema('s 1');
          source.addSchema('s 2');
          source.addSchema('s 3');
          const project = await helper.sdk.project.create(space, source);
          const cmd = new Read(Read.command);
          const result = await exeCommand(async () => {
            await cmd.run({
              space,
              project,
              env: helper.environment(),
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [, , , , , schemas] = lines;
          assert.include(schemas, 'schemas', 'has the "schemas" line');
          assert.include(schemas, 's 1, s 2, s 3', 'has the "schemas" default value');
        });
      });
    });
  });
});
