import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, IEnvironment } from '@api-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject, splitTable } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-environment-get');
const projectInFile = join(projectPath, 'project.json');

const cmdRoot = 'project environment';

describe('Project', () => {
  describe('Environment', () => {
    describe('Get', () => {
      const addCmd = `${cmdRoot} get`;
      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });

      it('prints a project level environment', async () => {
        const project = new HttpProject();
        const e1 = project.addEnvironment('e1');
        await writeProject(project, projectInFile);

        const result = await runCommand(`${addCmd} -i ${projectInFile} ${e1.key}`);
        const lines = splitTable(result);
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
        await writeProject(project, projectInFile);

        const result = await runCommand(`${addCmd} -i ${projectInFile} ${e1.key}`);
        const lines = splitTable(result);
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

      it('prints out the description', async () => {
        const project = new HttpProject();
        const e1 = project.addEnvironment('e1');
        e1.info.description = 'A test env';
        await writeProject(project, projectInFile);

        const result = await runCommand(`${addCmd} -i ${projectInFile} ${e1.key}`);
        const lines = splitTable(result);
        const [, , description] = lines;
        
        assert.include(description, 'description', 'has the "description" name');
        assert.include(description, 'A test env', 'has the "description" value');
      });

      it('prints out the variables', async () => {
        const project = new HttpProject();
        const e1 = project.addEnvironment('e1');
        e1.addVariable('v1', '');
        e1.addVariable('v2', '');
        e1.addVariable('v3', '');
        await writeProject(project, projectInFile);

        const result = await runCommand(`${addCmd} -i ${projectInFile} ${e1.key}`);
        const lines = splitTable(result);
        const [, , variables] = lines;
        
        assert.include(variables, 'variables', 'has the "variables" name');
        assert.include(variables, 'v1, v2, v3', 'has the "variables" value');
      });

      it('prints out the server URI', async () => {
        const project = new HttpProject();
        const e1 = project.addEnvironment('e1');
        e1.addServer('https://api.com');
        await writeProject(project, projectInFile);

        const result = await runCommand(`${addCmd} -i ${projectInFile} ${e1.key}`);
        const lines = splitTable(result);
        const [, , , server] = lines;
        
        assert.include(server, 'server', 'has the "server" name');
        assert.include(server, 'https://api.com', 'has the "server" value');
      });

      it('prints a JSON for the environment', async () => {
        const project = new HttpProject();
        const e1 = project.addEnvironment('e1');
        await writeProject(project, projectInFile);
        
        const result = await runCommand(`${addCmd} -i ${projectInFile} -r json ${e1.key}`);
        const env:IEnvironment = JSON.parse(result);
        assert.deepEqual(env, e1.toJSON())
      });

      it('prints a key for the environment', async () => {
        const project = new HttpProject();
        const e1 = project.addEnvironment('e1');
        await writeProject(project, projectInFile);

        const result = await runCommand(`${addCmd} -i ${projectInFile} -k ${e1.key}`);
        assert.equal(result, e1.key);
      });

      it('prints an error when environment is not found', async () => {
        const project = new HttpProject();
        await writeProject(project, projectInFile);
        const result = await runCommand(`${addCmd} -i ${projectInFile} "unknown"`, { includeError: true });
        assert.equal(result, 'The environment "unknown" not found in the project.');
      });
    });  
  });
});
