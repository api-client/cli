import { assert } from 'chai';
import { HttpProject, ProjectFolder, ProjectRequest, TestCliHelper } from '@api-client/core';
import Clone from '../../src/commands/project/Clone.js';
import getSetup, { SetupConfig } from '../helpers/getSetup.js';
import { StoreHelper } from '../helpers/StoreHelper.js';

describe('Project', () => {
  let env: SetupConfig;
  let space: string;
  let helper: StoreHelper;

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
    describe('clone', () => {
      describe('Units', () => {
        let f1: ProjectFolder;
        let r1: ProjectRequest;
        let sourceProject: HttpProject;
        
        before(async () => {
          sourceProject = HttpProject.fromName('test');
          f1 = sourceProject.addFolder('folder 1');
          r1 = sourceProject.addRequest('https://r1.com');
          await helper.sdk.project.create(space, sourceProject);
        });
    
        after(async () => {
          await helper.sdk.project.delete(space, sourceProject.key);
        });
    
        it('clones a project', async () => {
          const cmd = new Clone(Clone.command);
          const result = await TestCliHelper.grabOutput(async () => {
            await cmd.run({
              space,
              env: helper.environment(),
              project: sourceProject.key,
            });
          });
          const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
          const [key] = lines;
          assert.include(key, 'key', 'has the key line');
          assert.notInclude(key, sourceProject.key, 'has different key');

          const id = key.substring(3).trim();

          const info = await helper.sdk.project.read(space, id);
          const project = new HttpProject(info);

          const df1 = project.findFolder(f1.info.name as string) as ProjectFolder;
          assert.ok(df1, 'has folder 1');
          assert.notEqual(df1.key, f1.key, 'folder 1 as a new key');

          const dr1 = project.findRequest(r1.expects.url as string) as ProjectRequest;
          assert.ok(dr1, 'has request 1');
          assert.notEqual(dr1.key, r1.key, 'request 1 as a new key');
        });
      });
    });
  });
});
