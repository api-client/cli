import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder, ProjectRequest, IProjectRequest } from '@api-client/core';
import fs from 'fs/promises';
import { findCommandOption, writeProject, exeCommand, splitTable, cleanTerminalOutput } from '../helpers/CliHelper.js';
import Read from '../../src/commands/project/request/Read.js';

const projectPath = join('test', 'playground', 'project-request-read');
const projectInFile = join(projectPath, 'project.json');

describe('Project', () => {
  describe('Request', () => {
    describe('Read', () => {
      describe('Unit', () => {
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
          const result = await exeCommand(async () => {
            const cmd = new Read(Read.command);
            await cmd.run(r1.key, {
              in: projectInFile,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
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
          const result = await exeCommand(async () => {
            const cmd = new Read(Read.command);
            await cmd.run(r2.key, {
              in: projectInFile,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          const [name, , , , , parent, parentKey] = lines;
          
          assert.include(name, 'https://api.com/r2', 'has the "name" value');

          assert.include(parent, 'parent', 'has the "parent" name');
          assert.include(parent, f1.info.name as string, 'has the "parent" value');

          assert.include(parentKey, 'parent key', 'has the "parent key" name');
          assert.include(parentKey, f1.key, 'has the "parent key" value');
        });

        it('prints the request data', async () => {
          const result = await exeCommand(async () => {
            const cmd = new Read(Read.command);
            await cmd.run(r3.key, {
              in: projectInFile,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
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
          const result = await exeCommand(async () => {
            const cmd = new Read(Read.command);
            await cmd.run(r1.key, {
              in: projectInFile,
              reporter: 'json',
            });
          });
          const request:IProjectRequest = JSON.parse(result);
          assert.deepEqual(request, r1.toJSON())
        });

        it('prints a key for the request', async () => {
          const result = await exeCommand(async () => {
            const cmd = new Read(Read.command);
            await cmd.run(r1.key, {
              in: projectInFile,
              keyOnly: true,
            });
          });
          assert.equal(result.trim(), r1.key);
        });

        it('throws an error when request is not found', async () => {
          let e: Error | undefined;
          try {
            const cmd = new Read(Read.command);
            await cmd.run('unknown', {
              in: projectInFile,
            });
          } catch (cause) {
            e = cause as Error;
          }
          assert.ok(e, 'has the error');
          if (e) {
            assert.equal(e.message, 'The request "unknown" not found in the project.');
          }
        });
      });

      describe('#command', () => {
        it('adds global options', () => {
          const option = findCommandOption(Read.command, '--in');
          assert.ok(option, 'has a global option');
        });
  
        it('adds reporter options', () => {
          const option = findCommandOption(Read.command, '--reporter');
          assert.ok(option);
          assert.equal(option.short, '-r', 'has the short option');
        });
  
        it('adds key listing options', () => {
          const option = findCommandOption(Read.command, '--key-only');
          assert.ok(option);
          assert.equal(option.short, '-k', 'has the short option');
        });
      });
    });
  });
});
