import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder } from '@advanced-rest-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-folder-delete');
const projectInFile = join(projectPath, 'project-in.json');
const projectOutFile = join(projectPath, 'project-out.json');

const cmdRoot = 'project folder';

describe('Project', () => {
  describe('Folder', () => {
    describe('Delete', () => {
      const finalCmd = `${cmdRoot} delete`;
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

      afterEach(async () => {
        await fs.rm(projectOutFile, { recursive: true, force: true });
      });

      it('removes a folder from the project and prints the project', async () => {
        const result = await runCommand(`${finalCmd} -i ${projectInFile} ${f1.key}`);
        
        const project = new HttpProject(result);
        const folder = project.findFolder(f1.key, { keyOnly: true });
        assert.notOk(folder);
      });

      it('removes a folder from the project and saved to the output file', async () => {
        await runCommand(`${finalCmd} -i ${projectInFile} -o ${projectOutFile} ${f1.key}`);
        const contents = await fs.readFile(projectOutFile, 'utf8');
        const project = new HttpProject(contents);
        const folder = project.findFolder(f1.key, { keyOnly: true });
        assert.notOk(folder);
      });

      it('removes a folder from a folder', async () => {
        await runCommand(`${finalCmd} -i ${projectInFile} -o ${projectOutFile} ${f2.key}`);
        const contents = await fs.readFile(projectOutFile, 'utf8');
        const project = new HttpProject(contents);
        assert.ok(project.findFolder(f1.key, { keyOnly: true }));
        assert.notOk(project.findFolder(f2.key, { keyOnly: true }), 'removes the parent');
        assert.notOk(project.findFolder(f3.key, { keyOnly: true }), 'removes the child');
      });

      it('prints a message when folder is not found', async () => {
        const result = await runCommand(`${finalCmd} -i ${projectInFile} "test"`, { includeError: true });
        assert.equal(result, 'Unable to find the folder test');
      });

      it('ignores errors when --safe', async () => {
        const result = await runCommand(`${finalCmd} -i ${projectInFile} --safe "test"`, { includeError: true });
        const project = new HttpProject(result);
        assert.ok(project);
      });
    });  
  });
});
