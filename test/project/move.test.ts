import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder, ProjectRequest } from '@api-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-move');
const projectFile = join(projectPath, 'project.json');

const cmdRoot = 'project move';

describe('Project', () => {
  describe('move', () => {
    let f1: ProjectFolder;
    let f2: ProjectFolder;
    let f3: ProjectFolder;
    let r1: ProjectRequest;
    let r3: ProjectRequest;
    
    before(async () => {
      const project = HttpProject.fromName('test');
      f1 = project.addFolder('folder 1');
      f2 = project.addFolder('folder 2');
      f3 = f2.addFolder('folder 3');
      r1 = project.addRequest('https://r1.com');
      project.addRequest('https://r2.com');
      r3 = f1.addRequest('https://r3.com');
      f1.addRequest('https://r4.com');
      await writeProject(project, projectFile);
    });

    after(async () => {
      await fs.rm(projectPath, { recursive: true, force: true });
    });

    it('moves a folder from the project root to a folder', async () => {
      const result = await runCommand(`${cmdRoot} -i ${projectFile} -p ${f2.key} ${f1.key}`);
      const project = new HttpProject(result);
      const folders = project.listFolders();
      assert.lengthOf(folders, 1, 'project has 1 folder');
      
      const subFolders = folders[0].listFolders();
      assert.lengthOf(subFolders, 2, 'the parent folder has 2 folders');
      assert.deepEqual(subFolders[1].toJSON(), f1.toJSON());
    });

    it('moves a request from the project root to a folder', async () => {
      const result = await runCommand(`${cmdRoot} -i ${projectFile} -p ${f2.key} ${r1.key}`);
      const project = new HttpProject(result);

      const requests = project.listRequests();
      assert.lengthOf(requests, 1, 'project has 1 request');

      const folder = project.findFolder(f2.key, { keyOnly: true }) as ProjectFolder;
       
      const subRequests = folder.listRequests();
      assert.lengthOf(subRequests, 1, 'the parent folder has the request');
      assert.deepEqual(subRequests[0].toJSON(), r1.toJSON());
    });

    it('moves a folder from a folder to the project root', async () => {
      const result = await runCommand(`${cmdRoot} -i ${projectFile} ${f3.key}`);
      const project = new HttpProject(result);
      const folders = project.listFolders();
      assert.lengthOf(folders, 3, 'project has 3 folders');
      
      const folder = project.findFolder(f2.key) as ProjectFolder;
      assert.lengthOf(folder.listFolders(), 0, 'the old parent has no folders');
    });

    it('moves a request from a folder to the project root', async () => {
      const result = await runCommand(`${cmdRoot} -i ${projectFile} ${r3.key}`);
      const project = new HttpProject(result);

      const requests = project.listRequests();
      assert.lengthOf(requests, 3, 'the project has 3 request');

      const folder = project.findFolder(f1.key, { keyOnly: true }) as ProjectFolder;
       
      const subRequests = folder.listRequests();
      assert.lengthOf(subRequests, 1, 'the parent folder does not have the request');
    });

    it('does not move a folder under itself', async () => {
      const result = await runCommand(`${cmdRoot} -i ${projectFile} ${f2.key} -p ${f3.key}`, { includeError: true });
      assert.include(result, 'Unable to move a folder to its child.');
    });

    it('moves a folder into a position in a folder', async () => {
      const result = await runCommand(`${cmdRoot} -i ${projectFile} -p ${f2.key} --index 0 ${f1.key}`);
      
      const project = new HttpProject(result);
      const folder = project.findFolder(f2.key) as ProjectFolder;
      
      const subFolders = folder.listFolders();
      assert.lengthOf(subFolders, 2, 'the parent folder has 2 folders');
      assert.deepEqual(subFolders[0].toJSON(), f1.toJSON());
    });

    it('moves a request into a position in a folder', async () => {
      const result = await runCommand(`${cmdRoot} -i ${projectFile} -p ${f1.key} --index 1 ${r1.key}`);
      
      const project = new HttpProject(result);
      const folder = project.findFolder(f1.key) as ProjectFolder;
      
      const subFolders = folder.listRequests();
      assert.lengthOf(subFolders, 3, 'the parent folder has 3 requests');
      assert.deepEqual(subFolders[1].toJSON(), r1.toJSON());
    });

    it('returns error message when the definition is not found', async () => {
      const result = await runCommand(`${cmdRoot} -i ${projectFile} test -p ${f3.key}`, { includeError: true });
      assert.include(result, 'Unable to locate the object: test.');
    });

    it('saves the result to another file', async () => {
      const targetFile = join(projectPath, 'project-new.json');
      await runCommand(`${cmdRoot} -i ${projectFile} -o ${targetFile} -p ${f2.key} ${f1.key}`);
      const contents = await fs.readFile(targetFile, 'utf8');

      const project = new HttpProject(contents);
      const folders = project.listFolders();
      assert.lengthOf(folders, 1, 'project has 1 folder');
      
      const subFolders = folders[0].listFolders();
      assert.lengthOf(subFolders, 2, 'the parent folder has 2 folders');
      assert.deepEqual(subFolders[1].toJSON(), f1.toJSON());
    });
  });
});
