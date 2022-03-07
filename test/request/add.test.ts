import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder } from '@api-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-request-add');
const projectInFile = join(projectPath, 'project-in.json');
const projectOutFile = join(projectPath, 'project-out.json');

const cmdRoot = 'project request';

describe('Project', () => {
  describe('Request', () => {
    describe('Add', () => {
      const addCmd = `${cmdRoot} add`;
      let f1: ProjectFolder;
      let f2: ProjectFolder;

      before(async () => {
        const project = new HttpProject();
        f1 = project.addFolder('f1');
        f2 = project.addFolder('f2');
        f2.addRequest('r1');
        f2.addRequest('r2');
        await writeProject(project, projectInFile);
      });

      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });

      it('adds a request to the project and prints the project', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} "https://api.com"`);
        
        const project = new HttpProject(result);
        const requests = project.listRequests();
        assert.lengthOf(requests, 1, 'has the request');
        assert.equal(requests[0].info.name, 'https://api.com', 'has the name');
        assert.equal(requests[0].expects.url, 'https://api.com', 'has the url');
      });

      it('adds the name of the request', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} -n "test request" "https://api.com"`);
        
        const project = new HttpProject(result);
        const requests = project.listRequests();
        assert.equal(requests[0].info.name, 'test request');
      });

      it('adds the HTTP method', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} --method "PUT" -- "https://api.com"`);
        
        const project = new HttpProject(result);
        const requests = project.listRequests();
        assert.equal(requests[0].expects.method, 'PUT');
      });

      it('adds an HTTP header', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} --header "x-test: true" -- "https://api.com"`);
        
        const project = new HttpProject(result);
        const requests = project.listRequests();
        assert.equal(requests[0].expects.headers as string, 'x-test: true');
      });

      it('adds multiple HTTP headers', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} --header "x-test: true" "x-other: false" -- "https://api.com"`);
        
        const project = new HttpProject(result);
        const requests = project.listRequests();
        assert.equal(requests[0].expects.headers as string, 'x-test: true\nx-other: false');
      });

      it('adds multiple HTTP headers', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} --header "x-test: true" "x-other: false" -- "https://api.com"`);
        
        const project = new HttpProject(result);
        const requests = project.listRequests();
        assert.equal(requests[0].expects.headers as string, 'x-test: true\nx-other: false');
      });

      it('adds the request to a folder', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} --parent ${f1.key} "https://api.com"`);
        
        const project = new HttpProject(result);
        const requests = project.listRequests();
        assert.deepEqual(requests, [], 'project root has no requests');
        const folder = project.findFolder(f1.key) as ProjectFolder;
        assert.lengthOf(folder.listRequests(), 1, 'folder has the request');
      });

      it('adds the request at a position', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} --parent ${f2.key} --index 1 "https://api.com"`);
        
        const project = new HttpProject(result);
        const folder = project.findFolder(f2.key) as ProjectFolder;
        assert.equal(folder.listRequests()[1].expects.url, 'https://api.com');
      });

      it('adds www-form-urlencoded data', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} -d "name=Pawel" "last=Psztyc" -- "https://api.com"`);
        const project = new HttpProject(result);
        const request = project.listRequests()[0];
        const body = await request.expects.readPayloadAsString();
        assert.equal(body, 'name=Pawel&last=Psztyc');
      });

      it('adds string data', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} -d "some value" -- "https://api.com"`);
        const project = new HttpProject(result);
        const request = project.listRequests()[0];
        const body = await request.expects.readPayloadAsString();
        assert.equal(body, 'some value');
      });

      it('adds file data', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} -d @test/data/file1.txt -- "https://api.com"`);
        const project = new HttpProject(result);
        const request = project.listRequests()[0];
        const body = await request.expects.readPayloadAsString();
        assert.equal(body, 'file1 value\n');
      });

      it('throws when file not found', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} -d @not-existing.txt -- "https://api.com"`, { includeError: true });
        assert.equal(result, 'Request data input: No such file not-existing.txt');
      });

      it('stores the project in a location', async () => {
        await runCommand(`${addCmd} -i ${projectInFile} -o ${projectOutFile} "https://api.com"`);
        const contents = await fs.readFile(projectOutFile, 'utf8');
        const project = new HttpProject(contents);
        const requests = project.listRequests();
        assert.lengthOf(requests, 1, 'has the request');
        assert.equal(requests[0].info.name, 'https://api.com', 'has the name');
        assert.equal(requests[0].expects.url, 'https://api.com', 'has the url');
      });
    });
  });
});
