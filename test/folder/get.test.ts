import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder, IProjectFolder } from '@advanced-rest-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject, splitTable } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-folder-get');
const projectInFile = join(projectPath, 'project.json');

const cmdRoot = 'project folder';

describe('Project', () => {
  describe('Folder', () => {
    describe('Get', () => {
      const addCmd = `${cmdRoot} get`;
      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });

      let f1: ProjectFolder;
      let f2: ProjectFolder;

      beforeEach(async () => {
        const project = new HttpProject();
        f1 = project.addFolder('empty folder');
        f2 = project.addFolder('full folder');
        f2.addFolder('A folder');
        f2.addFolder('Request actions');
        f2.addFolder('Other actions');
        f2.addFolder('Authentication service');
        f2.addFolder('Anomaly value');
        f2.addRequest('https://api.com/authernticate');
        f2.addRequest('https://api.com/otherwise');
        f2.addRequest('https://api.com/another');
        f2.addEnvironment('env 1');
        f2.addEnvironment('env 2');
        await writeProject(project, projectInFile);
      });

      it('prints a table for an empty folder with root parent', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} ${f1.key}`);
        const lines = splitTable(result);
        const [name, created, updated, environments, folders, requests] = lines;
        
        assert.include(name, 'name', 'has the "name" name');
        assert.include(name, 'empty folder', 'has the "name" value');

        assert.include(created, 'created', 'has the "created" name');
        assert.include(updated, 'updated', 'has the "updated" name');

        assert.include(environments, 'environments', 'has the "environments" name');
        assert.include(environments, '(none)', 'has the "environments" value');

        assert.include(folders, 'folders', 'has the "folders" name');
        assert.include(folders, '(none)', 'has the "folders" value');

        assert.include(requests, 'requests', 'has the "requests" name');
        assert.include(requests, '(none)', 'has the "requests" value');
      });

      it('prints a table for a folder with values with a folder parent', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} ${f2.key}`);
        const lines = splitTable(result);
        const [name, created, updated, environments, folders, requests] = lines;
        
        assert.include(name, 'name', 'has the "name" name');
        assert.include(name, 'full folder', 'has the "name" value');

        assert.include(created, 'created', 'has the "created" name');
        assert.include(updated, 'updated', 'has the "updated" name');

        assert.include(environments, 'environments', 'has the "environments" name');
        assert.include(environments, 'env 1, env 2', 'has the "environments" value');

        assert.include(folders, 'folders', 'has the "folders" name');
        assert.include(folders, 'A folder, Request actions,', 'has the "folders" value');

        assert.include(requests, 'requests', 'has the "requests" name');
        assert.include(requests, 'https://api.com/', 'has the "requests" value');
      });

      it('prints a JSON for the folder', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} -r json ${f1.key}`);
        const folder:IProjectFolder = JSON.parse(result);
        assert.deepEqual(folder, f1.toJSON())
      });

      it('prints a key for the folder', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} -k ${f1.key}`);
        assert.equal(result, f1.key);
      });

      it('prints an error when folder not found', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} "unknown"`, { includeError: true });
        assert.equal(result, 'The folder "unknown" not found in the project.');
      });
    });  
  });
});