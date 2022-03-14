import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, IProjectFolder } from '@api-client/core';
import fs from 'fs/promises';
import { writeProject, exeCommand, findCommandOption, splitTable, cleanTerminalOutput } from '../helpers/CliHelper.js';
import Find from '../../src/commands/project/folder/Find.js';

const projectPath = join('test', 'playground', 'project-folder-find');
const projectInFile = join(projectPath, 'project.json');

// const cmdRoot = 'project folder';

describe('Project', () => {
  describe('File store', () => {
    describe('Folder', () => {
      describe('Find', () => {
        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });

        it('searches for folders in the name filed', async () => {
          const project = new HttpProject();
          const f1 = project.addFolder('a name 1');
          const f2 = project.addFolder('a náme 2');
          project.addFolder('another 3');
          await writeProject(project, projectInFile);

          const query = 'nam';
          const cmd = new Find(Find.command);
          const result = await exeCommand(async () => {
            await cmd.run(query, {
              in: projectInFile,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [title, headers, d1, d2, d3] = lines;
          assert.include(title, 'Project folders', 'table has the title');
          assert.include(headers, 'Key', 'table has the column names');
          assert.include(d1, f1.key, 'has the first folder');
          assert.include(d2, f2.key, 'has the second folder');
          assert.isUndefined(d3, 'has no more results');
        });

        it('searches for folders in the description filed', async () => {
          const project = new HttpProject();
          const f1 = project.addFolder('a name 1');
          f1.info.description = 'A folder number 1';
          const f2 = project.addFolder('a náme 2');
          f2.info.description = 'A folder with orders';
          const f3 = project.addFolder('another 3');
          f3.info.description = 'Store for pets';
          await writeProject(project, projectInFile);

          const query = 'order';
          const cmd = new Find(Find.command);
          const result = await exeCommand(async () => {
            await cmd.run(query, {
              in: projectInFile,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [, , d1, d2] = lines;
          assert.include(d1, f2.key, 'has the first folder');
          assert.isUndefined(d2, 'has no more results');
        });
        
        it('prints a JSON output', async () => {
          const project = new HttpProject();
          project.addFolder('a name 1');
          project.addFolder('a náme 2');
          project.addFolder('another 3');
          await writeProject(project, projectInFile);

          const query = 'nam';
          const cmd = new Find(Find.command);
          const result = await exeCommand(async () => {
            await cmd.run(query, {
              in: projectInFile,
              reporter: 'json',
            });
          });
          
          const folders: IProjectFolder[] = JSON.parse(result);
          assert.lengthOf(folders, 2);
        });

        it('prints keys only', async () => {
          const project = new HttpProject();
          const f1 = project.addFolder('a name 1');
          const f2 = project.addFolder('a náme 2');
          project.addFolder('another 3');
          await writeProject(project, projectInFile);

          const query = 'nam';
          const cmd = new Find(Find.command);
          const result = await exeCommand(async () => {
            await cmd.run(query, {
              in: projectInFile,
              keyOnly: true,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [title, d1, d2] = lines;
          assert.include(title, 'key', 'has the title');
          assert.include(d1, f1.key, 'has request 1');
          assert.include(d2, f2.key, 'has request 2');
        });
      });

      describe('#command', () => {
        it('adds global options', () => {
          const option = findCommandOption(Find.command, '--in');
          assert.ok(option, 'has a global option');
        });

        it('adds reporter options', () => {
          const option = findCommandOption(Find.command, '--reporter');
          assert.ok(option);
          assert.equal(option.short, '-r', 'has the short option');
        });

        it('adds key listing options', () => {
          const option = findCommandOption(Find.command, '--key-only');
          assert.ok(option);
          assert.equal(option.short, '-k', 'has the short option');
        });
      });

      // describe('Find', () => {
      //   const finalCmd = `${cmdRoot} find`;
      //   after(async () => {
      //     await fs.rm(projectPath, { recursive: true, force: true });
      //   });

      //   it('searches for folders in the name filed', async () => {
      //     const project = new HttpProject();
      //     const f1 = project.addFolder('a name 1');
      //     const f2 = project.addFolder('a náme 2');
      //     project.addFolder('another 3');
      //     await writeProject(project, projectInFile);

      //     const query = 'nam';

      //     const result = await runCommand(`${finalCmd} -i ${projectInFile} ${query}`);
      //     const lines = splitTable(result);
          
      //     const [title, headers, d1, d2, d3] = lines;
      //     assert.include(title, 'Project folders', 'table has the title');
      //     assert.include(headers, 'Key', 'table has the column names');
      //     assert.include(d1, f1.key, 'has the first folder');
      //     assert.include(d2, f2.key, 'has the second folder');
      //     assert.isUndefined(d3, 'has no more results');
      //   });

      //   it('searches for folders in the description filed', async () => {
      //     const project = new HttpProject();
      //     const f1 = project.addFolder('a name 1');
      //     f1.info.description = 'A folder number 1';
      //     const f2 = project.addFolder('a náme 2');
      //     f2.info.description = 'A folder with orders';
      //     const f3 = project.addFolder('another 3');
      //     f3.info.description = 'Store for pets';
      //     await writeProject(project, projectInFile);

      //     const query = 'order';

      //     const result = await runCommand(`${finalCmd} -i ${projectInFile} ${query}`);
      //     const lines = splitTable(result);
          
      //     const [, , d1, d2] = lines;
      //     assert.include(d1, f2.key, 'has the first folder');
      //     assert.isUndefined(d2, 'has no more results');
      //   });
        
      //   it('prints a JSON output', async () => {
      //     const project = new HttpProject();
      //     project.addFolder('a name 1');
      //     project.addFolder('a náme 2');
      //     project.addFolder('another 3');
      //     await writeProject(project, projectInFile);

      //     const query = 'nam';

      //     const result = await runCommand(`${finalCmd} -i ${projectInFile} -r json ${query}`);
      //     const folders: IProjectFolder[] = JSON.parse(result);
      //     assert.lengthOf(folders, 2);
      //   });

      //   it('prints keys only', async () => {
      //     const project = new HttpProject();
      //     const f1 = project.addFolder('a name 1');
      //     const f2 = project.addFolder('a náme 2');
      //     project.addFolder('another 3');
      //     await writeProject(project, projectInFile);

      //     const query = 'nam';

      //     const result = await runCommand(`${finalCmd} -i ${projectInFile} -k ${query}`);
      //     const lines = splitTable(result);
          
      //     const [title, d1, d2] = lines;
      //     assert.include(title, 'key', 'has the title');
      //     assert.include(d1, f1.key, 'has request 1');
      //     assert.include(d2, f2.key, 'has request 2');
      //   });
      // });
    });
  });
});
