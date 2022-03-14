import { assert } from 'chai';
import { TestCliHelper, IWorkspace, IUser } from '@api-client/core';
import Add from '../../src/commands/space/user/Add.js';
import Delete from '../../src/commands/space/user/Delete.js';
import List from '../../src/commands/space/user/List.js';
import getSetup, { SetupConfig } from '../helpers/getSetup.js';
import { StoreHelper } from '../helpers/StoreHelper.js';

describe('Space', () => {
  let env: SetupConfig;
  let helper: StoreHelper;

  before(async () => {
    env = await getSetup();
    helper = new StoreHelper(env.multiUserBaseUri);
    await helper.initMultiUserStore();
  });

  after(async () => {
    await helper.testDelete(`/test/reset/spaces`);
    await helper.testDelete(`/test/reset/sessions`);
    await helper.testDelete(`/test/reset/users`);
  });

  describe('Store', () => {
    describe('Users', () => {
      describe('Add', () => {
        let user1Token: string;
        let space: IWorkspace;
        let user1: IUser;

        before(async () => {
          user1Token = await helper.createUserToken();
          const me = helper.sdk.getUrl('/users/me').toString();
          const user1Response = await helper.sdk.http.get(me, { token: user1Token });
          user1 = JSON.parse(user1Response.body as string) as IUser;
        });
        
        beforeEach(async () => {
          const generated = await helper.testPost('/test/generate/spaces?size=1');
          const created = JSON.parse(generated.body as string) as IWorkspace[];
          space = created[0];
        });

        it('adds a user to the user space', async () => {
          const cmd = new Add(Add.command);
          const result = await TestCliHelper.grabOutput(async () => {
            await cmd.run(user1.key, {
              env: helper.environment(),
              level: 'read',
              space: space.key,
            });
          });
          assert.equal(result.trim(), `The user ${user1.name} has been added to the space with the read access.`);
        });

        it('has the access to the space', async () => {
          const cmd = new Add(Add.command);
          await TestCliHelper.grabOutput(async () => {
            await cmd.run(user1.key, {
              env: helper.environment(),
              level: 'read',
              space: space.key,
            });
          });
          
          const spaceUrl = helper.sdk.getUrl(`/spaces/${space.key}`).toString();
          const response = await helper.sdk.http.get(spaceUrl, { token: user1Token });
          assert.equal(response.status, 200);
        });
      });

      describe('Delete', () => {
        let user1Token: string;
        let space: IWorkspace;
        let user1: IUser;

        before(async () => {
          user1Token = await helper.createUserToken();
          const me = helper.sdk.getUrl('/users/me').toString();
          const user1Response = await helper.sdk.http.get(me, { token: user1Token });
          user1 = JSON.parse(user1Response.body as string) as IUser;
        });
        
        beforeEach(async () => {
          const generated = await helper.testPost('/test/generate/spaces?size=1');
          const created = JSON.parse(generated.body as string) as IWorkspace[];
          space = created[0];
          await helper.sdk.space.patchUsers(space.key, [{
            uid: user1.key,
            op: 'add',
            value: 'read',
          }]);
        });

        it('prints the confirmation message', async () => {
          const cmd = new Delete(Delete.command);
          const result = await TestCliHelper.grabOutput(async () => {
            await cmd.run(user1.key, {
              env: helper.environment(),
              space: space.key,
            });
          });
          assert.equal(result.trim(), `The user ${user1.name} has been removed from the space.`);
        });

        it('has no access to the space', async () => {
          const cmd = new Delete(Delete.command);
          await TestCliHelper.grabOutput(async () => {
            await cmd.run(user1.key, {
              env: helper.environment(),
              space: space.key,
            });
          });
          
          const spaceUrl = helper.sdk.getUrl(`/spaces/${space.key}`).toString();
          const response = await helper.sdk.http.get(spaceUrl, { token: user1Token });
          assert.equal(response.status, 404);
        });
      });

      describe('List', () => {
        let user1Token: string;
        let user2Token: string;
        let space: IWorkspace;
        let user1: IUser;
        let user2: IUser;

        before(async () => {
          user1Token = await helper.createUserToken();
          user2Token = await helper.createUserToken();
          const me = helper.sdk.getUrl('/users/me').toString();
          const user1Response = await helper.sdk.http.get(me, { token: user1Token });
          const user2Response = await helper.sdk.http.get(me, { token: user2Token });
          user1 = JSON.parse(user1Response.body as string) as IUser;
          user2 = JSON.parse(user2Response.body as string) as IUser;
        });
        
        beforeEach(async () => {
          const generated = await helper.testPost('/test/generate/spaces?size=1');
          const created = JSON.parse(generated.body as string) as IWorkspace[];
          space = created[0];
          await helper.sdk.space.patchUsers(space.key, [
            {
              uid: user1.key,
              op: 'add',
              value: 'read',
            },
            {
              uid: user2.key,
              op: 'add',
              value: 'comment',
            }
          ]);
        });

        it('prints the space users', async () => {
          const cmd = new List(List.command);
          const result = await TestCliHelper.grabOutput(async () => {
            await cmd.run({
              env: helper.environment(),
              space: space.key,
            });
          });
          
          const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
          const [title, columns, u1, u2] = lines;
          assert.include(title, 'User space users', 'has the table title');
          assert.include(columns, 'Key', 'has the Key column');
          assert.include(columns, 'Name', 'has the Name column');
          assert.include(columns, 'Locale', 'has the Locale column');
          assert.include(columns, 'Access', 'has the Access column');
          assert.include(u1, user1.key, 'has the user #1 key');
          assert.include(u1, 'read', 'has the user #1 level');
          assert.include(u2, user2.key, 'has the user #2 key');
          assert.include(u2, 'comment', 'has the user #2 level');
        });
      });
    });
  });
});
