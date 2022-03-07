import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, Environment, Property } from '@api-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-variable-delete');
const projectFile = join(projectPath, 'project-in.json');

const cmd = 'project variables delete';

describe('Project', () => {
  describe('Variable', () => {
    describe('Delete', () => {
      
      let e1: Environment;
      let v1: Property;
      let v2: Property;

      before(async () => {
        const project = new HttpProject();
        e1 = project.addEnvironment('e1');
        v1 = e1.addVariable('v1', 'val1');
        v2 = e1.addVariable('v2', 12345);
        
        await writeProject(project, projectFile);
      });

      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });

      it('removes a variable from the environment', async () => {
        const result = await runCommand(`${cmd} -i ${projectFile} ${e1.key} ${v1.name}`);
        const project = new HttpProject(result);
        const env = project.definitions.environments[0];
        assert.lengthOf(env.variables, 1, 'has one variable');
        const remaining = env.variables[0] as Property;
        assert.deepEqual(remaining.toJSON(), v2.toJSON())
      });

      it('prints an error when the environment is not found', async () => {
        const result = await runCommand(`${cmd} -i ${projectFile} some ${v1.name}`, { includeError: true });
        assert.include(result, 'The environment "some" not found in the project.');
      });

      it('prints an error when the variable is not found', async () => {
        const result = await runCommand(`${cmd} -i ${projectFile} ${e1.key} some`, { includeError: true });
        assert.include(result, 'The variable "some" not found in the environment.');
      });

      it('saves the project in the output file', async () => {
        const out = join(projectPath, 'project-out.json');
        await runCommand(`${cmd} -i ${projectFile} -o ${out} ${e1.key} ${v1.name}`);
        const contents = await fs.readFile(out, 'utf8');
        const project = new HttpProject(contents);
        const env = project.definitions.environments[0];
        assert.lengthOf(env.variables, 1, 'has one variable');
      });
    });
  });
});
