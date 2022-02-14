import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder, IProjectFolder } from '@advanced-rest-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject, splitTable } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-folder-find');
const projectInFile = join(projectPath, 'project.json');

const cmdRoot = 'project folder';

describe('Project', () => {
  describe('Folder', () => {
    describe('Find', () => {
      const addCmd = `${cmdRoot} find`;
      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });

      let f1: ProjectFolder;
      let f2: ProjectFolder;
      let f3: ProjectFolder;

      beforeEach(async () => {
        const project = new HttpProject();
        f1 = project.addFolder('f1');
        f2 = project.addFolder('f2');
        f3 = f2.addFolder('f3');
        await writeProject(project, projectInFile);
      });

      it('finds a folder by name and prints as a table', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} ${f1.info.name}`);
        const lines = splitTable(result);
        const [title, headers, d1, d2] = lines;
        assert.include(title, 'Project folders', 'table has the title');
        assert.include(headers, 'Key', 'table has the column names');
        assert.include(d1, f1.key, 'has the folder');
      });

      it('finds a folder by name and prints as a json', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} -r json ${f1.info.name}`);
        const data: IProjectFolder = JSON.parse(result);
        assert.deepEqual(data, f1.toJSON());
      });

      it('finds a folder by name and prints the key', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} --key-only ${f1.info.name}`);
        assert.equal(result, f1.key);
      });

      it('prints an error when folder not found', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} something`, { includeError: true });
        assert.equal(result, 'The folder "something" not found in the project.');
      });

      it('prints an error when unsupported reporter', async () => {
        let thrown = false;
        try {
          await runCommand(`${addCmd} -i ${projectInFile} -r postman ${f1.info.name}`, { includeError: true });
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });
    });  
  });
});
