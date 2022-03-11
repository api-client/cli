import { assert } from 'chai';
import { join } from 'path';
import { HttpProject } from '@api-client/core';
import fs from 'fs/promises';
import { findCommandOption, writeProject, exeCommand, splitTable, cleanTerminalOutput } from '../helpers/CliHelper.js';
import ProjectRun from '../../src/commands/project/Run.js';
import getSetup from '../helpers/getSetup.js';

const projectPath = join('test', 'playground', 'project-run-single');
const projectFile = join(projectPath, 'project.json');

describe('Project', () => {
  describe('Run', () => {
    describe('Units', () => {
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
          const result = await exeCommand(async () => {
            const cmd = new ProjectRun(ProjectRun.command);
            await cmd.run({
              in: projectFile,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
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
          const result = await exeCommand(async () => {
            const cmd = new ProjectRun(ProjectRun.command);
            await cmd.run({
              in: projectFile,
              iterations: 2,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));

          const [, it1title, , , , , , , it2title] = lines;
          assert.include(it1title, 'Iteration #1');
          assert.include(it2title, 'Iteration #2');
        });

        it('performs a parallel run', async () => {
          const result = await exeCommand(async () => {
            const cmd = new ProjectRun(ProjectRun.command);
            await cmd.run({
              in: projectFile,
              iterations: 2,
              parallel: true,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          const [title] = lines;
          const last = lines.slice(lines.length - 6);
          const [w1, w2, summaryTitle, summaryColumns, iterations, requests] = last;
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

    describe('#command', () => {
      it('adds global options', () => {
        const option = findCommandOption(ProjectRun.command, '--in');
        assert.ok(option, 'has a global option');
      });
  
      it('adds parent options', () => {
        const option = findCommandOption(ProjectRun.command, '--parent');
        assert.ok(option);
      });

      it('adds the environment option', () => {
        const option = findCommandOption(ProjectRun.command, '--environment');
        assert.ok(option);
        assert.equal(option.short, '-e', 'has the shortcut');
      });

      it('adds the request option', () => {
        const option = findCommandOption(ProjectRun.command, '--request');
        
        assert.ok(option);
        assert.equal(option.short, '-r', 'has the shortcut');
        assert.isTrue(option.variadic, 'is an variadic option');
        assert.isTrue(option.optional, 'is an optional option');
      });

      it('adds the ignore option', () => {
        const option = findCommandOption(ProjectRun.command, '--ignore');
        
        assert.ok(option);
        assert.equal(option.short, '-i', 'has the shortcut');
        assert.isTrue(option.variadic, 'is an variadic option');
        assert.isTrue(option.optional, 'is an optional option');
      });

      it('adds the environment option', () => {
        const option = findCommandOption(ProjectRun.command, '--environment');
        
        assert.ok(option);
        assert.equal(option.short, '-e', 'has the shortcut');
      });

      it('adds the iterations option', () => {
        const option = findCommandOption(ProjectRun.command, '--iterations');
        
        assert.ok(option);
        assert.equal(option.short, '-n', 'has the shortcut');
      });

      it('adds the iteration-delay option', () => {
        const option = findCommandOption(ProjectRun.command, '--iteration-delay');
        
        assert.ok(option);
        assert.equal(option.short, '-d', 'has the shortcut');
      });

      it('adds the parallel option', () => {
        const option = findCommandOption(ProjectRun.command, '--parallel');
        
        assert.ok(option);
        assert.isUndefined(option.short, 'has no shortcut');
      });

      it('adds the recursive option', () => {
        const option = findCommandOption(ProjectRun.command, '--recursive');
        
        assert.ok(option);
        assert.isUndefined(option.short, 'has no shortcut');
      });
    });
  });
});
