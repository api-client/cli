import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, Environment, IProperty } from '@advanced-rest-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject, splitTable } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-variable-list');
const projectFile = join(projectPath, 'project-in.json');

const cmd = 'project variables list';

describe('Project', () => {
  describe('Variable', () => {
    describe('List', () => {
      
      let e1: Environment;
      let e2: Environment;

      before(async () => {
        const project = new HttpProject();
        
        e1 = project.addEnvironment('e1');
        e1.addVariable('v1', 'val1');
        const var2 = e1.addVariable('v2', 12345);
        var2.enabled = false;

        const f1 = project.addFolder('f1');
        e2 = f1.addEnvironment('e2');
        
        await writeProject(project, projectFile);
      });

      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });

      it('lists variables in an environment without values', async () => {
        const result = await runCommand(`${cmd} -i ${projectFile} ${e1.key}`);
        const lines = splitTable(result);
        
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
        const result = await runCommand(`${cmd} -i ${projectFile} ${e1.key} --show-values`);
        const lines = splitTable(result);
        
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

      it('lists empty table when values missing', async () => {
        const result = await runCommand(`${cmd} -i ${projectFile} ${e2.key}`);
        const lines = splitTable(result);
        
        const [title, headers, d1] = lines;
        assert.include(title, 'Environment variables', 'has the title');
        assert.include(headers, 'Value', 'has the headers');

        assert.isUndefined(d1, 'has no more values');
      });

      it('prints an error when folder is not found', async () => {
        const result = await runCommand(`${cmd} -i ${projectFile} some`, { includeError: true });
        assert.include(result, 'The environment "some" not found in the project.');
      });

      it('uses the JSON reporter and masks values', async () => {
        const result = await runCommand(`${cmd} -i ${projectFile} ${e1.key} -r json`);
        const data: IProperty[] = JSON.parse(result);
        const prop = data[0];
        const compare = e1.variables[0].toJSON();
        assert.equal(prop.name, compare.name);
        assert.equal(prop.value, '***');
      });

      it('uses the JSON reporter and renders values', async () => {
        const result = await runCommand(`${cmd} -i ${projectFile} ${e1.key} -r json --show-values`);
        const data: IProperty[] = JSON.parse(result);
        assert.deepEqual(data[0], e1.variables[0].toJSON());
      });
    });
  });
});
