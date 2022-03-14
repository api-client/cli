import { assert } from 'chai';
import { HttpProject, Environment, TestCliHelper } from '@api-client/core';
import List from '../../src/commands/project/variable/List.js';
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
      describe('List', () => {
        describe('Units', () => {
        
          let e1: Environment;
          let project: string;

          before(async () => {
            const source = new HttpProject();
            
            e1 = source.addEnvironment('e1');
            e1.addVariable('v1', 'val1');
            const var2 = e1.addVariable('v2', 12345);
            var2.enabled = false;

            const f1 = source.addFolder('f1');
            f1.addEnvironment('e2');
            
            project = await helper.sdk.project.create(space, source);
          });

          it('lists variables in an environment without values', async () => {
            const result = await TestCliHelper.grabOutput(async () => {
              const cmd = new List(List.command);
              await cmd.run(e1.key, {
                space,
                project,
                env: helper.environment(),
              });
            });
            const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
            
            const [title, headers, d1, d2, d3] = lines;
            assert.include(title, 'Environment variables', 'has the title');
            assert.include(headers, 'Value', 'has the headers #1');
            assert.include(d1, 'v1', 'has the variable name #1');
            assert.include(d1, '***', 'has the variable value #1');
            assert.include(d1, 'string', 'has the variable type #1');
            assert.include(d1, 'true', 'has the variable enabled #1');

            assert.include(d2, 'v2', 'has the variable name #2');
            assert.include(d2, '***', 'has the variable value #2');
            assert.include(d2, 'integer', 'has the variable type #2');
            assert.include(d2, 'false', 'has the variable enabled #2');
            assert.isUndefined(d3, 'has no more values #2');
          });

          it('lists variables with values', async () => {
            const result = await TestCliHelper.grabOutput(async () => {
              const cmd = new List(List.command);
              await cmd.run(e1.key, {
                space,
                project,
                env: helper.environment(),
                showValues: true,
              });
            });
            const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
            
            const [title, headers, d1, d2, d3] = lines;
            assert.include(title, 'Environment variables', 'has the title');
            assert.include(headers, 'Value', 'has the headers #1');
            assert.include(d1, 'v1', 'has the variable name #1');
            assert.include(d1, 'val1', 'has the variable value #1');
            assert.include(d1, 'string', 'has the variable type #1');
            assert.include(d1, 'true', 'has the variable enabled #1');

            assert.include(d2, 'v2', 'has the variable name #2');
            assert.include(d2, '12345', 'has the variable value #2');
            assert.include(d2, 'integer', 'has the variable type #2');
            assert.include(d2, 'false', 'has the variable enabled #2');
            assert.isUndefined(d3, 'has no more values #2');
          });
        });
      });
    });
  });
});
