import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectRequest, IProjectRequest, RequestLog, SentRequest, ArcResponse } from '@advanced-rest-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject, splitTable } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-request-find');
const projectInFile = join(projectPath, 'project.json');

const cmdRoot = 'project request';

describe('Project', () => {
  describe('Request', () => {
    describe('Find', () => {
      const finalCmd = `${cmdRoot} find`;
      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });

      it('searches for requests in the name filed', async () => {
        const project = new HttpProject();
        const r1 = ProjectRequest.fromName('a name 1', project);
        r1.expects.url = 'https://api.com/r1';
        const r2 = ProjectRequest.fromName('a náme 2', project);
        r2.expects.url = 'https://api.com/r2';
        const r3 = ProjectRequest.fromName('another 3', project);
        r3.expects.url = 'https://api.com/r3';
        project.addRequest(r1);
        project.addRequest(r2);
        project.addRequest(r3);
        await writeProject(project, projectInFile);

        const query = 'nam';

        const result = await runCommand(`${finalCmd} -i ${projectInFile} ${query}`);
        const lines = splitTable(result);
        
        const [title, headers, d1, d2, d3] = lines;
        assert.include(title, 'Project requests', 'table has the title');
        assert.include(headers, 'Key', 'table has the column names');
        assert.include(d1, r1.key, 'has the first request');
        assert.include(d2, r2.key, 'has the second request');
        assert.isUndefined(d3, 'has no more results');
      });

      it('searches for requests in the url filed', async () => {
        const project = new HttpProject();
        const r1 = ProjectRequest.fromUrl('https://api.com/v1/resource?query=value', project);
        const r2 = ProjectRequest.fromUrl('http://httpbin.org/get', project);
        const r3 = ProjectRequest.fromUrl('https://httpbin.org/get', project);
        project.addRequest(r1);
        project.addRequest(r2);
        project.addRequest(r3);
        await writeProject(project, projectInFile);

        const query = 'httpbin.org';

        const result = await runCommand(`${finalCmd} -i ${projectInFile} ${query}`);
        const lines = splitTable(result);
        
        const [, , d1, d2, d3] = lines;
        assert.include(d1, r2.key, 'has the first request');
        assert.include(d2, r3.key, 'has the second request');
        assert.isUndefined(d3, 'has no more results');
      });

      it('searches for a path', async () => {
        const project = new HttpProject();
        const r1 = ProjectRequest.fromUrl('https://api.com/v1/resource?query=value', project);
        const r2 = ProjectRequest.fromUrl('http://httpbin.org/get', project);
        const r3 = ProjectRequest.fromUrl('https://httpbin.org/get', project);
        project.addRequest(r1);
        project.addRequest(r2);
        project.addRequest(r3);
        await writeProject(project, projectInFile);

        const query = '/v1/resourc';

        const result = await runCommand(`${finalCmd} -i ${projectInFile} ${query}`);
        const lines = splitTable(result);
        
        const [, , d1, d2] = lines;
        assert.include(d1, r1.key, 'has the request');
        assert.isUndefined(d2, 'has no more results');
      });

      it('searches in the description', async () => {
        const project = new HttpProject();
        const r1 = ProjectRequest.fromName('a name 1', project);
        r1.info.description = 'A request number 1';
        const r2 = ProjectRequest.fromName('a náme 2', project);
        r2.info.description = 'A request with orders';
        const r3 = ProjectRequest.fromName('another 3', project);
        r3.info.description = 'Searches for pets';
        project.addRequest(r1);
        project.addRequest(r2);
        project.addRequest(r3);
        await writeProject(project, projectInFile);

        const query = 'order';

        const result = await runCommand(`${finalCmd} -i ${projectInFile} ${query}`);
        const lines = splitTable(result);
        
        const [title, headers, d1, d2] = lines;
        assert.include(title, 'Project requests', 'table has the title');
        assert.include(headers, 'Key', 'table has the column names');
        assert.include(d1, r2.key, 'has the first request');
        assert.isUndefined(d2, 'has no more results');
      });

      it('searches in the headers (request and response)', async () => {
        const project = new HttpProject();
        const r1 = ProjectRequest.fromName('a name 1', project);
        r1.expects.headers = 'x-token: abcdef';
        const r2 = ProjectRequest.fromName('a name 2', project);
        const r3 = ProjectRequest.fromName('another 3', project);
        const sr = SentRequest.fromBaseValues({ startTime: 0, url: 'https://' });
        const res = ArcResponse.fromValues(200);
        res.headers = 'x-token: abcdef12345';
        const log = RequestLog.fromRequestResponse(sr.toJSON(), res.toJSON());
        r3.setLog(log.toJSON());
        project.addRequest(r1);
        project.addRequest(r2);
        project.addRequest(r3);
        await writeProject(project, projectInFile);

        const query = 'abcdef';

        const result = await runCommand(`${finalCmd} -i ${projectInFile} ${query}`, { includeError: true });
        const lines = splitTable(result);
        
        const [, , d1, d2, d3] = lines;
        
        assert.include(d1, r1.key, 'has the first request');
        assert.include(d2, r3.key, 'has the second request');
        assert.isUndefined(d3, 'has no more results');
      });

      it('prints a JSON output', async () => {
        const project = new HttpProject();
        const r1 = ProjectRequest.fromName('a name 1', project);
        r1.expects.url = 'https://api.com/r1';
        const r2 = ProjectRequest.fromName('a náme 2', project);
        r2.expects.url = 'https://api.com/r2';
        const r3 = ProjectRequest.fromName('another 3', project);
        r3.expects.url = 'https://api.com/r3';
        project.addRequest(r1);
        project.addRequest(r2);
        project.addRequest(r3);
        await writeProject(project, projectInFile);

        const query = 'nam';

        const result = await runCommand(`${finalCmd} -i ${projectInFile} -r json ${query}`);
        const requests: IProjectRequest[] = JSON.parse(result);
        assert.lengthOf(requests, 2);
      });

      it('prints keys only', async () => {
        const project = new HttpProject();
        const r1 = ProjectRequest.fromName('a name 1', project);
        r1.expects.url = 'https://api.com/r1';
        const r2 = ProjectRequest.fromName('a náme 2', project);
        r2.expects.url = 'https://api.com/r2';
        const r3 = ProjectRequest.fromName('another 3', project);
        r3.expects.url = 'https://api.com/r3';
        project.addRequest(r1);
        project.addRequest(r2);
        project.addRequest(r3);
        await writeProject(project, projectInFile);

        const query = 'nam';

        const result = await runCommand(`${finalCmd} -i ${projectInFile} -k ${query}`);
        const lines = splitTable(result);
        
        const [title, d1, d2] = lines;
        assert.include(title, 'key', 'has the title');
        assert.include(d1, r1.key, 'has request 1');
        assert.include(d2, r2.key, 'has request 2');
      });

      it('prints an error when unsupported reporter', async () => {
        const project = new HttpProject();
        ProjectRequest.fromName('a name 1', project);
        const query = 'nam';
        await writeProject(project, projectInFile);
        let thrown = false;
        try {
          await runCommand(`${finalCmd} -i ${projectInFile} -r postman ${query}`, { includeError: true });
        } catch (e) {
          thrown = true;
        }
        assert.isTrue(thrown);
      });
    });  
  });
});
