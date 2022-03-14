import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, Environment, Property } from '@api-client/core';
import fs from 'fs/promises';
import { exeCommand, findCommandOption, writeProject } from '../helpers/CliHelper.js';
import Delete from '../../src/commands/project/variable/Delete.js';

const projectPath = join('test', 'playground', 'project-variable-delete');
const projectFile = join(projectPath, 'project-in.json');

describe('Project', () => {
  describe('File store', () => {
    describe('Variable', () => {
      describe('Delete', () => {
        describe('Units', () => {
        
          let e1: Environment;
          let v1: Property;
          let v2: Property;

          before(async () => {
            const project = new HttpProject();
            e1 = project.addEnvironment('e1');
            v1 = e1.addVariable('v1', 'val1');
            v2 = e1.addVariable('v2', 12345);
            
            await writeProject(project, projectFile);
          });

          after(async () => {
            await fs.rm(projectPath, { recursive: true, force: true });
          });

          it('removes a variable from the environment', async () => {
            const result = await exeCommand(async () => {
              const cmd = new Delete(Delete.command);
              await cmd.run(e1.key, v1.name, {
                in: projectFile,
              });
            });
            
            const project = new HttpProject(result);
            const env = project.definitions.environments[0];
            assert.lengthOf(env.variables, 1, 'has one variable');
            const remaining = env.variables[0] as Property;
            assert.deepEqual(remaining.toJSON(), v2.toJSON())
          });

          it('throws when the environment is not found', async () => {
            let e: Error | undefined;
            try {
              const cmd = new Delete(Delete.command);
              await cmd.run('some', v1.name, {
                in: projectFile,
              });
            } catch (cause) {
              e = cause as Error;
            }
            assert.ok(e, 'has the error');
            if (e) {
              assert.equal(e.message, 'The environment "some" not found in the project.');
            }
          });

          it('throws when the variable is not found', async () => {
            let e: Error | undefined;
            try {
              const cmd = new Delete(Delete.command);
              await cmd.run(e1.key, 'some', {
                in: projectFile,
              });
            } catch (cause) {
              e = cause as Error;
            }
            assert.ok(e, 'has the error');
            if (e) {
              assert.equal(e.message, 'The variable "some" not found in the environment.');
            }
          });

          it('saves the project in the output file', async () => {
            const out = join(projectPath, 'project-out.json');
            const cmd = new Delete(Delete.command);
            await cmd.run(e1.key, v1.name, {
              in: projectFile,
              out,
            });
            const contents = await fs.readFile(out, 'utf8');
            const project = new HttpProject(contents);
            const env = project.definitions.environments[0];
            assert.lengthOf(env.variables, 1, 'has one variable');
          });
        });

        describe('#command', () => {
          it('adds global options', () => {
            const option = findCommandOption(Delete.command, '--in');
            assert.ok(option, 'has a global option');
          });
      
          it('adds output options', () => {
            const option = findCommandOption(Delete.command, '--out');
            assert.ok(option);
          });

          it('adds the safe option', () => {
            const option = findCommandOption(Delete.command, '--safe');
            assert.ok(option);
            assert.equal(option.short, '-s', 'has the shortcut');
          });
        });
      });
    });
  });
});
