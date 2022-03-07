import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, Environment, Property } from '@api-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-variable-add');
const projectFile = join(projectPath, 'project-in.json');

const cmd = 'project variables add';

describe('Project', () => {
  describe('Variable', () => {
    describe('Add', () => {

      let e1: Environment;

      before(async () => {
        const project = new HttpProject();
        e1 = project.addEnvironment('default');
        await writeProject(project, projectFile);
      });

      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });

      it('adds a variable', async () => {
        const result = await runCommand(`${cmd} -i ${projectFile} ${e1.key} --name "v1"`);
        const project = new HttpProject(result);
        const env = project.definitions.environments[0];
        assert.lengthOf(env.variables, 1, 'has the variable');
        const v1 = env.variables[0] as Property;
        assert.equal(v1.name, 'v1', 'variable has the name');
      });

      it('adds the value', async () => {
        const result = await runCommand(`${cmd} -i ${projectFile} ${e1.key} --name "v1" --value "test"`);
        const project = new HttpProject(result);
        const env = project.definitions.environments[0];
        const v1 = env.variables[0] as Property;
        assert.equal(v1.value, 'test', 'variable has the test');
      });

      it('adds enabled', async () => {
        const result = await runCommand(`${cmd} -i ${projectFile} ${e1.key} --name "v1" --disabled`);
        const project = new HttpProject(result);
        const env = project.definitions.environments[0];
        const v1 = env.variables[0] as Property;
        assert.isFalse(v1.enabled);
      });

      it('adds a numeric type', async () => {
        const result = await runCommand(`${cmd} -i ${projectFile} ${e1.key} --name "v1" --value 5210 --type integer`);
        const project = new HttpProject(result);
        const env = project.definitions.environments[0];
        assert.lengthOf(env.variables, 1, 'has the variable');
        const v1 = env.variables[0] as Property;
        assert.strictEqual(v1.value, 5210);
      });

      it('adds a boolean type', async () => {
        const result = await runCommand(`${cmd} -i ${projectFile} ${e1.key} --name "v1" --value true --type boolean`);
        const project = new HttpProject(result);
        const env = project.definitions.environments[0];
        assert.lengthOf(env.variables, 1, 'has the variable');
        const v1 = env.variables[0] as Property;
        assert.strictEqual(v1.value, true);
      });

      it('outputs the project to a file', async () => {
        const out = join(projectPath, 'project-out.json');
        await runCommand(`${cmd} -i ${projectFile} -o ${out} ${e1.key} --name "v1"`);
        const contents = await fs.readFile(out, 'utf8');
        const project = new HttpProject(contents);
        const env = project.definitions.environments[0];
        assert.lengthOf(env.variables, 1, 'has the variable');
        const v1 = env.variables[0] as Property;
        assert.strictEqual(v1.name, 'v1');
      });
    });
  });
});
