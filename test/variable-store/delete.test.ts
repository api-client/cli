import { assert } from 'chai';
import { HttpProject, Environment, Property, TestCliHelper } from '@api-client/core';
import Delete from '../../src/commands/project/variable/Delete.js';
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
      describe('Delete', () => {
        describe('Units', () => {
        
          let e1: Environment;
          let v1: Property;
          let v2: Property;
          let project: string;

          beforeEach(async () => {
            const source = new HttpProject();
            e1 = source.addEnvironment('e1');
            v1 = e1.addVariable('v1', 'val1');
            v2 = e1.addVariable('v2', 12345);
            
            project = await helper.sdk.project.create(space, source);
          });

          it('removes a variable from the environment', async () => {
            await TestCliHelper.grabOutput(async () => {
              const cmd = new Delete(Delete.command);
              await cmd.run(e1.key, v1.name, {
                space,
                project,
                env: helper.environment(),
              });
            });
            
            const read = new HttpProject(await helper.sdk.project.read(space, project));
            const env = read.definitions.environments[0];
            assert.lengthOf(env.variables, 1, 'has one variable');
            const remaining = env.variables[0] as Property;
            assert.deepEqual(remaining.toJSON(), v2.toJSON())
          });
        });
      });
    });
  });
});
