import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, IEnvironment } from '@api-client/core';
import fs from 'fs/promises';
import { CommanderError } from 'commander';
import { writeProject, exeCommand, findCommandOption, splitTable, cleanTerminalOutput } from '../helpers/CliHelper.js';
import Read from '../../src/commands/project/environment/Read.js';

const projectPath = join('test', 'playground', 'project-environment-read');
const projectInFile = join(projectPath, 'project.json');

// const cmdRoot = 'project environment';

describe('Project', () => {
  describe('Environment', () => {
    describe('Read', () => {
      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });

      it('prints a project level environment', async () => {
        const project = new HttpProject();
        const e1 = project.addEnvironment('e1');
        await writeProject(project, projectInFile);

        const cmd = new Read(Read.command);
        const result = await exeCommand(async () => {
          await cmd.run(e1.key, {
            in: projectInFile,
          });
        });
        const lines = splitTable(cleanTerminalOutput(result));

        const [key, name, variables, server] = lines;
        
        assert.include(name, 'name', 'has the "name" name');
        assert.include(name, 'e1', 'has the "name" value');

        assert.include(key, 'key', 'has the "key" name');
        assert.include(key, e1.key, 'has the "key" value');

        assert.include(variables, 'variables', 'has the "variables" name');
        assert.include(variables, '(none)', 'has the default "variables" value');

        assert.include(server, 'server', 'has the "server" name');
        assert.include(server, '(none)', 'has the default "server" value');
      });

      it('prints a folder level environment', async () => {
        const project = new HttpProject();
        const f1 = project.addFolder('f1');
        const e1 = f1.addEnvironment('e1');
        await writeProject(project, projectInFile);

        const cmd = new Read(Read.command);
        const result = await exeCommand(async () => {
          await cmd.run(e1.key, {
            in: projectInFile,
          });
        });
        const lines = splitTable(cleanTerminalOutput(result));
        const [key, name, variables, server] = lines;
        
        assert.include(name, 'name', 'has the "name" name');
        assert.include(name, 'e1', 'has the "name" value');

        assert.include(key, 'key', 'has the "key" name');
        assert.include(key, e1.key, 'has the "key" value');

        assert.include(variables, 'variables', 'has the "variables" name');
        assert.include(variables, '(none)', 'has the default "variables" value');

        assert.include(server, 'server', 'has the "server" name');
        assert.include(server, '(none)', 'has the default "server" value');
      });

      it('prints out the description', async () => {
        const project = new HttpProject();
        const e1 = project.addEnvironment('e1');
        e1.info.description = 'A test env';
        await writeProject(project, projectInFile);

        const cmd = new Read(Read.command);
        const result = await exeCommand(async () => {
          await cmd.run(e1.key, {
            in: projectInFile,
          });
        });
        const lines = splitTable(cleanTerminalOutput(result));
        const [, , description] = lines;
        
        assert.include(description, 'description', 'has the "description" name');
        assert.include(description, 'A test env', 'has the "description" value');
      });

      it('prints out the variables', async () => {
        const project = new HttpProject();
        const e1 = project.addEnvironment('e1');
        e1.addVariable('v1', '');
        e1.addVariable('v2', '');
        e1.addVariable('v3', '');
        await writeProject(project, projectInFile);

        const cmd = new Read(Read.command);
        const result = await exeCommand(async () => {
          await cmd.run(e1.key, {
            in: projectInFile,
          });
        });
        const lines = splitTable(cleanTerminalOutput(result));
        const [, , variables] = lines;
        
        assert.include(variables, 'variables', 'has the "variables" name');
        assert.include(variables, 'v1, v2, v3', 'has the "variables" value');
      });

      it('prints out the server URI', async () => {
        const project = new HttpProject();
        const e1 = project.addEnvironment('e1');
        e1.addServer('https://api.com');
        await writeProject(project, projectInFile);
        
        const cmd = new Read(Read.command);
        const result = await exeCommand(async () => {
          await cmd.run(e1.key, {
            in: projectInFile,
          });
        });
        const lines = splitTable(cleanTerminalOutput(result));
        const [, , , server] = lines;
        
        assert.include(server, 'server', 'has the "server" name');
        assert.include(server, 'https://api.com', 'has the "server" value');
      });

      it('prints a JSON for the environment', async () => {
        const project = new HttpProject();
        const e1 = project.addEnvironment('e1');
        await writeProject(project, projectInFile);

        const cmd = new Read(Read.command);
        const result = await exeCommand(async () => {
          await cmd.run(e1.key, {
            in: projectInFile,
            reporter: 'json',
          });
        });

        const env:IEnvironment = JSON.parse(result);
        assert.deepEqual(env, e1.toJSON())
      });

      it('prints a key for the environment', async () => {
        const project = new HttpProject();
        const e1 = project.addEnvironment('e1');
        await writeProject(project, projectInFile);
        const cmd = new Read(Read.command);
        const result = await exeCommand(async () => {
          await cmd.run(e1.key, {
            in: projectInFile,
            keyOnly: true,
          });
        });
        assert.equal(result.trim(), e1.key);
      });

      it('prints an error when environment is not found', async () => {
        const project = new HttpProject();
        await writeProject(project, projectInFile);
        
        const cmd = new Read(Read.command);

        let e: CommanderError | undefined;
        try {
          await cmd.run('unknown', {
            in: projectInFile,
          });
        } catch (cause) {
          e = cause as CommanderError;
        }
        assert.ok(e, 'has the error');
        if (e) {
          assert.equal(e.message, 'The environment "unknown" not found in the project.');
          assert.equal(e.code, 'ENOENV');
        }
      });
    });

    describe('#command', () => {
      it('adds global options', () => {
        const option = findCommandOption(Read.command, '--in');
        assert.ok(option, 'has a global option');
      });

      it('adds reporter options', () => {
        const option = findCommandOption(Read.command, '--reporter');
        assert.ok(option);
        assert.equal(option.short, '-r', 'has the short option');
      });

      it('adds key listing options', () => {
        const option = findCommandOption(Read.command, '--key-only');
        assert.ok(option);
        assert.equal(option.short, '-k', 'has the short option');
      });
    });

    // describe('Read', () => {
    //   const addCmd = `${cmdRoot} read`;
    //   after(async () => {
    //     await fs.rm(projectPath, { recursive: true, force: true });
    //   });

    //   it('prints a project level environment', async () => {
    //     const project = new HttpProject();
    //     const e1 = project.addEnvironment('e1');
    //     await writeProject(project, projectInFile);

    //     const result = await runCommand(`${addCmd} -i ${projectInFile} ${e1.key}`);
    //     const lines = splitTable(result);
    //     const [key, name, variables, server] = lines;
        
    //     assert.include(name, 'name', 'has the "name" name');
    //     assert.include(name, 'e1', 'has the "name" value');

    //     assert.include(key, 'key', 'has the "key" name');
    //     assert.include(key, e1.key, 'has the "key" value');

    //     assert.include(variables, 'variables', 'has the "variables" name');
    //     assert.include(variables, '(none)', 'has the default "variables" value');

    //     assert.include(server, 'server', 'has the "server" name');
    //     assert.include(server, '(none)', 'has the default "server" value');
    //   });

    //   it('prints a folder level environment', async () => {
    //     const project = new HttpProject();
    //     const f1 = project.addFolder('f1');
    //     const e1 = f1.addEnvironment('e1');
    //     await writeProject(project, projectInFile);

    //     const result = await runCommand(`${addCmd} -i ${projectInFile} ${e1.key}`);
    //     const lines = splitTable(result);
    //     const [key, name, variables, server] = lines;
        
    //     assert.include(name, 'name', 'has the "name" name');
    //     assert.include(name, 'e1', 'has the "name" value');

    //     assert.include(key, 'key', 'has the "key" name');
    //     assert.include(key, e1.key, 'has the "key" value');

    //     assert.include(variables, 'variables', 'has the "variables" name');
    //     assert.include(variables, '(none)', 'has the default "variables" value');

    //     assert.include(server, 'server', 'has the "server" name');
    //     assert.include(server, '(none)', 'has the default "server" value');
    //   });

    //   it('prints out the description', async () => {
    //     const project = new HttpProject();
    //     const e1 = project.addEnvironment('e1');
    //     e1.info.description = 'A test env';
    //     await writeProject(project, projectInFile);

    //     const result = await runCommand(`${addCmd} -i ${projectInFile} ${e1.key}`);
    //     const lines = splitTable(result);
    //     const [, , description] = lines;
        
    //     assert.include(description, 'description', 'has the "description" name');
    //     assert.include(description, 'A test env', 'has the "description" value');
    //   });

    //   it('prints out the variables', async () => {
    //     const project = new HttpProject();
    //     const e1 = project.addEnvironment('e1');
    //     e1.addVariable('v1', '');
    //     e1.addVariable('v2', '');
    //     e1.addVariable('v3', '');
    //     await writeProject(project, projectInFile);

    //     const result = await runCommand(`${addCmd} -i ${projectInFile} ${e1.key}`);
    //     const lines = splitTable(result);
    //     const [, , variables] = lines;
        
    //     assert.include(variables, 'variables', 'has the "variables" name');
    //     assert.include(variables, 'v1, v2, v3', 'has the "variables" value');
    //   });

    //   it('prints out the server URI', async () => {
    //     const project = new HttpProject();
    //     const e1 = project.addEnvironment('e1');
    //     e1.addServer('https://api.com');
    //     await writeProject(project, projectInFile);

    //     const result = await runCommand(`${addCmd} -i ${projectInFile} ${e1.key}`);
    //     const lines = splitTable(result);
    //     const [, , , server] = lines;
        
    //     assert.include(server, 'server', 'has the "server" name');
    //     assert.include(server, 'https://api.com', 'has the "server" value');
    //   });

    //   it('prints a JSON for the environment', async () => {
    //     const project = new HttpProject();
    //     const e1 = project.addEnvironment('e1');
    //     await writeProject(project, projectInFile);
        
    //     const result = await runCommand(`${addCmd} -i ${projectInFile} -r json ${e1.key}`);
    //     const env:IEnvironment = JSON.parse(result);
    //     assert.deepEqual(env, e1.toJSON())
    //   });

    //   it('prints a key for the environment', async () => {
    //     const project = new HttpProject();
    //     const e1 = project.addEnvironment('e1');
    //     await writeProject(project, projectInFile);

    //     const result = await runCommand(`${addCmd} -i ${projectInFile} -k ${e1.key}`);
    //     assert.equal(result, e1.key);
    //   });

    //   it('prints an error when environment is not found', async () => {
    //     const project = new HttpProject();
    //     await writeProject(project, projectInFile);
    //     const result = await runCommand(`${addCmd} -i ${projectInFile} "unknown"`, { includeError: true });
    //     assert.equal(result, '[ENOENV]: The environment "unknown" not found in the project.');
    //   });
    // });
  });
});
