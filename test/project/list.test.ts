import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, IProjectFolder, ProjectFolder, ProjectRequest, IProjectRequest, Environment, IEnvironment } from '@advanced-rest-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-list');
const projectFile = join(projectPath, 'project.json');

const cmdRoot = 'project list';

function formatTableTest(table: string): string[] {
  const re = /\x1B(.*?)\[01m|\x1B\[0m|\x1B\[37m/g;
  const result: string[] = [];
  table.split('\n').forEach((line) => {
    if (line.startsWith('┌') || line.startsWith('└') || line.startsWith('├')) {
      return;
    }
    const cleaned = line.replace(re, '');
    result.push(cleaned.trim());
  });

  return result;
}

describe('Project', () => {
  describe('list', () => {
    describe('folders', () => {
      const folderCmd = `${cmdRoot} folders`;

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
          const result = await runCommand(`${folderCmd} -i ${projectFile} -r json`);
          let data: IProjectFolder[];
          try {
            data = JSON.parse(result.trim());
          } catch (e) {
            console.log('Process result', result);
            throw e;
          }
          assert.typeOf(data, 'array', 'outputs an array');
          assert.lengthOf(data, 2, 'has all folders on the root');
          
          const [d1, d2] = data;
          assert.equal(d1.info.name, 'f1');
          assert.equal(d2.info.name, 'f2');
        });

        it('lists folders of a folder', async () => {
          const result = await runCommand(`${folderCmd} -i ${projectFile} -r json -p ${f2.key}`);
          
          let data: IProjectFolder[];
          try {
            data = JSON.parse(result);
          } catch (e) {
            console.log('Process result', result);
            throw e;
          }
          assert.typeOf(data, 'array', 'outputs an array');
          assert.lengthOf(data, 1, 'has the folder');
          
          const [d3] = data;
          assert.deepEqual(d3, f3.toJSON());
        });

        it('prints a message when unable to find the folder', async () => {
          const result = await runCommand(`${folderCmd} -i ${projectFile} -r json -p test`, true);
          assert.equal(result, 'Unable to find the folder test.');
        });

        it('prints a message when no input project', async () => {
          const result = await runCommand(`${folderCmd} -r json -p test`, true);
          assert.equal(result, 'Project location not specified. Use the --in option to locate the project file or the HTTP_PROJECT variable.');
        });

        it('prints a message when invalid option', async () => {
          let message = '';
          try {
            await runCommand(`${folderCmd} -i ${projectFile} --invalid`);
          } catch (e) {
            message = (e as Error).message.trim();
          }
          assert.equal(message, 'error: unknown option \'--invalid\'');
        });

        it('recognizes the --reporter option', async () => {
          const result = await runCommand(`${folderCmd} -i ${projectFile} --reporter json`);
          let data: IProjectFolder[];
          try {
            data = JSON.parse(result);
          } catch (e) {
            console.log('Process result', result);
            throw e;
          }
          assert.typeOf(data, 'array', 'outputs an array');
        });
      });

      describe('table', () => {
        let f2: ProjectFolder;
        let f3: ProjectFolder;
        before(async () => {
          const project = HttpProject.fromName('test');
          project.addFolder('hook mistreat');
          f2 = project.addFolder('elephant');
          f3 = f2.addFolder('treat breed');
          await writeProject(project, projectFile);
        });

        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });

        it('lists folders of a project', async () => {
          const result = await runCommand(`${folderCmd} -i ${projectFile} -r table`);
          const lines = formatTableTest(result);
          const [title, headers, d1, d2] = lines;

          assert.include(title, 'Project folders', 'table has the title');
          assert.include(headers, 'Key', 'table has the column names');
          assert.include(d1, 'hook mistreat', 'has the first folder');
          assert.include(d2, 'elephant', 'has the second folder');
        });

        it('lists folders of a folder', async () => {
          const result = await runCommand(`${folderCmd} -i ${projectFile} -r table -p ${f2.key}`);
          const lines = formatTableTest(result);
          const [title, headers, d1] = lines;

          assert.include(title, 'Project folders', 'table has the title');
          assert.include(headers, 'Key', 'table has the column names');
          assert.include(d1, 'treat breed', 'has the first folder');
        });

        it('has all columns', async () => {
          const result = await runCommand(`${folderCmd} -i ${projectFile} -r table`);
          const lines = formatTableTest(result);
          const [, headers] = lines;
          
          assert.include(headers, 'Key', 'has the Key column');
          assert.include(headers, 'Name', 'has the Name column');
          assert.include(headers, 'Created', 'has the Created column');
          assert.include(headers, 'Updated', 'has the Updated column');
          assert.include(headers, 'Folders', 'has the Folders column');
          assert.include(headers, 'Requests', 'has the Requests column');
        });

        it('has all values', async () => {
          const result = await runCommand(`${folderCmd} -i ${projectFile} -r table`);
          const lines = formatTableTest(result);
          const [, , , d2] = lines;
          
          assert.include(d2, f2.key, 'has the Key value');
          assert.include(d2, f2.info.name as string, 'has the Name value');
          // assert.include(d2, 'Created', 'has the Created value');
          // assert.include(d2, 'Updated', 'has the Updated value');
          assert.include(d2, '1 │', 'has the Folders value');
          assert.include(d2, '0 │', 'has the Requests value');
        });

        it('prints a message when unable to find the folder', async () => {
          const result = await runCommand(`${folderCmd} -i ${projectFile} -r table -p test`, true);
          assert.include(result, 'Unable to find the folder test.');
        });

        it('is the default formatter', async () => {
          const result = await runCommand(`${folderCmd} -i ${projectFile}`);
          const lines = formatTableTest(result);
          const [title] = lines;
          assert.include(title, 'Project folders', 'table has the title');
        });
      });
    });

    describe('requests', () => {
      const requestCmd = `${cmdRoot} requests`;

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
          const result = await runCommand(`${requestCmd} -i ${projectFile} -r json`);
          let data: IProjectRequest[];
          try {
            data = JSON.parse(result);
          } catch (e) {
            console.log('Process result', result);
            throw e;
          }
          assert.typeOf(data, 'array', 'outputs an array');
          assert.lengthOf(data, 1, 'has all requests on the root');
          
          const [d1] = data;
          assert.equal(d1.expects.url, r1.expects.url);
        });

        it('lists requests of a folder', async () => {
          const result = await runCommand(`${requestCmd} -i ${projectFile} -r json -p ${f1.key}`);
          
          let data: IProjectRequest[];
          try {
            data = JSON.parse(result);
          } catch (e) {
            console.log('Process result', result);
            throw e;
          }
          assert.typeOf(data, 'array', 'outputs an array');
          assert.lengthOf(data, 3, 'has all requests');
          
          const [d2, d3, d4] = data;
          assert.deepEqual(d2, r2.toJSON());
          assert.deepEqual(d3, r3.toJSON());
          assert.deepEqual(d4, r4.toJSON());
        });

        it('returns an empty array when no requests', async () => {
          const result = await runCommand(`${requestCmd} -i ${projectFile} -r json -p ${f2.key}`);
          
          let data: IProjectRequest[];
          try {
            data = JSON.parse(result);
          } catch (e) {
            console.log('Process result', result);
            throw e;
          }
          assert.typeOf(data, 'array', 'outputs an array');
          assert.lengthOf(data, 0, 'has no requests');
        });

        it('prints a message when unable to find the folder', async () => {
          const result = await runCommand(`${requestCmd} -i ${projectFile} -r json -p test`, true);
          assert.equal(result, 'Unable to find the folder test.');
        });

        it('prints a message when no input project', async () => {
          const result = await runCommand(`${requestCmd} -r json -p test`, true);
          assert.equal(result, 'Project location not specified. Use the --in option to locate the project file or the HTTP_PROJECT variable.');
        });

        it('prints a message when invalid option', async () => {
          let message = '';
          try {
            await runCommand(`${requestCmd} -i ${projectFile} --invalid`);
          } catch (e) {
            message = (e as Error).message.trim();
          }
          assert.equal(message, 'error: unknown option \'--invalid\'');
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
          const result = await runCommand(`${requestCmd} -i ${projectFile} -r table`);
          const lines = formatTableTest(result);
          
          const [title, headers, d1] = lines;

          assert.include(title, 'Project requests', 'table has the title');
          assert.include(headers, 'Key', 'table has the column names');
          assert.include(d1, r1.expects.url, 'has the first request');
        });

        it('lists requests of a folder', async () => {
          const result = await runCommand(`${requestCmd} -i ${projectFile} -r table -p ${f1.key}`);
          const lines = formatTableTest(result);

          const [, , d2, d3, d4] = lines;

          assert.include(d2, r2.expects.url, 'has the first request');
          assert.include(d3, r3.expects.url, 'has the second request');
          assert.include(d4, r4.expects.url, 'has the third request');
        });

        it('has all columns', async () => {
          const result = await runCommand(`${requestCmd} -i ${projectFile} -r table`);
          const lines = formatTableTest(result);
          const [, headers] = lines;
          
          assert.include(headers, 'Key', 'has the Key column');
          assert.include(headers, 'Name', 'has the Name column');
          assert.include(headers, 'Method', 'has the Method column');
          assert.include(headers, 'URL', 'has the URL column');
          assert.include(headers, 'Created', 'has the Created column');
          assert.include(headers, 'Updated', 'has the Updated column');
        });

        it('has all values', async () => {
          const result = await runCommand(`${requestCmd} -i ${projectFile} -r table`);
          const lines = formatTableTest(result);
          const [, , d1] = lines;
          
          assert.include(d1, r1.key, 'has the Key value');
          assert.include(d1, r1.info.name as string, 'has the Name value');
          assert.include(d1, r1.expects.method, 'has the Method column');
          assert.include(d1, r1.expects.url, 'has the URL column');
          // assert.include(d1, 'Created', 'has the Created value');
          // assert.include(d1, 'Updated', 'has the Updated value');
        });

        it('is the default formatter', async () => {
          const result = await runCommand(`${requestCmd} -i ${projectFile}`);
          const lines = formatTableTest(result);
          const [title] = lines;
          assert.include(title, 'Project requests', 'table has the title');
        });

        it('returns empty table when no requests', async () => {
          const result = await runCommand(`${requestCmd} -i ${projectFile} -r table -p ${f2.key}`);
          const lines = formatTableTest(result);

          assert.lengthOf(lines, 2, 'has no rows');
        });
      });
    });

    describe('environments', () => {
      const envCmd = `${cmdRoot} environments`;

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
          const result = await runCommand(`${envCmd} -i ${projectFile} -r json`);
          let data: IEnvironment[];
          try {
            data = JSON.parse(result);
          } catch (e) {
            console.log('Process result', result);
            throw e;
          }
          assert.typeOf(data, 'array', 'outputs an array');
          assert.lengthOf(data, 1, 'has all environments on the root');
          
          const [d1] = data;
          assert.deepEqual(d1, e1.toJSON());
        });

        it('lists environments of a folder', async () => {
          const result = await runCommand(`${envCmd} -i ${projectFile} -r json -p ${f1.key}`);
          let data: IEnvironment[];
          try {
            data = JSON.parse(result);
          } catch (e) {
            console.log('Process result', result);
            throw e;
          }
          assert.typeOf(data, 'array', 'outputs an array');
          assert.lengthOf(data, 2, 'has all environments');
          
          const [d2, d3] = data;
          assert.deepEqual(d2, e2.toJSON());
          assert.deepEqual(d3, e3.toJSON());
        });

        it('returns an empty array when no environments', async () => {
          const result = await runCommand(`${envCmd} -i ${projectFile} -r json -p ${f2.key}`);
          let data: IEnvironment[];
          try {
            data = JSON.parse(result);
          } catch (e) {
            console.log('Process result', result);
            throw e;
          }
          assert.typeOf(data, 'array', 'outputs an array');
          assert.lengthOf(data, 0, 'has no requests');
        });
      });

      describe('table', () => {
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
          const result = await runCommand(`${envCmd} -i ${projectFile} -r table`);
          const lines = formatTableTest(result);
          
          const [title, headers, d1] = lines;

          assert.include(title, 'Project environments', 'table has the title');
          assert.include(headers, 'Key', 'table has the column names');
          assert.include(d1, e1.info.name as string, 'has the environment');
        });

        it('lists environments of a folder', async () => {
          const result = await runCommand(`${envCmd} -i ${projectFile} -r table -p ${f1.key}`);
          const lines = formatTableTest(result);

          const [, , d2, d3] = lines;

          assert.include(d2, e2.info.name as string, 'has the first environment');
          assert.include(d3, e3.info.name as string, 'has the second environment');
        });

        it('has all columns', async () => {
          const result = await runCommand(`${envCmd} -i ${projectFile} -r table`);
          const lines = formatTableTest(result);
          const [, headers] = lines;
          
          assert.include(headers, 'Key', 'has the Key column');
          assert.include(headers, 'Name', 'has the Name column');
          assert.include(headers, 'Server', 'has the Server column');
          assert.include(headers, 'Variables', 'has the Variables column');
        });

        it('has all values', async () => {
          const result = await runCommand(`${envCmd} -i ${projectFile} -r table -p ${f1.key}`);
          const lines = formatTableTest(result);
          const [, , , d3] = lines;
          
          assert.include(d3, e3.key, 'has the Key value');
          assert.include(d3, e3.info.name as string, 'has the Name value');
          assert.include(d3, 'https://api.com', 'has the Server column');
          assert.include(d3, '1 │', 'has the Variables column');
        });

        it('has default values', async () => {
          const result = await runCommand(`${envCmd} -i ${projectFile} -r table -p ${f1.key}`);
          const lines = formatTableTest(result);
          const [, , d2] = lines;
          
          assert.include(d2, e2.key, 'has the Key value');
          assert.include(d2, e2.info.name as string, 'has the Name value');
          assert.include(d2, '(none)', 'has the Server column');
          assert.include(d2, '0 │', 'has the Variables column');
        });
      });
    });

    describe('children', () => {
      describe('json', () => {
        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });
      });

      describe('table', () => {
        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });
      });
    });
  });
});
