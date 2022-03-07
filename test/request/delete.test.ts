import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder, ProjectRequest } from '@api-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-request-delete');
const projectInFile = join(projectPath, 'project-in.json');
const projectOutFile = join(projectPath, 'project-out.json');

const cmdRoot = 'project request';

describe('Project', () => {
  describe('Request', () => {
    describe('Delete', () => {
      const addCmd = `${cmdRoot} delete`;
      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });

      let f1: ProjectFolder;
      let r1: ProjectRequest;
      let r2: ProjectRequest;

      beforeEach(async () => {
        const project = new HttpProject();
        f1 = project.addFolder('f1');
        r1 = project.addRequest('r1');
        r2 = f1.addRequest('r2');
        
        await writeProject(project, projectInFile);
      });

      afterEach(async () => {
        await fs.rm(projectOutFile, { recursive: true, force: true });
      });

      it('removes a request from the project and prints the project', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} ${r1.key}`);
        
        const project = new HttpProject(result);
        const request = project.findRequest(r1.key, { keyOnly: true });
        assert.notOk(request);
      });

      it('removes a request from a folder', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} ${r2.key}`);
        const project = new HttpProject(result);
        const request = project.findRequest(r2.key, { keyOnly: true });
        assert.notOk(request);
        const folder = project.findFolder(f1.key) as ProjectFolder;
        const requests = folder.listRequests();
        assert.deepEqual(requests, []);
      });

      it('removes a request when removing a folder', async () => {
        const result = await runCommand(`project folder delete -i ${projectInFile} ${f1.key}`);
        const project = new HttpProject(result);
        const request = project.findRequest(r2.key, { keyOnly: true });
        assert.notOk(request);
      });

      it('prints a message when the request is not found', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} "test"`, { includeError: true });
        assert.equal(result, 'Unable to find the request test');
      });

      it('ignores errors when --safe', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} --safe "test"`, { includeError: true });
        const project = new HttpProject(result);
        assert.ok(project);
      });

      it('stores the project in the output location', async () => {
        await runCommand(`${addCmd} -i ${projectInFile} -o ${projectOutFile} ${r1.key}`);
        const contents = await fs.readFile(projectOutFile, 'utf8');
        const project = new HttpProject(contents);
        const request = project.findRequest(r1.key, { keyOnly: true });
        assert.notOk(request);
      });
    });  
  });
});
