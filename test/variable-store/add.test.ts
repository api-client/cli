import { assert } from 'chai';
import { HttpProject, Environment, Property, TestCliHelper } from '@api-client/core';
import Add from '../../src/commands/project/variable/Add.js';
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
    describe('Variable', () => {
      describe('Add', () => {
        describe('Units', () => {

          let e1: Environment;
          let project: string;

          beforeEach(async () => {
            const source = new HttpProject();
            e1 = source.addEnvironment('default');
            project = await helper.sdk.project.create(space, source);
          });

          const name = 'v1';

          it('adds a variable', async () => {
            await TestCliHelper.grabOutput(async () => {
              const cmd = new Add(Add.command);
              await cmd.run(e1.key, {
                space,
                project,
                env: helper.environment(),
                name,
              });
            });
            
            const read = new HttpProject(await helper.sdk.project.read(space, project));
            const env = read.definitions.environments[0];
            assert.lengthOf(env.variables, 1, 'has the variable');
            const v1 = env.variables[0] as Property;
            assert.equal(v1.name, 'v1', 'variable has the name');
          });

          it('adds the value', async () => {
            await TestCliHelper.grabOutput(async () => {
              const cmd = new Add(Add.command);
              await cmd.run(e1.key, {
                space,
                project,
                env: helper.environment(),
                name,
                value: 'test',
              });
            });
            const read = new HttpProject(await helper.sdk.project.read(space, project));
            const env = read.definitions.environments[0];
            const v1 = env.variables[0] as Property;
            assert.equal(v1.value, 'test', 'variable has the test');
          });
        });
      });
    });
  });
});
