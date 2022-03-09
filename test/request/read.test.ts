import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder, ProjectRequest, IProjectRequest } from '@api-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject, splitTable } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-request-read');
const projectInFile = join(projectPath, 'project.json');

const cmdRoot = 'project request';

describe('Project', () => {
  describe('Request', () => {
    describe('Read', () => {
      const addCmd = `${cmdRoot} read`;
      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });

      let f1: ProjectFolder;
      let r1: ProjectRequest;
      let r2: ProjectRequest;
      let r3: ProjectRequest;

      beforeEach(async () => {
        const project = new HttpProject();
        f1 = project.addFolder('f1');
        r1 = project.addRequest('https://api.com/r1');
        r2 = f1.addRequest('https://api.com/r2');
        const r3data = ProjectRequest.fromRequest({
          kind: 'ARC@Request',
          expects: {
            url: 'https://api.com/r3',
            method: 'PUT',
            headers: 'content-type: test\ncontent-length: 10',
            payload: 'test value',
          },
          info: {
            name: 'r 3',
          },
        }, project);
        r3 = project.addRequest(r3data);
        await writeProject(project, projectInFile);
      });

      it('prints basic request information', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} ${r1.key}`);
        const lines = splitTable(result);
        const [name, created, updated, url, method] = lines;
        
        assert.include(name, 'name', 'has the "name" name');
        assert.include(name, 'https://api.com/r1', 'has the "name" value');

        assert.include(created, 'created', 'has the "created" name');
        assert.include(updated, 'updated', 'has the "updated" name');

        assert.include(url, 'url', 'has the "url" name');
        assert.include(url, 'https://api.com/r1', 'has the "url" value');

        assert.include(method, 'method', 'has the "method" name');
        assert.include(method, 'GET', 'has the "method" value');
      });

      it('prints a table for a request with values with a folder parent', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} ${r2.key}`);
        const lines = splitTable(result);
        const [name, , , , , parent, parentKey] = lines;
        
        assert.include(name, 'https://api.com/r2', 'has the "name" value');

        assert.include(parent, 'parent', 'has the "parent" name');
        assert.include(parent, f1.info.name as string, 'has the "parent" value');

        assert.include(parentKey, 'parent key', 'has the "parent key" name');
        assert.include(parentKey, f1.key, 'has the "parent key" value');
      });

      it('prints the request data', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} ${r3.key}`);
        const lines = splitTable(result);
        const [name, , , url, method, headers, body] = lines;
        
        assert.include(name, 'r 3', 'has the "name" value');

        assert.include(url, 'url', 'has the "url" name');
        assert.include(url, r3.expects.url as string, 'has the "url" value');

        assert.include(method, 'method', 'has the "method" name');
        assert.include(method, r3.expects.method as string, 'has the "method" value');

        assert.include(headers, 'headers', 'has the "headers" name');
        assert.include(headers, 'content-type, content-length', 'has the "headers" value');

        assert.include(body, 'body', 'has the "body" name');
        assert.include(body, 'String value', 'has the "body" value');
      });

      it('prints a JSON for the request', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} -r json ${r1.key}`);
        const request:IProjectRequest = JSON.parse(result);
        assert.deepEqual(request, r1.toJSON())
      });

      it('prints a key for the request', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} -k ${r1.key}`);
        assert.equal(result, r1.key);
      });

      it('prints an error when request is not found', async () => {
        const result = await runCommand(`${addCmd} -i ${projectInFile} "unknown"`, { includeError: true });
        assert.equal(result, 'The request "unknown" not found in the project.');
      });
    });  
  });
});
