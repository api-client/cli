import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder } from '@api-client/core';
import fs from 'fs/promises';
import { writeProject, exeCommand, findCommandOption } from '../helpers/CliHelper.js';
import Add from '../../src/commands/project/folder/Add.js';

const projectPath = join('test', 'playground', 'project-folder-add');
const projectInFile = join(projectPath, 'project-in.json');
const projectOutFile = join(projectPath, 'project-out.json');

// const cmdRoot = 'project folder';

describe('Project', () => {
  describe('File store', () => {
    describe('Folder', () => {
      describe('Add', () => {

        before(async () => {
          const project = new HttpProject();
          await writeProject(project, projectInFile);
        });

        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });

        afterEach(async () => {
          await fs.rm(projectOutFile, { recursive: true, force: true });
        });

        const name = 'test folder';

        it('adds a folder to the project and prints the project', async () => {
          const cmd = new Add(Add.command);
          const result = await exeCommand(async () => {
            await cmd.run(name, {
              in: projectInFile,
            });
          });
          
          const project = new HttpProject(result);
          const folders = project.listFolders();
          assert.lengthOf(folders, 1, 'has the folder');
          assert.equal(folders[0].info.name, 'test folder', 'has the name');
        });

        it('adds a folder to the project and saved the result in a file', async () => {
          const cmd = new Add(Add.command);
          const result = await exeCommand(async () => {
            await cmd.run(name, {
              in: projectInFile,
              out: projectOutFile,
            });
          });
          assert.isEmpty(result);

          const contents = await fs.readFile(projectOutFile, 'utf8');
          const project = new HttpProject(contents);
          const folders = project.listFolders();
          assert.lengthOf(folders, 1, 'has the folder');
          assert.equal(folders[0].info.name, 'test folder', 'has the name');
        });

        it('adds a folder to a folder', async () => {
          const cmd = new Add(Add.command);
          await cmd.run(name, {
            in: projectInFile,
            out: projectOutFile,
          });
          await cmd.run('sub folder', {
            in: projectOutFile,
            overwrite: true,
            parent: name,
          });
          
          const contents = await fs.readFile(projectOutFile, 'utf8');
          const project = new HttpProject(contents);
          const parent = project.findFolder('test folder') as ProjectFolder;
          assert.ok(parent, 'has the parent');
          const folders = parent.listFolders();
          assert.lengthOf(folders, 1, 'has the folder');
          assert.equal(folders[0].info.name, 'sub folder', 'has the name');
        });

        it('does not add folder when the name already exists', async () => {
          const cmd = new Add(Add.command);
          await cmd.run(name, {
            in: projectInFile,
            out: projectOutFile,
          });
          await cmd.run(name, {
            in: projectOutFile,
            overwrite: true,
            skipExisting: true,
          });

          const contents = await fs.readFile(projectOutFile, 'utf8');
          const project = new HttpProject(contents);
          const folders = project.listFolders();
          assert.lengthOf(folders, 1, 'has the folder');
        });

        it('adds duplicated folder name', async () => {
          const cmd = new Add(Add.command);
          await cmd.run(name, {
            in: projectInFile,
            out: projectOutFile,
          });
          await cmd.run(name, {
            in: projectOutFile,
            overwrite: true,
          });
          const contents = await fs.readFile(projectOutFile, 'utf8');
          const project = new HttpProject(contents);
          const folders = project.listFolders();
          assert.lengthOf(folders, 2, 'has both folders');
        });

        it('adds a folder at position', async () => {
          const cmd = new Add(Add.command);
          await cmd.run(name, {
            in: projectInFile,
            out: projectOutFile,
          });
          await cmd.run('added folder', {
            in: projectOutFile,
            overwrite: true,
            index: 0,
          });
          
          const contents = await fs.readFile(projectOutFile, 'utf8');
          const project = new HttpProject(contents);
          
          const folders = project.listFolders();
          assert.equal(folders[0].info.name, 'added folder');
        });
      });

      describe('#command', () => {
        it('adds global options', () => {
          const option = findCommandOption(Add.command, '--in');
          assert.ok(option, 'has a global option');
        });

        it('adds parent searching options', () => {
          const option = findCommandOption(Add.command, '--parent');
          assert.ok(option);
        });

        it('adds output options', () => {
          const option = findCommandOption(Add.command, '--out');
          assert.ok(option);
        });

        it('adds the skip-existing option', () => {
          const option = findCommandOption(Add.command, '--skip-existing');
          assert.ok(option);
          assert.equal(option.short, '-s', 'has the shortcut');
        });

        it('adds the index option', () => {
          const option = findCommandOption(Add.command, '--index');
          assert.ok(option);
          assert.equal(option.short, '-n', 'has the shortcut');
        });
      });

      // describe('Add', () => {
      //   const addCmd = `${cmdRoot} add`;

      //   before(async () => {
      //     const project = new HttpProject();
      //     await writeProject(project, projectInFile);
      //   });

      //   after(async () => {
      //     await fs.rm(projectPath, { recursive: true, force: true });
      //   });

      //   afterEach(async () => {
      //     await fs.rm(projectOutFile, { recursive: true, force: true });
      //   });

      //   it('adds a folder to the project and prints the project', async () => {
      //     const result = await runCommand(`${addCmd} -i ${projectInFile} "test folder"`);
          
      //     const project = new HttpProject(result);
      //     const folders = project.listFolders();
      //     assert.lengthOf(folders, 1, 'has the folder');
      //     assert.equal(folders[0].info.name, 'test folder', 'has the name');
      //   });

      //   it('adds a folder to the project and saved the result in a file', async () => {
      //     await runCommand(`${addCmd} -i ${projectInFile} -o ${projectOutFile} "test folder"`);
      //     const contents = await fs.readFile(projectOutFile, 'utf8');
      //     const project = new HttpProject(contents);
      //     const folders = project.listFolders();
      //     assert.lengthOf(folders, 1, 'has the folder');
      //     assert.equal(folders[0].info.name, 'test folder', 'has the name');
      //   });

      //   it('adds a folder to a folder', async () => {
      //     await runCommand(`${addCmd} -i ${projectInFile} -o ${projectOutFile} "test folder"`);
      //     await runCommand(`${addCmd} -i ${projectOutFile} --overwrite -p "test folder" "sub folder"`);
      //     const contents = await fs.readFile(projectOutFile, 'utf8');
      //     const project = new HttpProject(contents);
      //     const parent = project.findFolder('test folder') as ProjectFolder;
      //     assert.ok(parent, 'has the parent');
      //     const folders = parent.listFolders();
      //     assert.lengthOf(folders, 1, 'has the folder');
      //     assert.equal(folders[0].info.name, 'sub folder', 'has the name');
      //   });

      //   it('does not add folder when the name already exists', async () => {
      //     await runCommand(`${addCmd} -i ${projectInFile} -o ${projectOutFile} "test folder"`);
      //     await runCommand(`${addCmd} -i ${projectOutFile} --overwrite --skip-existing "test folder"`);
      //     const contents = await fs.readFile(projectOutFile, 'utf8');
      //     const project = new HttpProject(contents);
      //     const folders = project.listFolders();
      //     assert.lengthOf(folders, 1, 'has the folder');
      //   });

      //   it('adds duplicated folder name', async () => {
      //     await runCommand(`${addCmd} -i ${projectInFile} -o ${projectOutFile} "test folder"`);
      //     await runCommand(`${addCmd} -i ${projectOutFile} --overwrite "test folder"`);
      //     const contents = await fs.readFile(projectOutFile, 'utf8');
      //     const project = new HttpProject(contents);
      //     const folders = project.listFolders();
      //     assert.lengthOf(folders, 2, 'has both folders');
      //   });

      //   it('adds a folder at position', async () => {
      //     await runCommand(`${addCmd} -i ${projectInFile} -o ${projectOutFile} "test folder"`);
      //     await runCommand(`${addCmd} -i ${projectOutFile} --overwrite --index 0 "added folder"`);
          
      //     const contents = await fs.readFile(projectOutFile, 'utf8');
      //     const project = new HttpProject(contents);
          
      //     const folders = project.listFolders();
      //     assert.equal(folders[0].info.name, 'added folder');
      //   });
      // });
    });
  });
});
