import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder, Server } from '@api-client/core';
import fs from 'fs/promises';
import { writeProject, exeCommand, findCommandOption } from '../helpers/CliHelper.js';
import Add from '../../src/commands/project/environment/Add.js';

const projectPath = join('test', 'playground', 'project-environment-add');
const projectInFile = join(projectPath, 'project-in.json');
const projectOutFile = join(projectPath, 'project-out.json');

// const cmdRoot = 'project environment';

describe('Project', () => {
  describe('File store', () => {
    describe('Environment', () => {
      describe('Add', () => {
        let f1: ProjectFolder;

        before(async () => {
          const project = new HttpProject();
          f1 = project.addFolder('f1');
          await writeProject(project, projectInFile);
        });
  
        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });

        const envName = 'test-env';

        it('adds an environment to the project', async () => {
          const name = envName;
          const cmd = new Add(Add.command);
          const result = await exeCommand(async () => {
            await cmd.run(name, {
              in: projectInFile,
            });
          });
          const project = new HttpProject(result);
          const { environments } = project.definitions;
          assert.lengthOf(environments, 1, 'project has the environment');
          const [env] = environments;
          assert.equal(env.info.name as string, 'test-env');
          assert.isUndefined(env.info.description);
          assert.deepEqual(env.variables, []);
          assert.isUndefined(env.server);
        });

        it('adds an environment to a folder', async () => {
          const cmd = new Add(Add.command);
          const result = await exeCommand(async () => {
            await cmd.run(envName, {
              in: projectInFile,
              parent: f1.key,
            });
          });
          const project = new HttpProject(result);
          assert.lengthOf(project.environments, 0, 'project has no environment');
  
          const folder = project.findFolder(f1.key) as ProjectFolder;
          const environments = folder.getEnvironments();
          const [env] = environments;
          assert.equal(env.info.name as string, 'test-env');
          assert.isUndefined(env.info.description);
          assert.deepEqual(env.variables, []);
          assert.isUndefined(env.server);
        });

        it('adds the description', async () => {
          const cmd = new Add(Add.command);
          const result = await exeCommand(async () => {
            await cmd.run(envName, {
              in: projectInFile,
              description: 'My environment',
            });
          });
          const project = new HttpProject(result);
          const { environments } = project.definitions;
          const [env] = environments;
          assert.equal(env.info.description as string, 'My environment');
        });
  
        it('adds the base URI', async () => {
          const cmd = new Add(Add.command);
          const result = await exeCommand(async () => {
            await cmd.run(envName, {
              in: projectInFile,
              baseUri: 'api.com',
            });
          });
          const project = new HttpProject(result);
          const { environments } = project.definitions;
          const [env] = environments;
          assert.ok(env.server, 'has the server');
          const srv = env.server as Server;
          assert.equal(srv.uri as string, 'api.com');
        });
  
        it('adds the protocol', async () => {
          const cmd = new Add(Add.command);
          const result = await exeCommand(async () => {
            await cmd.run(envName, {
              in: projectInFile,
              baseUri: 'api.com',
              protocol: 'https:',
            });
          });
          const project = new HttpProject(result);
          const { environments } = project.definitions;
          const [env] = environments;
          assert.ok(env.server, 'has the server');
          const srv = env.server as Server;
          assert.equal(srv.protocol as string, 'https:');
        });
  
        it('adds the base path', async () => {
          const cmd = new Add(Add.command);
          const result = await exeCommand(async () => {
            await cmd.run(envName, {
              in: projectInFile,
              baseUri: 'api.com',
              basePath: '/v2/api',
            });
          });
          const project = new HttpProject(result);
          const { environments } = project.definitions;
          const [env] = environments;
          assert.ok(env.server, 'has the server');
          const srv = env.server as Server;
          assert.equal(srv.basePath as string, '/v2/api');
        });
  
        it('adds server description', async () => {
          const cmd = new Add(Add.command);
          const result = await exeCommand(async () => {
            await cmd.run(envName, {
              in: projectInFile,
              serverDescription: 'My API server',
            });
          });
          const project = new HttpProject(result);
          const { environments } = project.definitions;
          const [env] = environments;
          assert.ok(env.server, 'has the server');
          const srv = env.server as Server;
          assert.equal(srv.description as string, 'My API server');
        });
  
        it('outputs to a file', async () => {
          const cmd = new Add(Add.command);
          const result = await exeCommand(async () => {
            await cmd.run(envName, {
              in: projectInFile,
              out: projectOutFile,
            });
          });
          assert.isEmpty(result);
          
          const content = await fs.readFile(projectOutFile, 'utf8');
          const project = new HttpProject(content);
          const { environments } = project.definitions;
          assert.lengthOf(environments, 1, 'project has the environment');
        });
      });

      describe('#command', () => {
        it('adds global options', () => {
          const option = findCommandOption(Add.command, '--in');
          assert.ok(option, 'has a global option');
        });

        it('adds parent searching options', () => {
          const option = findCommandOption(Add.command, '--parent');
          assert.ok(option);
        });

        it('adds output options', () => {
          const option = findCommandOption(Add.command, '--out');
          assert.ok(option);
        });

        it('adds the description option', () => {
          const option = findCommandOption(Add.command, '--description');
          assert.ok(option);
          assert.isUndefined(option.short, 'has no short name');
        });

        it('adds the base-uri option', () => {
          const option = findCommandOption(Add.command, '--base-uri');
          assert.ok(option);
          assert.isUndefined(option.short, 'has no short name');
        });

        it('adds the base-path option', () => {
          const option = findCommandOption(Add.command, '--base-path');
          assert.ok(option);
          assert.isUndefined(option.short, 'has no short name');
        });

        it('adds the protocol option', () => {
          const option = findCommandOption(Add.command, '--protocol');
          assert.ok(option);
          assert.isUndefined(option.short, 'has no short name');
        });

        it('adds the server-description option', () => {
          const option = findCommandOption(Add.command, '--server-description');
          assert.ok(option);
          assert.isUndefined(option.short, 'has no short name');
        });
      });
    });

    // describe('Add', () => {
    //   const finalCmd = `${cmdRoot} add`;
    //   let f1: ProjectFolder;

    //   before(async () => {
    //     const project = new HttpProject();
    //     f1 = project.addFolder('f1');
    //     await writeProject(project, projectInFile);
    //   });

    //   after(async () => {
    //     await fs.rm(projectPath, { recursive: true, force: true });
    //   });

    //   it('adds an environment to the project', async () => {
    //     const result = await runCommand(`${finalCmd} -i ${projectInFile} "test env"`);
        
    //     const project = new HttpProject(result);
    //     const { environments } = project.definitions;
    //     assert.lengthOf(environments, 1, 'project has the environment');
    //     const [env] = environments;
    //     assert.equal(env.info.name as string, 'test env');
    //     assert.isUndefined(env.info.description);
    //     assert.deepEqual(env.variables, []);
    //     assert.isUndefined(env.server);
    //   });

    //   it('adds an environment to a folder', async () => {
    //     const result = await runCommand(`${finalCmd} -i ${projectInFile} -p ${f1.key} "test env"`);
        
    //     const project = new HttpProject(result);
    //     assert.lengthOf(project.environments, 0, 'project has no environment');

    //     const folder = project.findFolder(f1.key) as ProjectFolder;
    //     const environments = folder.getEnvironments();
    //     const [env] = environments;
    //     assert.equal(env.info.name as string, 'test env');
    //     assert.isUndefined(env.info.description);
    //     assert.deepEqual(env.variables, []);
    //     assert.isUndefined(env.server);
    //   });

    //   it('adds the description', async () => {
    //     const result = await runCommand(`${finalCmd} -i ${projectInFile} "test env" --description "My environment"`);
    //     const project = new HttpProject(result);
    //     const { environments } = project.definitions;
    //     const [env] = environments;
    //     assert.equal(env.info.description as string, 'My environment');
    //   });

    //   it('adds the base URI', async () => {
    //     const result = await runCommand(`${finalCmd} -i ${projectInFile} "test env" --base-uri "api.com"`);
    //     const project = new HttpProject(result);
    //     const { environments } = project.definitions;
    //     const [env] = environments;
    //     assert.ok(env.server, 'has the server');
    //     const srv = env.server as Server;
    //     assert.equal(srv.uri as string, 'api.com');
    //   });

    //   it('adds the protocol', async () => {
    //     const result = await runCommand(`${finalCmd} -i ${projectInFile} "test env" --base-uri "api.com" --protocol "https:"`);
    //     const project = new HttpProject(result);
    //     const { environments } = project.definitions;
    //     const [env] = environments;
    //     assert.ok(env.server, 'has the server');
    //     const srv = env.server as Server;
    //     assert.equal(srv.protocol as string, 'https:');
    //   });

    //   it('adds the base path', async () => {
    //     const result = await runCommand(`${finalCmd} -i ${projectInFile} "test env" --base-uri "api.com" --base-path "/v2/api"`);
    //     const project = new HttpProject(result);
    //     const { environments } = project.definitions;
    //     const [env] = environments;
    //     assert.ok(env.server, 'has the server');
    //     const srv = env.server as Server;
    //     assert.equal(srv.basePath as string, '/v2/api');
    //   });

    //   it('adds server description', async () => {
    //     const result = await runCommand(`${finalCmd} -i ${projectInFile} "test env" --server-description "My API server"`);
    //     const project = new HttpProject(result);
    //     const { environments } = project.definitions;
    //     const [env] = environments;
    //     assert.ok(env.server, 'has the server');
    //     const srv = env.server as Server;
    //     assert.equal(srv.description as string, 'My API server');
    //   });

    //   it('outputs to a file', async () => {
    //     await runCommand(`${finalCmd} -i ${projectInFile} -o ${projectOutFile} "test env"`);
        
    //     const content = await fs.readFile(projectOutFile, 'utf8');
    //     const project = new HttpProject(content);
    //     const { environments } = project.definitions;
    //     assert.lengthOf(environments, 1, 'project has the environment');
    //   });
    // });
  });
});
