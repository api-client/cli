import { assert } from 'chai';
import { TestCliHelper, Workspace, HttpProject } from '@api-client/core';
import Add from '../../src/commands/space/project/Add.js';
import Delete from '../../src/commands/space/project/Delete.js';
import List from '../../src/commands/space/project/List.js';
import Read from '../../src/commands/space/project/Read.js';
import getSetup, { SetupConfig } from '../helpers/getSetup.js';
import { StoreHelper } from '../helpers/StoreHelper.js';

describe('Space', () => {
  let env: SetupConfig;
  let helper: StoreHelper;
  let space: string;

  before(async () => {
    env = await getSetup();
    helper = new StoreHelper(env.multiUserBaseUri);
    await helper.initMultiUserStore();
    space = await helper.sdk.space.create(Workspace.fromName('test'));
  });

  after(async () => {
    await helper.testDelete(`/test/reset/spaces`);
    await helper.testDelete(`/test/reset/sessions`);
    await helper.testDelete(`/test/reset/projects`);
  });

  describe('Store', () => {
    describe('Projects', () => {
      describe('Add', () => {
        const name = 'test api';

        it('creates a project in a space', async () => {
          const cmd = new Add(Add.command);
          const result = await TestCliHelper.grabOutput(async () => {
            await cmd.run(name, {
              space,
              env: helper.environment(),
            });
          });
          const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
          const [key, oName, environments, folders, requests, schemes] = lines;
          assert.include(key, 'key');
          assert.include(oName, name);
          assert.include(environments, '(none)');
          assert.include(folders, '(none)');
          assert.include(requests, '(none)');
          assert.include(schemes, '(none)');
        });

        it('adds the version information', async () => {
          const cmd = new Add(Add.command);
          const result = await TestCliHelper.grabOutput(async () => {
            await cmd.run(name, {
              space,
              env: helper.environment(),
              projectVersion: '0.1.0',
            });
          });
          const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
          const id = lines[0].substring(3).trim();
          const info = await helper.sdk.project.read(space, id);
          assert.equal(info.info.version as string, '0.1.0');
        });
      });

      describe('Delete', () => {
        let id: string;
        beforeEach(async () => {
          const project = HttpProject.fromName('test project');
          id = await helper.sdk.project.create(space, project);
        });

        it('prints the confirmation message', async () => {
          const cmd = new Delete(Delete.command);
          const result = await TestCliHelper.grabOutput(async () => {
            await cmd.run(id, {
              env: helper.environment(),
              space,
            });
          });
          assert.equal(result.trim(), `The project has been deleted from the space.`);
        });

        it('the user has no access to the store', async () => {
          const cmd = new Delete(Delete.command);
          await TestCliHelper.grabOutput(async () => {
            await cmd.run(id, {
              env: helper.environment(),
              space,
            });
          });
          const response = await helper.sdk.http.get(helper.sdk.getUrl(`/spaces/${space}/projects/${id}`).toString());
          assert.equal(response.status, 404, `The project request responds with 404.`);
        });
      });

      describe('Read', () => {
        let id: string;
        before(async () => {
          const project = HttpProject.fromName('test project');
          id = await helper.sdk.project.create(space, project);
        });

        it('prints the project info', async () => {
          const cmd = new Read(Read.command);
          const result = await TestCliHelper.grabOutput(async () => {
            await cmd.run(id, {
              env: helper.environment(),
              space,
            });
          });
          const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
          const [key, name] = lines;
          assert.include(key, id, 'prints the project key');
          assert.include(name, 'test project', 'prints the project name');
        });

        it('throws when the project is not found', async () => {
          const cmd = new Read(Read.command);
          let e: Error | undefined;
          try {
            await cmd.run('other', {
              env: helper.environment(),
              space,
            });
          } catch (cause) {
            e = cause as Error;
          }
          assert.ok(e, 'has the error');
          if (e) {
            assert.equal(e.message, 'Not found.');
          }
        });
      });
      
      describe('List', () => {
        before(async () => {
          await helper.testPost(`/test/generate/projects/${space}?size=40`);
        });

        it('returns results and the page token', async () => {
          const cmd = new List(List.command);
          const result = await TestCliHelper.grabOutput(async () => {
            await cmd.run({
              env: helper.environment(),
              space,
            });
          });
          const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
          const [title, columns] = lines;
          assert.include(title, 'User space projects', 'has the table title');
          assert.include(columns, 'Key', 'has the table columns');
          // title + columns + 35 results + the page token.
          assert.lengthOf(lines, 38, 'has all results');
          assert.include(lines[lines.length - 1], 'Next page cursor:');
        });

        it('supports the limit parameter', async () => {
          const cmd = new List(List.command);
          const result = await TestCliHelper.grabOutput(async () => {
            await cmd.run({
              env: helper.environment(),
              limit: 4,
              space,
            });
          });
          const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
          // title + columns + 4 results + the page token.
          assert.lengthOf(lines, 7, 'has all results');
        });
  
        it('paginates to the next page', async () => {
          const cmd = new List(List.command);
          const result1 = await TestCliHelper.grabOutput(async () => {
            await cmd.run({
              env: helper.environment(),
              limit: 2,
              space,
            });
          });
          const lines1 = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result1));
          const cursor = lines1[lines1.length - 1].replace('Next page cursor:', '').trim();
          const result2 = await TestCliHelper.grabOutput(async () => {
            await cmd.run({
              env: helper.environment(),
              cursor,
              space,
            });
          });
          const lines2 = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result2));
          // title + columns + 2 results from the page token + the page token.
          assert.lengthOf(lines2, 5, 'has all results');
          // last list item from the list 1 is not the same as the first from the list 2
          assert.notEqual(lines1[3], lines2[2], 'proceeds to the next results page');
        });
      });
    });
  });
});
