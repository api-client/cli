import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, Environment, Property } from '@api-client/core';
import fs from 'fs/promises';
import { exeCommand, findCommandOption, writeProject } from '../helpers/CliHelper.js';
import Add from '../../src/commands/project/variable/Add.js';

const projectPath = join('test', 'playground', 'project-variable-add');
const projectFile = join(projectPath, 'project-in.json');

describe('Project', () => {
  describe('File store', () => {
    describe('Variable', () => {
      describe('Add', () => {
        describe('Units', () => {

          let e1: Environment;

          before(async () => {
            const project = new HttpProject();
            e1 = project.addEnvironment('default');
            await writeProject(project, projectFile);
          });

          after(async () => {
            await fs.rm(projectPath, { recursive: true, force: true });
          });

          const name = 'v1';

          it('adds a variable', async () => {
            const result = await exeCommand(async () => {
              const cmd = new Add(Add.command);
              await cmd.run(e1.key, {
                in: projectFile,
                name,
              });
            });
            
            const project = new HttpProject(result);
            const env = project.definitions.environments[0];
            assert.lengthOf(env.variables, 1, 'has the variable');
            const v1 = env.variables[0] as Property;
            assert.equal(v1.name, 'v1', 'variable has the name');
          });

          it('adds the value', async () => {
            const result = await exeCommand(async () => {
              const cmd = new Add(Add.command);
              await cmd.run(e1.key, {
                in: projectFile,
                name,
                value: 'test',
              });
            });
            const project = new HttpProject(result);
            const env = project.definitions.environments[0];
            const v1 = env.variables[0] as Property;
            assert.equal(v1.value, 'test', 'variable has the test');
          });

          it('adds enabled', async () => {
            const result = await exeCommand(async () => {
              const cmd = new Add(Add.command);
              await cmd.run(e1.key, {
                in: projectFile,
                name,
                disabled: true,
              });
            });
            const project = new HttpProject(result);
            const env = project.definitions.environments[0];
            const v1 = env.variables[0] as Property;
            assert.isFalse(v1.enabled);
          });

          it('adds a numeric type', async () => {
            const result = await exeCommand(async () => {
              const cmd = new Add(Add.command);
              await cmd.run(e1.key, {
                in: projectFile,
                name,
                value: '5210',
                type: 'integer',
              });
            });
            const project = new HttpProject(result);
            const env = project.definitions.environments[0];
            assert.lengthOf(env.variables, 1, 'has the variable');
            const v1 = env.variables[0] as Property;
            assert.strictEqual(v1.value, 5210);
          });

          it('adds a boolean type', async () => {
            const result = await exeCommand(async () => {
              const cmd = new Add(Add.command);
              await cmd.run(e1.key, {
                in: projectFile,
                name,
                value: 'true',
                type: 'boolean',
              });
            });
            const project = new HttpProject(result);
            const env = project.definitions.environments[0];
            assert.lengthOf(env.variables, 1, 'has the variable');
            const v1 = env.variables[0] as Property;
            assert.strictEqual(v1.value, true);
          });

          it('outputs the project to a file', async () => {
            const out = join(projectPath, 'project-out.json');
            const cmd = new Add(Add.command);
            await cmd.run(e1.key, {
              in: projectFile,
              name,
              out,
            });
            const contents = await fs.readFile(out, 'utf8');
            const project = new HttpProject(contents);
            const env = project.definitions.environments[0];
            assert.lengthOf(env.variables, 1, 'has the variable');
            const v1 = env.variables[0] as Property;
            assert.strictEqual(v1.name, 'v1');
          });

          it('throws when the environment is not found', async () => {
            let e: Error | undefined;
            const cmd = new Add(Add.command);
            try {
              await cmd.run('test', {
                in: projectFile,
                name,
              });
            } catch (cause) {
              e = cause as Error;
            }
            assert.ok(e, 'has the error');
            if (e) {
              assert.equal(e.message, 'The environment "test" not found in the project.');
            }
          });

          it('throws when unknown type', async () => {
            let e: Error | undefined;
            const cmd = new Add(Add.command);
            try {
              await cmd.run(e1.key, {
                in: projectFile,
                name,
                value: 'x',
                type: 'unknown'
              });
            } catch (cause) {
              e = cause as Error;
            }
            assert.ok(e, 'has the error');
            if (e) {
              assert.equal(e.message, 'Unknown property type: "unknown".');
            }
          });
        });

        describe('#command', () => {
          it('adds global options', () => {
            const option = findCommandOption(Add.command, '--in');
            assert.ok(option, 'has a global option');
          });
      
          it('adds output options', () => {
            const option = findCommandOption(Add.command, '--out');
            assert.ok(option);
          });
      
          it('adds the name option', () => {
            const option = findCommandOption(Add.command, '--name');
            assert.ok(option);
            assert.equal(option.short, '-N', 'has the shortcut');
          });
      
          it('adds the value option', () => {
            const option = findCommandOption(Add.command, '--value');
            assert.ok(option);
            assert.equal(option.short, '-V', 'has the shortcut');
          });
      
          it('adds the disabled option', () => {
            const option = findCommandOption(Add.command, '--disabled');
            assert.ok(option);
            assert.equal(option.short, '-d', 'has the shortcut');
          });
        });
      });
    });
  });
});
