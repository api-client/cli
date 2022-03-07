import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, IProjectFolder } from '@api-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject, splitTable } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-folder-find');
const projectInFile = join(projectPath, 'project.json');

const cmdRoot = 'project folder';

describe('Project', () => {
  describe('Folder', () => {
    describe('Find', () => {
      const finalCmd = `${cmdRoot} find`;
      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });

      it('searches for folders in the name filed', async () => {
        const project = new HttpProject();
        const f1 = project.addFolder('a name 1');
        const f2 = project.addFolder('a náme 2');
        project.addFolder('another 3');
        await writeProject(project, projectInFile);

        const query = 'nam';

        const result = await runCommand(`${finalCmd} -i ${projectInFile} ${query}`);
        const lines = splitTable(result);
        
        const [title, headers, d1, d2, d3] = lines;
        assert.include(title, 'Project folders', 'table has the title');
        assert.include(headers, 'Key', 'table has the column names');
        assert.include(d1, f1.key, 'has the first folder');
        assert.include(d2, f2.key, 'has the second folder');
        assert.isUndefined(d3, 'has no more results');
      });

      it('searches for folders in the description filed', async () => {
        const project = new HttpProject();
        const f1 = project.addFolder('a name 1');
        f1.info.description = 'A folder number 1';
        const f2 = project.addFolder('a náme 2');
        f2.info.description = 'A folder with orders';
        const f3 = project.addFolder('another 3');
        f3.info.description = 'Store for pets';
        await writeProject(project, projectInFile);

        const query = 'order';

        const result = await runCommand(`${finalCmd} -i ${projectInFile} ${query}`);
        const lines = splitTable(result);
        
        const [, , d1, d2] = lines;
        assert.include(d1, f2.key, 'has the first folder');
        assert.isUndefined(d2, 'has no more results');
      });
      
      it('prints a JSON output', async () => {
        const project = new HttpProject();
        project.addFolder('a name 1');
        project.addFolder('a náme 2');
        project.addFolder('another 3');
        await writeProject(project, projectInFile);

        const query = 'nam';

        const result = await runCommand(`${finalCmd} -i ${projectInFile} -r json ${query}`);
        const folders: IProjectFolder[] = JSON.parse(result);
        assert.lengthOf(folders, 2);
      });

      it('prints keys only', async () => {
        const project = new HttpProject();
        const f1 = project.addFolder('a name 1');
        const f2 = project.addFolder('a náme 2');
        project.addFolder('another 3');
        await writeProject(project, projectInFile);

        const query = 'nam';

        const result = await runCommand(`${finalCmd} -i ${projectInFile} -k ${query}`);
        const lines = splitTable(result);
        
        const [title, d1, d2] = lines;
        assert.include(title, 'key', 'has the title');
        assert.include(d1, f1.key, 'has request 1');
        assert.include(d2, f2.key, 'has request 2');
      });
    });  
  });
});
