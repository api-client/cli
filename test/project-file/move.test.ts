import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder, ProjectRequest } from '@api-client/core';
import fs from 'fs/promises';
import { exeCommand, findCommandOption, writeProject } from '../helpers/CliHelper.js';
import Move from '../../src/commands/project/Move.js';

const projectPath = join('test', 'playground', 'project-move');
const projectFile = join(projectPath, 'project.json');

// const cmdRoot = 'project move';

describe('Project', () => {
  describe('File store', () => {
    describe('move', () => {
      describe('Units', () => {      
        let f1: ProjectFolder;
        let f2: ProjectFolder;
        let f3: ProjectFolder;
        let r1: ProjectRequest;
        let r3: ProjectRequest;
        
        before(async () => {
          const project = HttpProject.fromName('test');
          f1 = project.addFolder('folder 1');
          f2 = project.addFolder('folder 2');
          f3 = f2.addFolder('folder 3');
          r1 = project.addRequest('https://r1.com');
          project.addRequest('https://r2.com');
          r3 = f1.addRequest('https://r3.com');
          f1.addRequest('https://r4.com');
          await writeProject(project, projectFile);
        });
    
        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });
    
        it('moves a folder from the project root to a folder', async () => {
          const cmd = new Move(Move.command);
          const result = await exeCommand(async () => {
            await cmd.run(f1.key, {
              in: projectFile,
              parent: f2.key,
            });
          });
          const project = new HttpProject(result);
          const folders = project.listFolders();
          assert.lengthOf(folders, 1, 'project has 1 folder');
          
          const subFolders = folders[0].listFolders();
          assert.lengthOf(subFolders, 2, 'the parent folder has 2 folders');
          assert.deepEqual(subFolders[1].toJSON(), f1.toJSON());
        });
    
        it('moves a request from the project root to a folder', async () => {
          const cmd = new Move(Move.command);
          const result = await exeCommand(async () => {
            await cmd.run(r1.key, {
              in: projectFile,
              parent: f2.key,
            });
          });
          const project = new HttpProject(result);
    
          const requests = project.listRequests();
          assert.lengthOf(requests, 1, 'project has 1 request');
    
          const folder = project.findFolder(f2.key, { keyOnly: true }) as ProjectFolder;
          
          const subRequests = folder.listRequests();
          assert.lengthOf(subRequests, 1, 'the parent folder has the request');
          assert.deepEqual(subRequests[0].toJSON(), r1.toJSON());
        });
    
        it('moves a folder from a folder to the project root', async () => {
          const cmd = new Move(Move.command);
          const result = await exeCommand(async () => {
            await cmd.run(f3.key, {
              in: projectFile,
            });
          });
          const project = new HttpProject(result);
          const folders = project.listFolders();
          assert.lengthOf(folders, 3, 'project has 3 folders');
          
          const folder = project.findFolder(f2.key) as ProjectFolder;
          assert.lengthOf(folder.listFolders(), 0, 'the old parent has no folders');
        });
    
        it('moves a request from a folder to the project root', async () => {
          const cmd = new Move(Move.command);
          const result = await exeCommand(async () => {
            await cmd.run(r3.key, {
              in: projectFile,
            });
          });
          const project = new HttpProject(result);
    
          const requests = project.listRequests();
          assert.lengthOf(requests, 3, 'the project has 3 request');
    
          const folder = project.findFolder(f1.key, { keyOnly: true }) as ProjectFolder;
          
          const subRequests = folder.listRequests();
          assert.lengthOf(subRequests, 1, 'the parent folder does not have the request');
        });
    
        it('throws when moving a folder under itself', async () => {
          let e: Error | undefined;
          const cmd = new Move(Move.command);
          try {
            await cmd.run(f2.key, {
              in: projectFile,
              parent: f3.key,
            });
          } catch (cause) {
            e = cause as Error;
          }
          assert.ok(e, 'has the error');
          if (e) {
            assert.equal(e.message, 'Unable to move a folder to its child.');
          }
        });
    
        it('moves a folder into a position in a folder', async () => {
          const cmd = new Move(Move.command);
          const result = await exeCommand(async () => {
            await cmd.run(f1.key, {
              in: projectFile,
              parent: f2.key,
              index: 0,
            });
          });
          
          const project = new HttpProject(result);
          const folder = project.findFolder(f2.key) as ProjectFolder;
          
          const subFolders = folder.listFolders();
          assert.lengthOf(subFolders, 2, 'the parent folder has 2 folders');
          assert.deepEqual(subFolders[0].toJSON(), f1.toJSON());
        });
    
        it('moves a request into a position in a folder', async () => {
          const cmd = new Move(Move.command);
          const result = await exeCommand(async () => {
            await cmd.run(r1.key, {
              in: projectFile,
              parent: f1.key,
              index: 1,
            });
          });
          
          const project = new HttpProject(result);
          const folder = project.findFolder(f1.key) as ProjectFolder;
          
          const subFolders = folder.listRequests();
          assert.lengthOf(subFolders, 3, 'the parent folder has 3 requests');
          assert.deepEqual(subFolders[1].toJSON(), r1.toJSON());
        });
    
        it('throws when the definition is not found', async () => {
          let e: Error | undefined;
          const cmd = new Move(Move.command);
          try {
            await cmd.run('test', {
              in: projectFile,
              parent: f3.key,
              index: 1,
            });
          } catch (cause) {
            e = cause as Error;
          }
          assert.ok(e, 'has the error');
          if (e) {
            assert.equal(e.message, 'Unable to locate the object: test.');
          }
        });
    
        it('saves the result to another file', async () => {
          const targetFile = join(projectPath, 'project-new.json');
          const cmd = new Move(Move.command);
          await cmd.run(f1.key, {
            in: projectFile,
            out: targetFile,
            parent: f2.key,
            index: 1,
          });
          const contents = await fs.readFile(targetFile, 'utf8');
    
          const project = new HttpProject(contents);
          const folders = project.listFolders();
          assert.lengthOf(folders, 1, 'project has 1 folder');
          
          const subFolders = folders[0].listFolders();
          assert.lengthOf(subFolders, 2, 'the parent folder has 2 folders');
          assert.deepEqual(subFolders[1].toJSON(), f1.toJSON());
        });
      });

      describe('#command', () => {
        it('adds global options', () => {
          const option = findCommandOption(Move.command, '--in');
          assert.ok(option, 'has a global option');
        });
    
        it('adds parent options', () => {
          const option = findCommandOption(Move.command, '--parent');
          assert.ok(option);
        });

        it('adds output options', () => {
          const option = findCommandOption(Move.command, '--out');
          assert.ok(option);
        });
    
        it('adds the index option', () => {
          const option = findCommandOption(Move.command, '--index');
          assert.ok(option);
          assert.equal(option.short, '-n', 'has the short version');
        });
      });
    });
  });
});
