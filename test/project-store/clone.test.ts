import { assert } from 'chai';
import { HttpProject, ProjectFolder, ProjectRequest, StoreSdk, Workspace, TestCliHelper } from '@api-client/core';
import Clone from '../../src/commands/project/Clone.js';
import getSetup from '../helpers/getSetup.js';
import { SetupConfig } from '../helpers/interfaces.js';
import { IConfigEnvironment } from '../../src/lib/Config.js';

// const cmdRoot = 'project clone';

describe('Project', () => {
  let env: SetupConfig;
  let sdk: StoreSdk;
  let token: string;
  let space: string;

  before(async () => {
    env = await getSetup();
    sdk = new StoreSdk(env.singleUserBaseUri);
    const info = await sdk.auth.createSession();
    token = info.token;
    sdk.token = token;
    space = await sdk.space.create(Workspace.fromName('test'));
  });

  function environment(): IConfigEnvironment {
    return {
      key: 'test',
      name: 'default',
      source: 'net-store',
      authenticated: true,
      token,
      location: env.singleUserBaseUri,
    }
  }

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
          await sdk.project.create(space, sourceProject);
        });
    
        after(async () => {
          await sdk.project.delete(space, sourceProject.key);
        });
    
        it('clones a project', async () => {
          const cmd = new Clone(Clone.command);
          const result = await TestCliHelper.grabOutput(async () => {
            await cmd.run({
              space,
              env: environment(),
              project: sourceProject.key,
            });
          });
          const lines = TestCliHelper.splitLines(TestCliHelper.cleanTerminalOutput(result));
          const [key] = lines;
          assert.include(key, 'key', 'has the key line');
          assert.notInclude(key, sourceProject.key, 'has different key');

          const id = key.substring(3).trim();

          const info = await sdk.project.read(space, id);
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
