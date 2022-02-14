import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder } from '@advanced-rest-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-folder-add');
const projectInFile = join(projectPath, 'project-in.json');
const projectOutFile = join(projectPath, 'project-out.json');

const cmdRoot = 'project folder';

describe('Project', () => {
  describe('Folder', () => {
    describe('Add', () => {
      const addCmd = `${cmdRoot} add`;

      before(async () => {
        const project = new HttpProject();
        await writeProject(project, projectInFile);
      });

      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });

      afterEach(async () => {
        await fs.rm(projectOutFile, { recursive: true, force: true });
      });

      it('adds a folder to the project and prints the project', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} "test folder"`);
        
        const project = new HttpProject(result);
        const folders = project.listFolders();
        assert.lengthOf(folders, 1, 'has the folder');
        assert.equal(folders[0].info.name, 'test folder', 'has the name');
      });

      it('adds a folder to the project and saved the result in a file', async () => {
        await runCommand(`${addCmd} -i ${projectInFile} -o ${projectOutFile} "test folder"`);
        const contents = await fs.readFile(projectOutFile, 'utf8');
        const project = new HttpProject(contents);
        const folders = project.listFolders();
        assert.lengthOf(folders, 1, 'has the folder');
        assert.equal(folders[0].info.name, 'test folder', 'has the name');
      });

      it('adds a folder to a folder', async () => {
        await runCommand(`${addCmd} -i ${projectInFile} -o ${projectOutFile} "test folder"`);
        await runCommand(`${addCmd} -i ${projectOutFile} --overwrite -p "test folder" "sub folder"`);
        const contents = await fs.readFile(projectOutFile, 'utf8');
        const project = new HttpProject(contents);
        const parent = project.findFolder('test folder') as ProjectFolder;
        assert.ok(parent, 'has the parent');
        const folders = parent.listFolders();
        assert.lengthOf(folders, 1, 'has the folder');
        assert.equal(folders[0].info.name, 'sub folder', 'has the name');
      });

      it('does not add folder when the name already exists', async () => {
        await runCommand(`${addCmd} -i ${projectInFile} -o ${projectOutFile} "test folder"`);
        await runCommand(`${addCmd} -i ${projectOutFile} --overwrite --skip-existing "test folder"`);
        const contents = await fs.readFile(projectOutFile, 'utf8');
        const project = new HttpProject(contents);
        const folders = project.listFolders();
        assert.lengthOf(folders, 1, 'has the folder');
      });

      it('adds duplicated folder name', async () => {
        await runCommand(`${addCmd} -i ${projectInFile} -o ${projectOutFile} "test folder"`);
        await runCommand(`${addCmd} -i ${projectOutFile} --overwrite "test folder"`);
        const contents = await fs.readFile(projectOutFile, 'utf8');
        const project = new HttpProject(contents);
        const folders = project.listFolders();
        assert.lengthOf(folders, 2, 'has both folders');
      });

      it('adds a folder at position', async () => {
        await runCommand(`${addCmd} -i ${projectInFile} -o ${projectOutFile} "test folder"`);
        await runCommand(`${addCmd} -i ${projectOutFile} --overwrite --index 0 "added folder"`);
        
        const contents = await fs.readFile(projectOutFile, 'utf8');
        const project = new HttpProject(contents);
        
        const folders = project.listFolders();
        assert.equal(folders[0].info.name, 'added folder');
      });
    });  
  });
});
