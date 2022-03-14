import { assert } from 'chai';
import { HttpProject, ProjectFolder, Server, TestCliHelper } from '@api-client/core';
import Add from '../../src/commands/project/environment/Add.js';
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
      describe('Add', () => {
        let f1: ProjectFolder;
        let project: string;

        beforeEach(async () => {
          const source = new HttpProject();
          f1 = source.addFolder('f1');
          project = await helper.sdk.project.create(space, source);
        });

        const envName = 'test-env';

        it('adds an environment to the project', async () => {
          const name = envName;
          const cmd = new Add(Add.command);
          await TestCliHelper.grabOutput(async () => {
            await cmd.run(name, {
              space,
              project,
              env: helper.environment(),
            });
          });
          const read = new HttpProject(await helper.sdk.project.read(space, project));
          const { environments } = read.definitions;
          assert.lengthOf(environments, 1, 'project has the environment');
          const [env] = environments;
          assert.equal(env.info.name as string, 'test-env');
          assert.isUndefined(env.info.description);
          assert.deepEqual(env.variables, []);
          assert.isUndefined(env.server);
        });

        it('adds an environment to a folder', async () => {
          const cmd = new Add(Add.command);
          await TestCliHelper.grabOutput(async () => {
            await cmd.run(envName, {
              space,
              project,
              env: helper.environment(),
              parent: f1.key,
            });
          });
          
          const read = new HttpProject(await helper.sdk.project.read(space, project));
          assert.lengthOf(read.environments, 0, 'project has no environment');
  
          const folder = read.findFolder(f1.key) as ProjectFolder;
          const environments = folder.getEnvironments();
          console.log('environments', environments);
          console.log('folder.environments', folder.environments);
          
          const [env] = environments;
          assert.equal(env.info.name as string, 'test-env');
          assert.isUndefined(env.info.description);
          assert.deepEqual(env.variables, []);
          assert.isUndefined(env.server);
        });

        it('adds the description', async () => {
          const cmd = new Add(Add.command);
          await TestCliHelper.grabOutput(async () => {
            await cmd.run(envName, {
              space,
              project,
              env: helper.environment(),
              description: 'My environment',
            });
          });
          const read = new HttpProject(await helper.sdk.project.read(space, project));
          const { environments } = read.definitions;
          const [env] = environments;
          assert.equal(env.info.description as string, 'My environment');
        });
  
        it('adds the base URI', async () => {
          const cmd = new Add(Add.command);
          await TestCliHelper.grabOutput(async () => {
            await cmd.run(envName, {
              space,
              project,
              env: helper.environment(),
              baseUri: 'api.com',
            });
          });
          const read = new HttpProject(await helper.sdk.project.read(space, project));
          const { environments } = read.definitions;
          const [env] = environments;
          assert.ok(env.server, 'has the server');
          const srv = env.server as Server;
          assert.equal(srv.uri as string, 'api.com');
        });
  
        it('adds the protocol', async () => {
          const cmd = new Add(Add.command);
          await TestCliHelper.grabOutput(async () => {
            await cmd.run(envName, {
              space,
              project,
              env: helper.environment(),
              baseUri: 'api.com',
              protocol: 'https:',
            });
          });
          const read = new HttpProject(await helper.sdk.project.read(space, project));
          const { environments } = read.definitions;
          const [env] = environments;
          assert.ok(env.server, 'has the server');
          const srv = env.server as Server;
          assert.equal(srv.protocol as string, 'https:');
        });
  
        it('adds the base path', async () => {
          const cmd = new Add(Add.command);
          await TestCliHelper.grabOutput(async () => {
            await cmd.run(envName, {
              space,
              project,
              env: helper.environment(),
              baseUri: 'api.com',
              basePath: '/v2/api',
            });
          });
          const read = new HttpProject(await helper.sdk.project.read(space, project));
          const { environments } = read.definitions;
          const [env] = environments;
          assert.ok(env.server, 'has the server');
          const srv = env.server as Server;
          assert.equal(srv.basePath as string, '/v2/api');
        });
  
        it('adds server description', async () => {
          const cmd = new Add(Add.command);
          await TestCliHelper.grabOutput(async () => {
            await cmd.run(envName, {
              space,
              project,
              env: helper.environment(),
              serverDescription: 'My API server',
            });
          });
          const read = new HttpProject(await helper.sdk.project.read(space, project));
          const { environments } = read.definitions;
          const [env] = environments;
          assert.ok(env.server, 'has the server');
          const srv = env.server as Server;
          assert.equal(srv.description as string, 'My API server');
        });
      });
    });
  });
});
