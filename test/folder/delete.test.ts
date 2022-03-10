import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder } from '@api-client/core';
import fs from 'fs/promises';
import { writeProject, captureOutput, findCommandOption } from '../helpers/CliHelper.js';
import Delete from '../../src/commands/project/folder/Delete.js';

const projectPath = join('test', 'playground', 'project-folder-delete');
const projectInFile = join(projectPath, 'project-in.json');
const projectOutFile = join(projectPath, 'project-out.json');

// const cmdRoot = 'project folder';

describe('Project', () => {
  describe('Folder', () => {
    describe('Delete', () => {
      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });

      let f1: ProjectFolder;
      let f2: ProjectFolder;
      let f3: ProjectFolder;

      beforeEach(async () => {
        const project = new HttpProject();
        f1 = project.addFolder('f1');
        f2 = project.addFolder('f2');
        f3 = f2.addFolder('f3');
        await writeProject(project, projectInFile);
      });

      afterEach(async () => {
        await fs.rm(projectOutFile, { recursive: true, force: true });
      });

      it('removes a folder from the project and prints the project', async () => {
        const stop = captureOutput();
        const cmd = new Delete(Delete.command);
        await cmd.run(f1.key, {
          in: projectInFile,
        });
        const result = stop();
        
        const project = new HttpProject(result);
        const folder = project.findFolder(f1.key, { keyOnly: true });
        assert.notOk(folder);
      });

      it('removes a folder from the project and saved to the output file', async () => {
        const cmd = new Delete(Delete.command);
        await cmd.run(f1.key, {
          in: projectInFile,
          out: projectOutFile,
        });
        
        const contents = await fs.readFile(projectOutFile, 'utf8');
        const project = new HttpProject(contents);
        const folder = project.findFolder(f1.key, { keyOnly: true });
        assert.notOk(folder);
      });

      it('removes a folder from a folder', async () => {
        const cmd = new Delete(Delete.command);
        await cmd.run(f2.key, {
          in: projectInFile,
          out: projectOutFile,
        });

        const contents = await fs.readFile(projectOutFile, 'utf8');
        const project = new HttpProject(contents);
        assert.ok(project.findFolder(f1.key, { keyOnly: true }));
        assert.notOk(project.findFolder(f2.key, { keyOnly: true }), 'removes the parent');
        assert.notOk(project.findFolder(f3.key, { keyOnly: true }), 'removes the child');
      });

      it('throws when folder is not found', async () => {
        const cmd = new Delete(Delete.command);
        let e: Error | undefined;
        try {
          await cmd.run('test', {
            in: projectInFile,
          });
        } catch (cause) {
          e = cause as Error;
        }
        assert.ok(e, 'has the error');
        if (e) {
          assert.equal(e.message, 'Unable to find the folder test');
        }
      });

      it('ignores errors when --safe', async () => {
        const stop = captureOutput();
        const cmd = new Delete(Delete.command);
        await cmd.run('test', {
          in: projectInFile,
          safe: true,
        });
        const result = stop();
        const project = new HttpProject(result);
        assert.ok(project);
      });
    });

    describe('#command', () => {
      it('adds global options', () => {
        const option = findCommandOption(Delete.command, '--in');
        assert.ok(option, 'has a global option');
      });

      it('adds output options', () => {
        const option = findCommandOption(Delete.command, '--out');
        assert.ok(option);
      });

      it('adds the safe option', () => {
        const option = findCommandOption(Delete.command, '--safe');
        assert.ok(option);
        assert.equal(option.short, '-s', 'has the short option');
      });
    });

    // describe('Delete', () => {
    //   const finalCmd = `${cmdRoot} delete`;
    //   after(async () => {
    //     await fs.rm(projectPath, { recursive: true, force: true });
    //   });

    //   let f1: ProjectFolder;
    //   let f2: ProjectFolder;
    //   let f3: ProjectFolder;

    //   beforeEach(async () => {
    //     const project = new HttpProject();
    //     f1 = project.addFolder('f1');
    //     f2 = project.addFolder('f2');
    //     f3 = f2.addFolder('f3');
    //     await writeProject(project, projectInFile);
    //   });

    //   afterEach(async () => {
    //     await fs.rm(projectOutFile, { recursive: true, force: true });
    //   });

    //   it('removes a folder from the project and prints the project', async () => {
    //     const result = await runCommand(`${finalCmd} -i ${projectInFile} ${f1.key}`);
        
    //     const project = new HttpProject(result);
    //     const folder = project.findFolder(f1.key, { keyOnly: true });
    //     assert.notOk(folder);
    //   });

    //   it('removes a folder from the project and saved to the output file', async () => {
    //     await runCommand(`${finalCmd} -i ${projectInFile} -o ${projectOutFile} ${f1.key}`);
    //     const contents = await fs.readFile(projectOutFile, 'utf8');
    //     const project = new HttpProject(contents);
    //     const folder = project.findFolder(f1.key, { keyOnly: true });
    //     assert.notOk(folder);
    //   });

    //   it('removes a folder from a folder', async () => {
    //     await runCommand(`${finalCmd} -i ${projectInFile} -o ${projectOutFile} ${f2.key}`);
    //     const contents = await fs.readFile(projectOutFile, 'utf8');
    //     const project = new HttpProject(contents);
    //     assert.ok(project.findFolder(f1.key, { keyOnly: true }));
    //     assert.notOk(project.findFolder(f2.key, { keyOnly: true }), 'removes the parent');
    //     assert.notOk(project.findFolder(f3.key, { keyOnly: true }), 'removes the child');
    //   });

    //   it('prints a message when folder is not found', async () => {
    //     const result = await runCommand(`${finalCmd} -i ${projectInFile} "test"`, { includeError: true });
    //     assert.equal(result, 'Unable to find the folder test');
    //   });

    //   it('ignores errors when --safe', async () => {
    //     const result = await runCommand(`${finalCmd} -i ${projectInFile} --safe "test"`, { includeError: true });
    //     const project = new HttpProject(result);
    //     assert.ok(project);
    //   });
    // });
  });
});
