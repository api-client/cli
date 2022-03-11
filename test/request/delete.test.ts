import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder, ProjectRequest } from '@api-client/core';
import fs from 'fs/promises';
import { findCommandOption, writeProject, exeCommand } from '../helpers/CliHelper.js';
import Delete from '../../src/commands/project/request/Delete.js';
import FolderDelete from '../../src/commands/project/folder/Delete.js';

const projectPath = join('test', 'playground', 'project-request-delete');
const projectInFile = join(projectPath, 'project-in.json');
const projectOutFile = join(projectPath, 'project-out.json');

describe('Project', () => {
  describe('Request', () => {
    describe('Delete', () => {
      describe('Unit', () => {
        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });
  
        let f1: ProjectFolder;
        let r1: ProjectRequest;
        let r2: ProjectRequest;
  
        beforeEach(async () => {
          const project = new HttpProject();
          f1 = project.addFolder('f1');
          r1 = project.addRequest('r1');
          r2 = f1.addRequest('r2');
          
          await writeProject(project, projectInFile);
        });
  
        afterEach(async () => {
          await fs.rm(projectOutFile, { recursive: true, force: true });
        });
  
        it('removes a request from the project and prints the project', async () => {
          const result = await exeCommand(async () => {
            const cmd = new Delete(Delete.command);
            await cmd.run(r1.key, {
              in: projectInFile,
            });
          });
          
          const project = new HttpProject(result);
          const request = project.findRequest(r1.key, { keyOnly: true });
          assert.notOk(request);
        });
  
        it('removes a request from a folder', async () => {
          const result = await exeCommand(async () => {
            const cmd = new Delete(Delete.command);
            await cmd.run(r2.key, {
              in: projectInFile,
            });
          });
          const project = new HttpProject(result);
          const request = project.findRequest(r2.key, { keyOnly: true });
          assert.notOk(request);
          const folder = project.findFolder(f1.key) as ProjectFolder;
          const requests = folder.listRequests();
          assert.deepEqual(requests, []);
        });
  
        it('removes a request when removing a folder', async () => {
          const cmd = new FolderDelete(FolderDelete.command);
          const result = await exeCommand(async () => {
            await cmd.run(f1.key, {
              in: projectInFile,
            });
          });
          const project = new HttpProject(result);
          const request = project.findRequest(r2.key, { keyOnly: true });
          assert.notOk(request);
        });
  
        it('prints a message when the request is not found', async () => {
          let e: Error | undefined;
          const cmd = new Delete(Delete.command);
          try {
            await cmd.run('test', {
              in: projectInFile,
            });
          } catch (cause) {
            e = cause as Error;
          }
          assert.ok(e, 'has the error');
          if (e) {
            assert.equal(e.message, 'Unable to find the request test');
          }
        });
  
        it('ignores errors when --safe', async () => {
          const result = await exeCommand(async () => {
            const cmd = new Delete(Delete.command);
            await cmd.run('test', {
              in: projectInFile,
              safe: true,
            });
          });
          const project = new HttpProject(result);
          assert.ok(project);
        });
  
        it('stores the project in the output location', async () => {
          const cmd = new Delete(Delete.command);
          await cmd.run(r1.key, {
            in: projectInFile,
            out: projectOutFile,
          });
          const contents = await fs.readFile(projectOutFile, 'utf8');
          const project = new HttpProject(contents);
          const request = project.findRequest(r1.key, { keyOnly: true });
          assert.notOk(request);
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
          assert.equal(option.short, '-s', 'has the shortcut');
        });
      });
    });
  });
});
