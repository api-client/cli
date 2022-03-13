import { assert } from 'chai';
import { HttpProject, IProjectFolder, ProjectFolder, ProjectRequest, IProjectRequest, Environment, IEnvironment } from '@api-client/core';
import { exeCommand, splitTable, cleanTerminalOutput } from '../helpers/CliHelper.js';
import List, { ProjectTypes } from '../../src/commands/project/List.js';
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
    describe('list', () => {
      describe('folders', () => {
        const type: ProjectTypes = `folders`;

        describe('json', () => {
          let f2: ProjectFolder;
          let f3: ProjectFolder;
          let projectId: string;

          before(async () => {
            const project = HttpProject.fromName('test');
            project.addFolder('f1');
            f2 = project.addFolder('f2');
            f3 = f2.addFolder('f3');
            projectId = await helper.sdk.project.create(space, project);
          });

          it('lists folders of a project', async () => {
            const cmd = new List(List.command);
            const result = await exeCommand(async () => {
              await cmd.run(type, {
                space,
                project: projectId,
                env: helper.environment(),
                reporter: 'json',
              });
            });
            const data: IProjectFolder[] = JSON.parse(result);
            assert.typeOf(data, 'array', 'outputs an array');
            assert.lengthOf(data, 2, 'has all folders on the root');
            
            const [d1, d2] = data;
            assert.equal(d1.info.name, 'f1');
            assert.equal(d2.info.name, 'f2');
          });

          it('lists folders of a folder', async () => {
            const cmd = new List(List.command);
            const result = await exeCommand(async () => {
              await cmd.run(type, {
                space,
                project: projectId,
                env: helper.environment(),
                reporter: 'json',
                parent: f2.key,
              });
            });
            const data: IProjectFolder[] = JSON.parse(result);
            assert.typeOf(data, 'array', 'outputs an array');
            assert.lengthOf(data, 1, 'has the folder');
            
            const [d3] = data;
            assert.deepEqual(d3, f3.toJSON());
          });

          it('throws when unable to find the folder', async () => {
            let e: Error | undefined;
            const cmd = new List(List.command);
            try {
              await cmd.run(type, {
                space,
                project: projectId,
                env: helper.environment(),
                reporter: 'json',
                parent: 'test',
              });
            } catch (cause) {
              e = cause as Error;
            }
            assert.ok(e, 'has the error');
            if (e) {
              assert.equal(e.message, 'Unable to find the folder test.');
            }
          });
        });
      });

      describe('requests', () => {
        const type: ProjectTypes = `requests`;

        describe('json', () => {
          let f1: ProjectFolder;
          let f2: ProjectFolder;
          let r1: ProjectRequest;
          let r2: ProjectRequest;
          let r3: ProjectRequest;
          let r4: ProjectRequest;
          let projectId: string;
          before(async () => {
            const project = HttpProject.fromName('test');
            f1 = project.addFolder('with requests');
            f2 = project.addFolder('empty');
            r1 = project.addRequest('https://r1.com');
            r2 = f1.addRequest('https://r2.com');
            r3 = f1.addRequest('https://r3.com');
            r4 = f1.addRequest('https://r4.com');
            projectId = await helper.sdk.project.create(space, project);
          });

          it('lists requests of a project', async () => {
            const cmd = new List(List.command);
            const result = await exeCommand(async () => {
              await cmd.run(type, {
                space,
                project: projectId,
                env: helper.environment(),
                reporter: 'json',
              });
            });
            
            const data: IProjectRequest[] = JSON.parse(result);
            assert.typeOf(data, 'array', 'outputs an array');
            assert.lengthOf(data, 1, 'has all requests on the root');
            
            const [d1] = data;
            assert.equal(d1.expects.url, r1.expects.url);
          });

          it('lists requests of a folder', async () => {
            const cmd = new List(List.command);
            const result = await exeCommand(async () => {
              await cmd.run(type, {
                space,
                project: projectId,
                env: helper.environment(),
                reporter: 'json',
                parent: f1.key,
              });
            });
            
            const data: IProjectRequest[] = JSON.parse(result);
            assert.typeOf(data, 'array', 'outputs an array');
            assert.lengthOf(data, 3, 'has all requests');
            
            const [d2, d3, d4] = data;
            assert.deepEqual(d2, r2.toJSON());
            assert.deepEqual(d3, r3.toJSON());
            assert.deepEqual(d4, r4.toJSON());
          });

          it('returns an empty array when no requests', async () => {
            const cmd = new List(List.command);
            const result = await exeCommand(async () => {
              await cmd.run(type, {
                space,
                project: projectId,
                env: helper.environment(),
                reporter: 'json',
                parent: f2.key,
              });
            });
            
            const data: IProjectRequest[] = JSON.parse(result);
            assert.typeOf(data, 'array', 'outputs an array');
            assert.lengthOf(data, 0, 'has no requests');
          });

          it('throws when unable to find the folder', async () => {
            let e: Error | undefined;
            const cmd = new List(List.command);
            try {
              await cmd.run(type, {
                space,
                project: projectId,
                env: helper.environment(),
                reporter: 'json',
                parent: 'test',
              });
            } catch (cause) {
              e = cause as Error;
            }
            assert.ok(e, 'has the error');
            if (e) {
              assert.equal(e.message, 'Unable to find the folder test.');
            }
          });
        });
      });

      describe('environments', () => {
        const type: ProjectTypes = `environments`;

        describe('json', () => {
          let f1: ProjectFolder;
          let f2: ProjectFolder;
          let e1: Environment;
          let e2: Environment;
          let e3: Environment;
          let projectId: string;
          before(async () => {
            const project = HttpProject.fromName('test');
            f1 = project.addFolder('with environments');
            f2 = project.addFolder('empty');
            e1 = project.addEnvironment('My project environment');
            e2 = f1.addEnvironment('My folder environment');
            e3 = f1.addEnvironment('Env 2');
            e3.addVariable('test', 'value');
            e3.addServer('https://api.com');
            projectId = await helper.sdk.project.create(space, project);
          });

          it('lists environments of a project', async () => {
            const cmd = new List(List.command);
            const result = await exeCommand(async () => {
              await cmd.run(type, {
                space,
                project: projectId,
                env: helper.environment(),
                reporter: 'json',
              });
            });
            const data: IEnvironment[] = JSON.parse(result);
            assert.typeOf(data, 'array', 'outputs an array');
            assert.lengthOf(data, 1, 'has all environments on the root');
            
            const [d1] = data;
            assert.deepEqual(d1, e1.toJSON());
          });

          it('lists environments of a folder', async () => {
            const cmd = new List(List.command);
            const result = await exeCommand(async () => {
              await cmd.run(type, {
                space,
                project: projectId,
                env: helper.environment(),
                reporter: 'json',
                parent: f1.key,
              });
            });
            
            const data: IEnvironment[] = JSON.parse(result);
            assert.typeOf(data, 'array', 'outputs an array');
            assert.lengthOf(data, 2, 'has all environments');
            
            const [d2, d3] = data;
            assert.deepEqual(d2, e2.toJSON());
            assert.deepEqual(d3, e3.toJSON());
          });

          it('returns an empty array when no environments', async () => {
            const cmd = new List(List.command);
            const result = await exeCommand(async () => {
              await cmd.run(type, {
                space,
                project: projectId,
                env: helper.environment(),
                reporter: 'json',
                parent: f2.key,
              });
            });
            
            const data: IEnvironment[] = JSON.parse(result);
            assert.typeOf(data, 'array', 'outputs an array');
            assert.lengthOf(data, 0, 'has no requests');
          });
        });
      });

      describe('children', () => {
        const type: ProjectTypes = `children`;

        describe('table', () => {
          let f1: ProjectFolder;
          let f2: ProjectFolder;
          let f3: ProjectFolder;
          let r1: ProjectRequest;
          let r2: ProjectRequest;
          let r3: ProjectRequest;
          let r4: ProjectRequest;
          let projectId: string;
          before(async () => {
            const project = HttpProject.fromName('test');
            f1 = project.addFolder('with children');
            f2 = project.addFolder('empty');
            r1 = project.addRequest('https://r1.com');
            r2 = f1.addRequest('https://r2.com');
            r3 = f1.addRequest('https://r3.com');
            r4 = f1.addRequest('https://r4.com');
            f3 = f1.addFolder('sub-folder');
            projectId = await helper.sdk.project.create(space, project);
          });

          it('lists children of a project', async () => {
            const cmd = new List(List.command);
            const result = await exeCommand(async () => {
              await cmd.run(type, {
                space,
                project: projectId,
                env: helper.environment(),
                reporter: 'table',
              });
            });
            const lines = splitTable(cleanTerminalOutput(result));
            
            const [headers, d1, d2, d3] = lines;
            assert.include(headers, 'Kind', 'table has the Kind column');
            assert.include(headers, 'Key', 'table has the Key column');
            assert.include(headers, 'Name', 'table has the Name column');
            assert.include(d1, f1.key, 'has the first folder');
            assert.include(d2, f2.key, 'has the second folder');
            assert.include(d3, r1.key, 'has the request');
          });

          it('lists children of a folder', async () => {
            const cmd = new List(List.command);
            const result = await exeCommand(async () => {
              await cmd.run(type, {
                space,
                project: projectId,
                env: helper.environment(),
                reporter: 'table',
                parent: f1.key,
              });
            });
            const lines = splitTable(cleanTerminalOutput(result));
            
            const [, d1, d2, d3, d4] = lines;
            assert.include(d1, r2.key, 'has the first request');
            assert.include(d2, r3.key, 'has the second request');
            assert.include(d3, r4.key, 'has the third request');
            assert.include(d4, f3.key, 'has the third request');
          });

          it('lists children of an empty folder', async () => {
            const cmd = new List(List.command);
            const result = await exeCommand(async () => {
              await cmd.run(type, {
                space,
                project: projectId,
                env: helper.environment(),
                reporter: 'table',
                parent: f2.key,
              });
            });
            const lines = splitTable(cleanTerminalOutput(result));
            
            assert.lengthOf(lines, 1);
          });
        });
      });
    });
  });
});
