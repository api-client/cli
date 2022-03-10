import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, IProjectFolder, ProjectFolder, ProjectRequest, IProjectRequest, Environment, IEnvironment } from '@api-client/core';
import fs from 'fs/promises';
import { captureOutput, findCommandOption, writeProject, splitTable, cleanTerminalOutput } from '../helpers/CliHelper.js';
import List, { ProjectTypes } from '../../src/commands/project/List.js';

const projectPath = join('test', 'playground', 'project-list');
const projectFile = join(projectPath, 'project.json');

// const cmdRoot = 'project list';

describe('Project', () => {
  describe('list', () => {
    describe('folders', () => {
      const type: ProjectTypes = `folders`;

      describe('json', () => {
        let f2: ProjectFolder;
        let f3: ProjectFolder;
        before(async () => {
          const project = HttpProject.fromName('test');
          project.addFolder('f1');
          f2 = project.addFolder('f2');
          f3 = f2.addFolder('f3');
          await writeProject(project, projectFile);
        });

        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });

        it('lists folders of a project', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'json',
          });
          const result = stop();
          const data: IProjectFolder[] = JSON.parse(result);
          assert.typeOf(data, 'array', 'outputs an array');
          assert.lengthOf(data, 2, 'has all folders on the root');
          
          const [d1, d2] = data;
          assert.equal(d1.info.name, 'f1');
          assert.equal(d2.info.name, 'f2');
        });

        it('lists folders of a folder', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'json',
            parent: f2.key,
          });
          const result = stop();
          
          const data: IProjectFolder[] = JSON.parse(result);
          assert.typeOf(data, 'array', 'outputs an array');
          assert.lengthOf(data, 1, 'has the folder');
          
          const [d3] = data;
          assert.deepEqual(d3, f3.toJSON());
        });

        it('throws when unable to find the folder', async () => {
          let e: Error | undefined;
          const cmd = new List(List.command);
          try {
            await cmd.run(type, {
              in: projectFile,
              reporter: 'json',
              parent: 'test',
            });
          } catch (cause) {
            e = cause as Error;
          }
          assert.ok(e, 'has the error');
          if (e) {
            assert.equal(e.message, 'Unable to find the folder test.');
          }
        });

        it('throws when no input project', async () => {
          let e: Error | undefined;
          const cmd = new List(List.command);
          try {
            await cmd.run(type, {});
          } catch (cause) {
            e = cause as Error;
          }
          assert.ok(e, 'has the error');
          if (e) {
            assert.equal(e.message, 'You must specify either "--in" or "--project" option.');
          }
        });
      });

      describe('table', () => {
        let f2: ProjectFolder;
        before(async () => {
          const project = HttpProject.fromName('test');
          project.addFolder('hook mistreat');
          f2 = project.addFolder('elephant');
          f2.addFolder('treat breed');
          await writeProject(project, projectFile);
        });

        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });

        it('lists folders of a project', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'table',
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [title, headers, d1, d2] = lines;

          assert.include(title, 'Project folders', 'table has the title');
          assert.include(headers, 'Key', 'table has the column names');
          assert.include(d1, 'hook mistreat', 'has the first folder');
          assert.include(d2, 'elephant', 'has the second folder');
        });

        it('lists folders of a folder', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'table',
            parent: f2.key,
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          const [title, headers, d1] = lines;

          assert.include(title, 'Project folders', 'table has the title');
          assert.include(headers, 'Key', 'table has the column names');
          assert.include(d1, 'treat breed', 'has the first folder');
        });

        it('has all columns', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'table',
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          const [, headers] = lines;
          
          assert.include(headers, 'Key', 'has the Key column');
          assert.include(headers, 'Name', 'has the Name column');
          assert.include(headers, 'Created', 'has the Created column');
          assert.include(headers, 'Updated', 'has the Updated column');
          assert.include(headers, 'Folders', 'has the Folders column');
          assert.include(headers, 'Requests', 'has the Requests column');
        });

        it('has all values', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'table',
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          const [, , , d2] = lines;
          
          assert.include(d2, f2.key, 'has the Key value');
          assert.include(d2, f2.info.name as string, 'has the Name value');
          // assert.include(d2, 'Created', 'has the Created value');
          // assert.include(d2, 'Updated', 'has the Updated value');
          // assert.include(d2, '1 │', 'has the Folders value');
          // assert.include(d2, '0 │', 'has the Requests value');
          assert.include(d2, '      1         0', 'has the Folders and Requests value');
        });

        it('throws when unable to find the folder', async () => {
          let e: Error | undefined;
          const cmd = new List(List.command);
          try {
            await cmd.run(type, {
              in: projectFile,
              parent: 'test',
            });
          } catch (cause) {
            e = cause as Error;
          }
          assert.ok(e, 'has the error');
          if (e) {
            assert.equal(e.message, 'Unable to find the folder test.');
          }
        });
      });

      describe('keys only', () => {
        let f1: ProjectFolder;
        let f2: ProjectFolder;
        let f3: ProjectFolder;
        before(async () => {
          const project = HttpProject.fromName('test');
          f1 = project.addFolder('hook mistreat');
          f2 = project.addFolder('elephant');
          f3 = f2.addFolder('treat breed');
          await writeProject(project, projectFile);
        });

        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });

        it('lists keys of folders of a project', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            keyOnly: true,
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [title, d1, d2] = lines;
          assert.include(title, 'key', 'table has the title');
          assert.include(d1, f1.key, 'has the first folder');
          assert.include(d2, f2.key, 'has the second folder');
        });

        it('lists keys of folders of a folder', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            keyOnly: true,
            parent: f2.key,
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          const [, d3] = lines;
          assert.include(d3, f3.key, 'has the first folder');
        });

        it('prints an empty table', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            keyOnly: true,
            parent: f3.key,
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          assert.lengthOf(lines, 1, 'has the header only');
        });
      });
    });

    describe('requests', () => {
      const type: ProjectTypes = `requests`;

      describe('json', () => {
        let f1: ProjectFolder;
        let f2: ProjectFolder;
        let r1: ProjectRequest;
        let r2: ProjectRequest;
        let r3: ProjectRequest;
        let r4: ProjectRequest;
        before(async () => {
          const project = HttpProject.fromName('test');
          f1 = project.addFolder('with requests');
          f2 = project.addFolder('empty');
          r1 = project.addRequest('https://r1.com');
          r2 = f1.addRequest('https://r2.com');
          r3 = f1.addRequest('https://r3.com');
          r4 = f1.addRequest('https://r4.com');
          await writeProject(project, projectFile);
        });
        
        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });

        it('lists requests of a project', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'json',
          });
          const result = stop();
          const data: IProjectRequest[] = JSON.parse(result);
          assert.typeOf(data, 'array', 'outputs an array');
          assert.lengthOf(data, 1, 'has all requests on the root');
          
          const [d1] = data;
          assert.equal(d1.expects.url, r1.expects.url);
        });

        it('lists requests of a folder', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'json',
            parent: f1.key,
          });
          const result = stop();
          
          const data: IProjectRequest[] = JSON.parse(result);
          assert.typeOf(data, 'array', 'outputs an array');
          assert.lengthOf(data, 3, 'has all requests');
          
          const [d2, d3, d4] = data;
          assert.deepEqual(d2, r2.toJSON());
          assert.deepEqual(d3, r3.toJSON());
          assert.deepEqual(d4, r4.toJSON());
        });

        it('returns an empty array when no requests', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'json',
            parent: f2.key,
          });
          const result = stop();
          
          const data: IProjectRequest[] = JSON.parse(result);
          assert.typeOf(data, 'array', 'outputs an array');
          assert.lengthOf(data, 0, 'has no requests');
        });

        it('throws when unable to find the folder', async () => {
          let e: Error | undefined;
          const cmd = new List(List.command);
          try {
            await cmd.run(type, {
              in: projectFile,
              reporter: 'json',
              parent: 'test',
            });
          } catch (cause) {
            e = cause as Error;
          }
          assert.ok(e, 'has the error');
          if (e) {
            assert.equal(e.message, 'Unable to find the folder test.');
          }
        });

        it('throws when no input project', async () => {
          let e: Error | undefined;
          const cmd = new List(List.command);
          try {
            await cmd.run(type, {});
          } catch (cause) {
            e = cause as Error;
          }
          assert.ok(e, 'has the error');
          if (e) {
            assert.equal(e.message, 'You must specify either "--in" or "--project" option.');
          }
        });
      });

      describe('table', () => {
        let f1: ProjectFolder;
        let f2: ProjectFolder;
        let r1: ProjectRequest;
        let r2: ProjectRequest;
        let r3: ProjectRequest;
        let r4: ProjectRequest;
        before(async () => {
          const project = HttpProject.fromName('test');
          f1 = project.addFolder('with requests');
          f2 = project.addFolder('empty');
          r1 = project.addRequest('https://r1.com');
          r2 = f1.addRequest('https://r2.com');
          r3 = f1.addRequest('https://r3.com');
          r4 = f1.addRequest('https://r4.com');
          await writeProject(project, projectFile);
        });
        
        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });

        it('lists requests of a project', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'table',
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [title, headers, d1] = lines;

          assert.include(title, 'Project requests', 'table has the title');
          assert.include(headers, 'Key', 'table has the column names');
          assert.include(d1, r1.expects.url, 'has the first request');
        });

        it('lists requests of a folder', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'table',
            parent: f1.key,
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));

          const [, , d2, d3, d4] = lines;

          assert.include(d2, r2.expects.url, 'has the first request');
          assert.include(d3, r3.expects.url, 'has the second request');
          assert.include(d4, r4.expects.url, 'has the third request');
        });

        it('has all columns', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'table',
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [, headers] = lines;
          
          assert.include(headers, 'Key', 'has the Key column');
          assert.include(headers, 'Name', 'has the Name column');
          assert.include(headers, 'Method', 'has the Method column');
          assert.include(headers, 'URL', 'has the URL column');
          assert.include(headers, 'Created', 'has the Created column');
          assert.include(headers, 'Updated', 'has the Updated column');
        });

        it('has all values', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'table',
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          const [, , d1] = lines;
          
          assert.include(d1, r1.key, 'has the Key value');
          assert.include(d1, r1.info.name as string, 'has the Name value');
          assert.include(d1, r1.expects.method, 'has the Method column');
          assert.include(d1, r1.expects.url, 'has the URL column');
          // assert.include(d1, 'Created', 'has the Created value');
          // assert.include(d1, 'Updated', 'has the Updated value');
        });

        it('returns empty table when no requests', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'table',
            parent: f2.key,
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));

          assert.lengthOf(lines, 2, 'has no rows');
        });
      });

      describe('keys only', () => {
        let f1: ProjectFolder;
        let f2: ProjectFolder;
        let r1: ProjectRequest;
        let r2: ProjectRequest;
        let r3: ProjectRequest;
        let r4: ProjectRequest;
        before(async () => {
          const project = HttpProject.fromName('test');
          f1 = project.addFolder('with requests');
          f2 = project.addFolder('empty');
          r1 = project.addRequest('https://r1.com');
          r2 = f1.addRequest('https://r2.com');
          r3 = f1.addRequest('https://r3.com');
          r4 = f1.addRequest('https://r4.com');
          await writeProject(project, projectFile);
        });
        
        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });

        it('lists keys of requests of a project', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            keyOnly: true,
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [title, d1] = lines;
          assert.include(title, 'key', 'table has the title');
          assert.include(d1, r1.key, 'has the first request');
        });

        it('lists keys of requests of a folder', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            keyOnly: true,
            parent: f1.key,
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [, d2, d3, d4] = lines;
          assert.include(d2, r2.key, 'has the first request');
          assert.include(d3, r3.key, 'has the second request');
          assert.include(d4, r4.key, 'has the second request');
        });

        it('prints an empty table', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            keyOnly: true,
            parent: f2.key,
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          
          assert.lengthOf(lines, 1, 'has the header only');
        });
      });
    });

    describe('environments', () => {
      const type: ProjectTypes = `environments`;

      describe('json', () => {
        let f1: ProjectFolder;
        let f2: ProjectFolder;
        let e1: Environment;
        let e2: Environment;
        let e3: Environment;
        before(async () => {
          const project = HttpProject.fromName('test');
          f1 = project.addFolder('with environments');
          f2 = project.addFolder('empty');
          e1 = project.addEnvironment('My project environment');
          e2 = f1.addEnvironment('My folder environment');
          e3 = f1.addEnvironment('Env 2');
          e3.addVariable('test', 'value');
          e3.addServer('https://api.com');
          await writeProject(project, projectFile);
        });

        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });

        it('lists environments of a project', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'json',
          });
          const result = stop();
          const data: IEnvironment[] = JSON.parse(result);
          assert.typeOf(data, 'array', 'outputs an array');
          assert.lengthOf(data, 1, 'has all environments on the root');
          
          const [d1] = data;
          assert.deepEqual(d1, e1.toJSON());
        });

        it('lists environments of a folder', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'json',
            parent: f1.key,
          });
          const result = stop();
          
          const data: IEnvironment[] = JSON.parse(result);
          assert.typeOf(data, 'array', 'outputs an array');
          assert.lengthOf(data, 2, 'has all environments');
          
          const [d2, d3] = data;
          assert.deepEqual(d2, e2.toJSON());
          assert.deepEqual(d3, e3.toJSON());
        });

        it('returns an empty array when no environments', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'json',
            parent: f2.key,
          });
          const result = stop();
          const data: IEnvironment[] = JSON.parse(result);
          assert.typeOf(data, 'array', 'outputs an array');
          assert.lengthOf(data, 0, 'has no requests');
        });
      });

      describe('table', () => {
        let f1: ProjectFolder;
        let e1: Environment;
        let e2: Environment;
        let e3: Environment;
        before(async () => {
          const project = HttpProject.fromName('test');
          f1 = project.addFolder('with environments');
          project.addFolder('empty');
          e1 = project.addEnvironment('My project environment');
          e2 = f1.addEnvironment('My folder environment');
          e3 = f1.addEnvironment('Env 2');
          e3.addVariable('test', 'value');
          e3.addServer('https://api.com');
          await writeProject(project, projectFile);
        });
        
        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });

        it('lists environments of a project', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'table',
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [title, headers, d1] = lines;

          assert.include(title, 'Project environments', 'table has the title');
          assert.include(headers, 'Key', 'table has the column names');
          assert.include(d1, e1.info.name as string, 'has the environment');
        });

        it('lists environments of a folder', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'table',
            parent: f1.key,
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));

          const [, , d2, d3] = lines;

          assert.include(d2, e2.info.name as string, 'has the first environment');
          assert.include(d3, e3.info.name as string, 'has the second environment');
        });

        it('has all columns', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'table',
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          const [, headers] = lines;
          
          assert.include(headers, 'Key', 'has the Key column');
          assert.include(headers, 'Name', 'has the Name column');
          assert.include(headers, 'Server', 'has the Server column');
          assert.include(headers, 'Variables', 'has the Variables column');
        });

        it('has all values', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'table',
            parent: f1.key,
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          const [, , , d3] = lines;
          
          assert.include(d3, e3.key, 'has the Key value');
          assert.include(d3, e3.info.name as string, 'has the Name value');
          assert.include(d3, 'https://api.com', 'has the Server column');
          assert.include(d3, '        1', 'has the Variables column');
        });

        it('has default values', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'table',
            parent: f1.key,
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          const [, , d2] = lines;
          
          assert.include(d2, e2.key, 'has the Key value');
          assert.include(d2, e2.info.name as string, 'has the Name value');
          assert.include(d2, '(none)', 'has the Server column');
          assert.include(d2, '        0', 'has the Variables column');
        });
      });

      describe('keys only', () => {
        let f1: ProjectFolder;
        let f2: ProjectFolder;
        let e1: Environment;
        let e2: Environment;
        let e3: Environment;
        before(async () => {
          const project = HttpProject.fromName('test');
          f1 = project.addFolder('with environments');
          f2 = project.addFolder('empty');
          e1 = project.addEnvironment('My project environment');
          e2 = f1.addEnvironment('My folder environment');
          e3 = f1.addEnvironment('Env 2');
          e3.addVariable('test', 'value');
          e3.addServer('https://api.com');
          await writeProject(project, projectFile);
        });
        
        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });

        it('lists environment keys of a project', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            keyOnly: true,
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [title, d1] = lines;

          assert.include(title, 'key', 'table has the title');
          assert.include(d1, e1.key, 'has the environment');
        });

        it('lists environment keys of a folder', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            keyOnly: true,
            parent: f1.key,
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));

          const [, d2, d3] = lines;

          assert.include(d2, e2.key, 'has the first environment');
          assert.include(d3, e3.key as string, 'has the second environment');
        });

        it('prints an empty table', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            keyOnly: true,
            parent: f2.key,
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          assert.lengthOf(lines, 1, 'has the header only');
        });
      });
    });

    describe('children', () => {
      const type: ProjectTypes = `children`;

      describe('json', () => {
        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });
      });

      describe('table', () => {
        let f1: ProjectFolder;
        let f2: ProjectFolder;
        let f3: ProjectFolder;
        let r1: ProjectRequest;
        let r2: ProjectRequest;
        let r3: ProjectRequest;
        let r4: ProjectRequest;
        before(async () => {
          const project = HttpProject.fromName('test');
          f1 = project.addFolder('with children');
          f2 = project.addFolder('empty');
          r1 = project.addRequest('https://r1.com');
          r2 = f1.addRequest('https://r2.com');
          r3 = f1.addRequest('https://r3.com');
          r4 = f1.addRequest('https://r4.com');
          f3 = f1.addFolder('sub-folder');
          await writeProject(project, projectFile);
        });

        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });

        it('lists children of a project', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'table',
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [headers, d1, d2, d3] = lines;
          assert.include(headers, 'Kind', 'table has the Kind column');
          assert.include(headers, 'Key', 'table has the Key column');
          assert.include(headers, 'Name', 'table has the Name column');
          assert.include(d1, f1.key, 'has the first folder');
          assert.include(d2, f2.key, 'has the second folder');
          assert.include(d3, r1.key, 'has the request');
        });

        it('lists children of a folder', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'table',
            parent: f1.key,
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [, d1, d2, d3, d4] = lines;
          assert.include(d1, r2.key, 'has the first request');
          assert.include(d2, r3.key, 'has the second request');
          assert.include(d3, r4.key, 'has the third request');
          assert.include(d4, f3.key, 'has the third request');
        });

        it('lists children of an empty folder', async () => {
          const stop = captureOutput();
          const cmd = new List(List.command);
          await cmd.run(type, {
            in: projectFile,
            reporter: 'table',
            parent: f2.key,
          });
          const result = stop();
          const lines = splitTable(cleanTerminalOutput(result));
          
          assert.lengthOf(lines, 1);
        });
      });
    });

    describe('#command', () => {
      it('adds global options', () => {
        const option = findCommandOption(List.command, '--in');
        assert.ok(option, 'has a global option');
      });
  
      it('adds reporter options', () => {
        const option = findCommandOption(List.command, '--reporter');
        assert.ok(option);
      });
  
      it('adds parent options', () => {
        const option = findCommandOption(List.command, '--parent');
        assert.ok(option);
      });
  
      it('adds key listing options', () => {
        const option = findCommandOption(List.command, '--key-only');
        assert.ok(option);
      });
    });
  });
});
