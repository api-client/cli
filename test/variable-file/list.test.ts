import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, Environment, IProperty } from '@api-client/core';
import fs from 'fs/promises';
import { findCommandOption, writeProject, exeCommand, splitTable, cleanTerminalOutput } from '../helpers/CliHelper.js';
import List from '../../src/commands/project/variable/List.js';

const projectPath = join('test', 'playground', 'project-variable-list');
const projectFile = join(projectPath, 'project-in.json');

describe('Project', () => {
  describe('File store', () => {
    describe('Variable', () => {
      describe('List', () => {
        describe('Units', () => {
        
          let e1: Environment;
          let e2: Environment;

          before(async () => {
            const project = new HttpProject();
            
            e1 = project.addEnvironment('e1');
            e1.addVariable('v1', 'val1');
            const var2 = e1.addVariable('v2', 12345);
            var2.enabled = false;

            const f1 = project.addFolder('f1');
            e2 = f1.addEnvironment('e2');
            
            await writeProject(project, projectFile);
          });

          after(async () => {
            await fs.rm(projectPath, { recursive: true, force: true });
          });

          it('lists variables in an environment without values', async () => {
            const result = await exeCommand(async () => {
              const cmd = new List(List.command);
              await cmd.run(e1.key, {
                in: projectFile,
              });
            });
            const lines = splitTable(cleanTerminalOutput(result));
            
            const [title, headers, d1, d2, d3] = lines;
            assert.include(title, 'Environment variables', 'has the title');
            assert.include(headers, 'Value', 'has the headers #1');
            assert.include(d1, 'v1', 'has the variable name #1');
            assert.include(d1, '***', 'has the variable value #1');
            assert.include(d1, 'string', 'has the variable type #1');
            assert.include(d1, 'true', 'has the variable enabled #1');

            assert.include(d2, 'v2', 'has the variable name #2');
            assert.include(d2, '***', 'has the variable value #2');
            assert.include(d2, 'integer', 'has the variable type #2');
            assert.include(d2, 'false', 'has the variable enabled #2');
            assert.isUndefined(d3, 'has no more values #2');
          });

          it('lists variables with values', async () => {
            const result = await exeCommand(async () => {
              const cmd = new List(List.command);
              await cmd.run(e1.key, {
                in: projectFile,
                showValues: true,
              });
            });
            const lines = splitTable(cleanTerminalOutput(result));
            
            const [title, headers, d1, d2, d3] = lines;
            assert.include(title, 'Environment variables', 'has the title');
            assert.include(headers, 'Value', 'has the headers #1');
            assert.include(d1, 'v1', 'has the variable name #1');
            assert.include(d1, 'val1', 'has the variable value #1');
            assert.include(d1, 'string', 'has the variable type #1');
            assert.include(d1, 'true', 'has the variable enabled #1');

            assert.include(d2, 'v2', 'has the variable name #2');
            assert.include(d2, '12345', 'has the variable value #2');
            assert.include(d2, 'integer', 'has the variable type #2');
            assert.include(d2, 'false', 'has the variable enabled #2');
            assert.isUndefined(d3, 'has no more values #2');
          });

          it('lists empty table when values missing', async () => {
            const result = await exeCommand(async () => {
              const cmd = new List(List.command);
              await cmd.run(e2.key, {
                in: projectFile,
              });
            });
            const lines = splitTable(cleanTerminalOutput(result));
            
            const [title, headers, d1] = lines;
            assert.include(title, 'Environment variables', 'has the title');
            assert.include(headers, 'Value', 'has the headers');

            assert.isUndefined(d1, 'has no more values');
          });

          it('throws when folder is not found', async () => {
            let e: Error | undefined;
            try {
              const cmd = new List(List.command);
              await cmd.run('some', {
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

          it('uses the JSON reporter and masks values', async () => {
            const result = await exeCommand(async () => {
              const cmd = new List(List.command);
              await cmd.run(e1.key, {
                in: projectFile,
                reporter: 'json',
              });
            });
            const data: IProperty[] = JSON.parse(result);
            const prop = data[0];
            const compare = e1.variables[0].toJSON();
            assert.equal(prop.name, compare.name);
            assert.equal(prop.value, '***');
          });

          it('uses the JSON reporter and renders values', async () => {
            const result = await exeCommand(async () => {
              const cmd = new List(List.command);
              await cmd.run(e1.key, {
                in: projectFile,
                reporter: 'json',
                showValues: true,
              });
            });
            const data: IProperty[] = JSON.parse(result);
            assert.deepEqual(data[0], e1.variables[0].toJSON());
          });
        });

        describe('#command', () => {
          it('adds global options', () => {
            const option = findCommandOption(List.command, '--in');
            assert.ok(option, 'has a global option');
          });
    
          it('adds reporter options', () => {
            const option = findCommandOption(List.command, '--reporter');
            assert.ok(option);
            assert.equal(option.short, '-r', 'has the short option');
          });
    
          it('adds parent listing options', () => {
            const option = findCommandOption(List.command, '--parent');
            assert.ok(option);
            assert.equal(option.short, '-p', 'has the short option');
          });
    
          it('has the show-values option', () => {
            const option = findCommandOption(List.command, '--show-values');
            assert.ok(option);
            assert.isUndefined(option.short, 'has no short option');
          });
        });
      });
    });
  });
});
