import { assert } from 'chai';
import { TestCliHelper, IUser } from '@api-client/core';
import List from '../../src/commands/users/List.js';
import getSetup, { SetupConfig } from '../helpers/getSetup.js';
import { StoreHelper } from '../helpers/StoreHelper.js';

describe('User', () => {
  let env: SetupConfig;
  let helper: StoreHelper;

  before(async () => {
    env = await getSetup();
    helper = new StoreHelper(env.multiUserBaseUri);
    await helper.initMultiUserStore();
  });

  after(async () => {
    await helper.testDelete(`/test/reset/sessions`);
    await helper.testDelete(`/test/reset/users`);
  });

  describe('Store', () => {
    describe('List', () => {
      // these users are added on top of the main user making the calls.
      // let user1Token: string;
      // let user2Token: string;
      let user0: IUser;
      // let user1: IUser;
      // let user2: IUser;

      before(async () => {
        await helper.createUserToken();
        await helper.createUserToken();
        // const me = helper.sdk.getUrl('/users/me').toString();
        // const user1Response = await helper.sdk.http.get(me, { token: user1Token });
        // const user2Response = await helper.sdk.http.get(me, { token: user2Token });
        user0 = await helper.sdk.user.me();
        // user1 = JSON.parse(user1Response.body as string) as IUser;
        // user2 = JSON.parse(user2Response.body as string) as IUser;
      });

      it('lists all users', async () => {
        const cmd = new List(List.command);
        const result = await TestCliHelper.grabOutput(async () => {
          await cmd.run({
            env: helper.environment(),
          });
        });
        
        const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
        const [title, columns, u1, u2, u3, cursor] = lines;
        assert.include(title, 'Store users', 'has the table title');
        assert.include(columns, 'Key', 'has the Key column');
        assert.include(columns, 'Name', 'has the Name column');
        assert.include(columns, 'Locale', 'has the Locale column');
        // users can be returned in any order. We could extract the key of each line and match them with the records
        // but if there are 3 records that means it is working.
        assert.ok(u1);
        assert.ok(u2);
        assert.ok(u3);
        // assert.include(u1, user0.key, 'has the user #0 key');
        // assert.include(u2, user1.key, 'has the user #1 key');
        // assert.include(u3, user2.key, 'has the user #1 key');
        assert.include(cursor, 'Next page cursor', 'has the next page cursor');
      });

      it('queries for specific data', async () => {
        const cmd = new List(List.command);
        const result = await TestCliHelper.grabOutput(async () => {
          await cmd.run({
            env: helper.environment(),
            query: user0.name,
          });
        });
        
        const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
        const [, , u1, u2] = lines;
        assert.include(u1, user0.key, 'has the user #0 key');
        assert.include(u2, 'Next page cursor:', 'has no more results');
      });
    });
  });
});
