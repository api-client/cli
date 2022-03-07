import { assert } from 'chai';
import { join } from 'path';
import { HttpProject } from '@api-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject, splitTable } from '../helpers/CliHelper.js';
import getSetup from '../helpers/getSetup.js';

const projectPath = join('test', 'playground', 'project-run-single');
const projectFile = join(projectPath, 'project.json');

const cmdRoot = 'project run';

describe('Project', () => {
  describe('Run', () => {
    describe('project root only', () => {
      before(async () => {
        const info = await getSetup();
        const project = HttpProject.fromName('Test project');
        const env = project.addEnvironment('default');
        env.addVariable('HTTP_PORT', String(info.httpPort));
        env.addVariable('HTTPS_PORT', String(info.httpsPort));

        const baseUrl = 'http://localhost:{HTTP_PORT}/v1/';
        const r1 = project.addRequest(`${baseUrl}get`);
        r1.expects.headers = `x-request-key: ${r1.key}`;

        const r2 = project.addRequest(`${baseUrl}post`);
        r2.expects.headers = `x-request-key: ${r2.key}\ncontent-type: application/json`;
        r2.expects.payload = '{"test":true}';
        r2.expects.method = 'POST';

        const r3 = project.addRequest(`${baseUrl}response/xml`);
        r3.expects.headers = `x-request-key: ${r3.key}`;

        await writeProject(project, projectFile);
      });

      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });

      it('performs requests to all endpoints and prints the result', async () => {
        const result = await runCommand(`${cmdRoot} -i ${projectFile}`);
        const lines = splitTable(result);
        const [title, r1name, r1status, r2name, r2status, r3name, r3status, complete, summaryTitle, summaryColumns, iterations, requests] = lines;

        assert.include(title, 'Project: Test project');

        assert.include(r1name, 'http://localhost:{HTTP_PORT}/v1/get');
        assert.include(r1status, 'GET http://localhost:8000/v1/get [200 OK');

        assert.include(r2name, 'http://localhost:{HTTP_PORT}/v1/post');
        assert.include(r2status, 'POST http://localhost:8000/v1/post [200 OK');

        assert.include(r3name, 'http://localhost:{HTTP_PORT}/v1/response/xml');
        assert.include(r3status, 'GET http://localhost:8000/v1/response/xml [200 OK');

        assert.include(complete, 'Complete');

        assert.include(summaryTitle, 'Project execution summary');
        assert.include(summaryColumns, 'Succeeded');
        assert.include(iterations, 'Iterations');
        assert.include(iterations, '1');
        assert.include(requests, 'Requests');
        assert.include(requests, '3');
      });

      it('performs a run with iterations', async () => {
        const result = await runCommand(`${cmdRoot} -i ${projectFile} -n2`);
        const lines = splitTable(result);

        const [, it1title, , , , , , , it2title] = lines;
        assert.include(it1title, 'Iteration #1');
        assert.include(it2title, 'Iteration #2');
      });

      it('performs a parallel run', async () => {
        const result = await runCommand(`${cmdRoot} -i ${projectFile} -n2 --parallel`);
        const lines = splitTable(result);
        const last = lines.slice(lines.length - 7);
        
        const [title, w1, w2, summaryTitle, summaryColumns, iterations, requests] = last;
        assert.include(title, 'Project: Test project');

        assert.include(w1, 'Worker 1 has finished.');
        assert.include(w2, 'Worker 2 has finished.');
        assert.include(summaryTitle, 'Project execution summary');
        assert.include(summaryColumns, 'Succeeded');
        assert.include(iterations, 'Iterations');
        assert.include(iterations, '2');
        assert.include(requests, 'Requests');
        assert.include(requests, '6');
      });
    });
  });
});
