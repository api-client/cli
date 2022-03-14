import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder } from '@api-client/core';
import fs from 'fs/promises';
import { exeCommand, findCommandOption, writeProject, runCommand } from '../helpers/CliHelper.js';
import Add from '../../src/commands/project/request/Add.js';

const projectPath = join('test', 'playground', 'project-request-add');
const projectInFile = join(projectPath, 'project-in.json');
const projectOutFile = join(projectPath, 'project-out.json');

describe('Project', () => {
  describe('File store', () => {
    describe('Request', () => {
      describe('Add', () => {
        describe('Unit', () => {
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

          const url = 'https://api.com';

          it('adds a request to the project and prints the project', async () => {
            const result = await exeCommand(async () => {
              const cmd = new Add(Add.command);
              await cmd.run(url, {
                in: projectInFile,
              });
            });
            
            const project = new HttpProject(result);
            const requests = project.listRequests();
            assert.lengthOf(requests, 1, 'has the request');
            assert.equal(requests[0].info.name, 'https://api.com', 'has the name');
            assert.equal(requests[0].expects.url, 'https://api.com', 'has the url');
          });

          it('adds the name of the request', async () => {
            const result = await exeCommand(async () => {
              const cmd = new Add(Add.command);
              await cmd.run(url, {
                in: projectInFile,
                name: 'test request',
              });
            });
            
            const project = new HttpProject(result);
            const requests = project.listRequests();
            assert.equal(requests[0].info.name, 'test request');
          });

          it('adds the HTTP method', async () => {
            const result = await exeCommand(async () => {
              const cmd = new Add(Add.command);
              await cmd.run(url, {
                in: projectInFile,
                method: 'PUT'
              });
            });
            
            const project = new HttpProject(result);
            const requests = project.listRequests();
            assert.equal(requests[0].expects.method, 'PUT');
          });

          it('adds an HTTP header', async () => {
            const result = await exeCommand(async () => {
              const cmd = new Add(Add.command);
              await cmd.run(url, {
                in: projectInFile,
                header: ['x-test: true'],
              });
            });
            
            const project = new HttpProject(result);
            const requests = project.listRequests();
            assert.equal(requests[0].expects.headers as string, 'x-test: true');
          });

          it('adds multiple HTTP headers', async () => {
            const result = await exeCommand(async () => {
              const cmd = new Add(Add.command);
              await cmd.run(url, {
                in: projectInFile,
              header: ['x-test: true', 'x-other: false'],
              });
            });
            
            const project = new HttpProject(result);
            const requests = project.listRequests();
            assert.equal(requests[0].expects.headers as string, 'x-test: true\nx-other: false');
          });

          it('adds the request to a folder', async () => {
            const result = await exeCommand(async () => {
              const cmd = new Add(Add.command);
              await cmd.run(url, {
                in: projectInFile,
                parent: f1.key,
              });
            });
            
            const project = new HttpProject(result);
            const requests = project.listRequests();
            assert.deepEqual(requests, [], 'project root has no requests');
            const folder = project.findFolder(f1.key) as ProjectFolder;
            assert.lengthOf(folder.listRequests(), 1, 'folder has the request');
          });

          it('adds the request at a position', async () => {
            const result = await exeCommand(async () => {
              const cmd = new Add(Add.command);
              await cmd.run(url, {
                in: projectInFile,
                parent: f2.key,
                index: 1,
              });
            });
            
            const project = new HttpProject(result);
            const folder = project.findFolder(f2.key) as ProjectFolder;
            assert.equal(folder.listRequests()[1].expects.url, 'https://api.com');
          });

          it('throws when file not found', async () => {
            let e: Error | undefined;
            const cmd = new Add(Add.command);
            try {
              await cmd.run(url, {
                in: projectInFile,
                data: ['@not-existing.txt'],
              });
            } catch (cause) {
              e = cause as Error;
            }
            assert.ok(e, 'has the error');
            if (e) {
              assert.equal(e.message, 'Request data input: No such file not-existing.txt');
            }
          });

          it('stores the project in a location', async () => {
            const cmd = new Add(Add.command);
            await cmd.run(url, {
              in: projectInFile,
              out: projectOutFile,
            });
            const contents = await fs.readFile(projectOutFile, 'utf8');
            const project = new HttpProject(contents);
            const requests = project.listRequests();
            assert.lengthOf(requests, 1, 'has the request');
            assert.equal(requests[0].info.name, 'https://api.com', 'has the name');
            assert.equal(requests[0].expects.url, 'https://api.com', 'has the url');
          });
        });

        describe('#command', () => {
          it('adds global options', () => {
            const option = findCommandOption(Add.command, '--in');
            assert.ok(option, 'has a global option');
          });
      
          it('adds output options', () => {
            const option = findCommandOption(Add.command, '--out');
            assert.ok(option);
          });

          it('adds parent options', () => {
            const option = findCommandOption(Add.command, '--parent');
            assert.ok(option);
          });
      
          it('adds the index option', () => {
            const option = findCommandOption(Add.command, '--index');
            assert.ok(option);
            assert.equal(option.short, '-n', 'has the shortcut');
          });

          it('adds the name option', () => {
            const option = findCommandOption(Add.command, '--name');
            assert.ok(option);
            assert.equal(option.short, '-N', 'has the shortcut');
          });

          it('adds the method option', () => {
            const option = findCommandOption(Add.command, '--method');
            assert.ok(option);
            assert.equal(option.short, '-m', 'has the shortcut');
          });

          it('adds the header option', () => {
            const option = findCommandOption(Add.command, '--header');
            assert.ok(option);
            assert.equal(option.short, '-H', 'has the shortcut');
          });

          it('adds the data option', () => {
            const option = findCommandOption(Add.command, '--data');
            assert.ok(option);
            assert.equal(option.short, '-d', 'has the shortcut');
          });

          it('adds the add-parent option', () => {
            const option = findCommandOption(Add.command, '--add-parent');
            assert.ok(option);
            assert.isUndefined(option.short, 'has no shortcut');
          });
        });

        describe('Integration', () => {
          const cmd = `project request add -i ${projectInFile}`;

          after(async () => {
            await fs.rm(projectPath, { recursive: true, force: true });
          });

          it('adds an HTTP header', async () => {
            const created = new HttpProject();
            await writeProject(created, projectInFile);

            const result = await runCommand(`${cmd} --header "x-test: true" -- "https://api.com"`);
            const project = new HttpProject(result);
            const requests = project.listRequests();
            assert.equal(requests[0].expects.headers as string, 'x-test: true');
          });

          it('adds multiple HTTP headers', async () => {
            const created = new HttpProject();
            await writeProject(created, projectInFile);

            // the headers is an array
            const result = await runCommand(`${cmd} --header "x-test: true" "x-other: false" -- "https://api.com"`);
            
            const project = new HttpProject(result);
            const requests = project.listRequests();
            assert.equal(requests[0].expects.headers as string, 'x-test: true\nx-other: false');
          });

          it('adds the request at a position', async () => {
            const created = new HttpProject();
            const f1 = created.addFolder('f2');
            f1.addRequest('r1');
            f1.addRequest('r2');
            await writeProject(created, projectInFile);


            // the index must be parsed as a number.
            const result = await runCommand(`${cmd} --parent ${f1.key} --index 1 "https://api.com"`);
            
            const project = new HttpProject(result);
            const folder = project.findFolder(f1.key) as ProjectFolder;
            assert.equal(folder.listRequests()[1].expects.url, 'https://api.com');
          });

          it('adds www-form-urlencoded data', async () => {
            const created = new HttpProject();
            await writeProject(created, projectInFile);

            const result = await runCommand(`${cmd} -d "name=Pawel" "last=Psztyc" -- "https://api.com"`);
            const project = new HttpProject(result);
            const request = project.listRequests()[0];
            const body = await request.expects.readPayloadAsString();
            assert.equal(body, 'name=Pawel&last=Psztyc');
          });

          it('adds string data', async () => {
            const created = new HttpProject();
            await writeProject(created, projectInFile);

            const result = await runCommand(`${cmd} -d "some value" -- "https://api.com"`);
            const project = new HttpProject(result);
            const request = project.listRequests()[0];
            const body = await request.expects.readPayloadAsString();
            assert.equal(body, 'some value');
          });

          it('adds file data', async () => {
            const created = new HttpProject();
            await writeProject(created, projectInFile);
            const result = await runCommand(`${cmd} -d @test/data/file1.txt -- "https://api.com"`);
            const project = new HttpProject(result.trim());
            const request = project.listRequests()[0];
            const body = await request.expects.readPayloadAsString() as string;
            assert.equal(body.trim(), 'file1 value');
          });
        });
      });
    });
  });
});
