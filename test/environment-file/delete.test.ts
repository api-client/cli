import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder, Environment } from '@api-client/core';
import fs from 'fs/promises';
import { CommanderError } from 'commander';
import { writeProject, exeCommand, findCommandOption } from '../helpers/CliHelper.js';
import Delete from '../../src/commands/project/environment/Delete.js';

const projectPath = join('test', 'playground', 'project-environment-delete');
const projectInFile = join(projectPath, 'project-in.json');
const projectOutFile = join(projectPath, 'project-out.json');

describe('Project', () => {
  describe('File store', () => {
    describe('Environment', () => {
      describe('Delete', () => {
        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });
  
        let f1: ProjectFolder;
        let e1: Environment;
        let e2: Environment;
  
        before(async () => {
          const project = new HttpProject();
          f1 = project.addFolder('f1');
          e1 = project.addEnvironment('e1');
          e2 = f1.addEnvironment('e2');
          await writeProject(project, projectInFile);
        });
  
        it('removes an environment from the project', async () => {
          const cmd = new Delete(Delete.command);
          const result = await exeCommand(async () => {
            await cmd.run(e1.key, {
              in: projectInFile,
            });
          });
          const project = new HttpProject(result);
          assert.deepEqual(project.environments, []);
        });
  
        it('removes an environment from a folder', async () => {
          const cmd = new Delete(Delete.command);
          const result = await exeCommand(async () => {
            await cmd.run(e2.key, {
              in: projectInFile,
            });
          });
          const project = new HttpProject(result);
          const folder = project.findFolder(f1.key) as ProjectFolder;
          assert.deepEqual(folder.environments, []);
        });
  
        it('throws an error when the environment is not found', async () => {
          const cmd = new Delete(Delete.command);
          let e: CommanderError | undefined;
          try {
            await cmd.run('test', {
              in: projectInFile,
            });
          } catch (cause) {
            e = cause as CommanderError;
          }
          assert.ok(e, 'has the error');
          if (e) {
            assert.equal(e.message, 'The environment cannot be found: test.');
            assert.equal(e.code, 'EENVNOTFOUND');
          }
        });
  
        it('ignores errors when --safe', async () => {
          const cmd = new Delete(Delete.command);
          const result = await exeCommand(async () => {
            await cmd.run('test', {
              in: projectInFile,
              safe: true,
            });
          });
          const project = new HttpProject(result);
          assert.ok(project);
        });
  
        it('removes an environment from the project and saved to the output file', async () => {
          const cmd = new Delete(Delete.command);
          const result = await exeCommand(async () => {
            await cmd.run(e1.key, {
              in: projectInFile,
              out: projectOutFile,
            });
          });
          assert.isEmpty(result);
          const contents = await fs.readFile(projectOutFile, 'utf8');
          const project = new HttpProject(contents);
          assert.deepEqual(project.environments, []);
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
    });
  });
});
