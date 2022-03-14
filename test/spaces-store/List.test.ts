import { assert } from 'chai';
import { TestCliHelper } from '@api-client/core';
import List from '../../src/commands/space/List.js';
import getSetup, { SetupConfig } from '../helpers/getSetup.js';
import { StoreHelper } from '../helpers/StoreHelper.js';

describe('Space', () => {
  let env: SetupConfig;
  let helper: StoreHelper;

  before(async () => {
    env = await getSetup();
    helper = new StoreHelper(env.singleUserBaseUri);
    await helper.initStore();
  });

  after(async () => {
    await helper.testDelete(`/test/reset/spaces`);
    await helper.testDelete(`/test/reset/sessions`);
  });

  describe('Store', () => {
    describe('List', () => {
      before(async () => {
        await helper.testPost('/test/generate/spaces?size=40');
      });

      it('prints the list of results', async () => {
        const cmd = new List(List.command);
        const result = await TestCliHelper.grabOutput(async () => {
          await cmd.run({
            env: helper.environment(),
          });
        });
        const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
        const [title, columns] = lines;
        assert.include(title, 'User spaces', 'has the table title');
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
          });
        });
        const lines1 = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result1));
        const cursor = lines1[lines1.length - 1].replace('Next page cursor:', '').trim();
        const result2 = await TestCliHelper.grabOutput(async () => {
          await cmd.run({
            env: helper.environment(),
            cursor,
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
