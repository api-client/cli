import { assert } from 'chai';
import { HttpProject, ProjectFolder, ProjectRequest } from '@api-client/core';
import { exeCommand,  } from '../helpers/CliHelper.js';
import Move from '../../src/commands/project/Move.js';
import getSetup from '../helpers/getSetup.js';
import { SetupConfig } from '../helpers/interfaces.js';
import { StoreHelper } from '../helpers/StoreHelper.js';

describe('Project', () => {
  let env: SetupConfig;
  let helper: StoreHelper;
  let space: string;

  before(async () => {
    env = await getSetup();
    helper = new StoreHelper(env.singleUserBaseUri);
    await helper.initStoreSpace();
    space = helper.space as string;
  });

  after(async () => {
    await helper.testDelete(`/test/reset/spaces`);
    await helper.testDelete(`/test/reset/projects`);
    await helper.testDelete(`/test/reset/sessions`);
  });

  describe('Store', () => {
    describe('move', () => {
      describe('Units', () => {      
        let f1: ProjectFolder;
        let f2: ProjectFolder;
        let f3: ProjectFolder;
        let r1: ProjectRequest;
        let r3: ProjectRequest;
        let projectId: string;

        beforeEach(async () => {
          const project = HttpProject.fromName('test');
          f1 = project.addFolder('folder 1');
          f2 = project.addFolder('folder 2');
          f3 = f2.addFolder('folder 3');
          r1 = project.addRequest('https://r1.com');
          project.addRequest('https://r2.com');
          r3 = f1.addRequest('https://r3.com');
          f1.addRequest('https://r4.com');
          projectId = await helper.sdk.project.create(space, project);
        });
    
        it('moves a folder from the project root to a folder', async () => {
          const cmd = new Move(Move.command);
          await exeCommand(async () => {
            await cmd.run(f1.key, {
              space,
              project: projectId,
              env: helper.environment(),
              parent: f2.key,
            });
          });
          
          const schema = await helper.sdk.project.read(space, projectId);
          const project = new HttpProject(schema);
          const folders = project.listFolders();
          assert.lengthOf(folders, 1, 'project has 1 folder');
          
          const subFolders = folders[0].listFolders();
          assert.lengthOf(subFolders, 2, 'the parent folder has 2 folders');
          assert.deepEqual(subFolders[1].toJSON(), f1.toJSON());
        });
    
        it('moves a request from the project root to a folder', async () => {
          const cmd = new Move(Move.command);
          await exeCommand(async () => {
            await cmd.run(r1.key, {
              space,
              project: projectId,
              env: helper.environment(),
              parent: f2.key,
            });
          });
          const schema = await helper.sdk.project.read(space, projectId);
          const project = new HttpProject(schema);
    
          const requests = project.listRequests();
          assert.lengthOf(requests, 1, 'project has 1 request');
    
          const folder = project.findFolder(f2.key, { keyOnly: true }) as ProjectFolder;
          
          const subRequests = folder.listRequests();
          assert.lengthOf(subRequests, 1, 'the parent folder has the request');
          assert.deepEqual(subRequests[0].toJSON(), r1.toJSON());
        });
    
        it('moves a folder from a folder to the project root', async () => {
          const cmd = new Move(Move.command);
          await exeCommand(async () => {
            await cmd.run(f3.key, {
              space,
              project: projectId,
              env: helper.environment(),
            });
          });
          
          const schema = await helper.sdk.project.read(space, projectId);
          const project = new HttpProject(schema);
          const folders = project.listFolders();
          assert.lengthOf(folders, 3, 'project has 3 folders');
          
          const folder = project.findFolder(f2.key) as ProjectFolder;
          assert.lengthOf(folder.listFolders(), 0, 'the old parent has no folders');
        });
    
        it('moves a request from a folder to the project root', async () => {
          const cmd = new Move(Move.command);
          await exeCommand(async () => {
            await cmd.run(r3.key, {
              space,
              project: projectId,
              env: helper.environment(),
            });
          });
          const schema = await helper.sdk.project.read(space, projectId);
          const project = new HttpProject(schema);
    
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
              space,
              project: projectId,
              env: helper.environment(),
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
          await exeCommand(async () => {
            await cmd.run(f1.key, {
              space,
              project: projectId,
              env: helper.environment(),
              parent: f2.key,
              index: 0,
            });
          });
          
          const schema = await helper.sdk.project.read(space, projectId);
          const project = new HttpProject(schema);
          const folder = project.findFolder(f2.key) as ProjectFolder;
          
          const subFolders = folder.listFolders();
          assert.lengthOf(subFolders, 2, 'the parent folder has 2 folders');
          assert.deepEqual(subFolders[0].toJSON(), f1.toJSON());
        });
    
        it('moves a request into a position in a folder', async () => {
          const cmd = new Move(Move.command);
          await exeCommand(async () => {
            await cmd.run(r1.key, {
              space,
              project: projectId,
              env: helper.environment(),
              parent: f1.key,
              index: 1,
            });
          });
          
          const schema = await helper.sdk.project.read(space, projectId);
          const project = new HttpProject(schema);
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
              space,
              project: projectId,
              env: helper.environment(),
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
      });
    });
  });
});
