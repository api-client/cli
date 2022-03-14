import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, IEnvironment } from '@api-client/core';
import fs from 'fs/promises';
import { writeProject, exeCommand, findCommandOption, splitTable, cleanTerminalOutput } from '../helpers/CliHelper.js';
import Find from '../../src/commands/project/environment/Find.js';

const projectPath = join('test', 'playground', 'project-environment-find');
const projectInFile = join(projectPath, 'project.json');

describe('Project', () => {
  describe('File store', () => {
    describe('Environment', () => {
      describe('Find', () => {
        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });
  
        it('searches for environments in the name filed', async () => {
          const project = new HttpProject();
          const f1 = project.addFolder('f1');
          const e1 = project.addEnvironment('a name 1')
          const e2 = f1.addEnvironment('names in environment')
          project.addEnvironment('another 3');
          await writeProject(project, projectInFile);
  
          const query = 'nam';
          const cmd = new Find(Find.command);
          const result = await exeCommand(async () => {
            await cmd.run(query, {
              in: projectInFile,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [title, headers, d1, d2, d3] = lines;
          assert.include(title, 'Project environments', 'table has the title');
          assert.include(headers, 'Key', 'table has the column names');
          assert.include(d1, e2.key, 'has the first environment');
          assert.include(d2, e1.key, 'has the second environment');
          assert.isUndefined(d3, 'has no more results');
        });
  
        it('searches for environments in the description filed', async () => {
          const project = new HttpProject();
          const f1 = project.addFolder('f1');
          const e1 = project.addEnvironment('e1');
          const e2 = f1.addEnvironment('e2');
          const e3 = f1.addEnvironment('e3');
          e1.info.description = 'An environment number 1';
          e2.info.description = 'An environment with orders';
          e3.info.description = 'Store for pets';
          await writeProject(project, projectInFile);
  
          const query = 'order';
          const cmd = new Find(Find.command);
          const result = await exeCommand(async () => {
            await cmd.run(query, {
              in: projectInFile,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [, , d1, d2] = lines;
          assert.include(d1, e2.key, 'has the first environment');
          assert.isUndefined(d2, 'has no more results');
        });
  
        it('searches for environments in the base URI', async () => {
          const project = new HttpProject();
          const e1 = project.addEnvironment('e1');
          const e2 = project.addEnvironment('e2');
          const e3 = project.addEnvironment('e3');
          e1.addServer('https://api.com/v1');
          e2.addServer('https://stage.api.com/v1');
          e3.addServer('https://localhost:8080/v1');
          await writeProject(project, projectInFile);
  
          const query = 'api.com';
          const cmd = new Find(Find.command);
          const result = await exeCommand(async () => {
            await cmd.run(query, {
              in: projectInFile,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [, , d1, d2, d3] = lines;
          assert.include(d1, e1.key, 'has the first environment');
          assert.include(d2, e2.key, 'has the first environment');
          assert.isUndefined(d3, 'has no more results');
        });
  
        it('searches for environments in the variable name', async () => {
          const project = new HttpProject();
          const e1 = project.addEnvironment('e1');
          const e2 = project.addEnvironment('e2');
          const e3 = project.addEnvironment('e3');
          e1.addVariable('access_token', 't1');
          e2.addVariable('bearer_token', 't2');
          // @todo - this should be a number
          // https://github.com/nextapps-de/flexsearch/issues/312
          e3.addVariable('port', '8080');
          await writeProject(project, projectInFile);
  
          const query = 'token';
          const cmd = new Find(Find.command);
          const result = await exeCommand(async () => {
            await cmd.run(query, {
              in: projectInFile,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [, , d1, d2, d3] = lines;
          assert.include(d1, e1.key, 'has the first environment');
          assert.include(d2, e2.key, 'has the first environment');
          assert.isUndefined(d3, 'has no more results');
        });
  
        it('searches for environments in the variable value', async () => {
          const project = new HttpProject();
          const e1 = project.addEnvironment('e1');
          const e2 = project.addEnvironment('e2');
          const e3 = project.addEnvironment('e3');
          e1.addVariable('access_token', 'ya.12345');
          e2.addVariable('bearer_token', 'xa.12345');
          e3.addVariable('port', '8080');
          await writeProject(project, projectInFile);
  
          const query = '12345';
          const cmd = new Find(Find.command);
          const result = await exeCommand(async () => {
            await cmd.run(query, {
              in: projectInFile,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [, , d1, d2, d3] = lines;
          assert.include(d1, e1.key, 'has the first environment');
          assert.include(d2, e2.key, 'has the first environment');
          assert.isUndefined(d3, 'has no more results');
        });
        
        it('prints a JSON output', async () => {
          const project = new HttpProject();
          const f1 = project.addFolder('f1');
          project.addEnvironment('a name 1')
          f1.addEnvironment('names in environment')
          project.addEnvironment('another 3');
          await writeProject(project, projectInFile);
  
          const query = 'nam';
          const cmd = new Find(Find.command);
          const result = await exeCommand(async () => {
            await cmd.run(query, {
              in: projectInFile,
              reporter: 'json',
            });
          });
          const folders: IEnvironment[] = JSON.parse(result);
          assert.lengthOf(folders, 2);
        });
  
        it('prints keys only', async () => {
          const project = new HttpProject();
          const f1 = project.addFolder('f1');
          const e1 = project.addEnvironment('a name 1');
          const e2 = f1.addEnvironment('a náme 2');
          project.addEnvironment('another 3');
          await writeProject(project, projectInFile);
  
          const query = 'nam';
          const cmd = new Find(Find.command);
          const result = await exeCommand(async () => {
            await cmd.run(query, {
              in: projectInFile,
              keyOnly: true,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [title, d1, d2] = lines;
          assert.include(title, 'key', 'has the title');
          assert.include(d1, e1.key, 'has request 1');
          assert.include(d2, e2.key, 'has request 2');
        });
      });
  
      describe('#command', () => {
        it('adds global options', () => {
          const option = findCommandOption(Find.command, '--in');
          assert.ok(option, 'has a global option');
        });
  
        it('adds reporter options', () => {
          const option = findCommandOption(Find.command, '--reporter');
          assert.ok(option);
          assert.equal(option.short, '-r', 'has the short option');
        });
  
        it('adds key listing options', () => {
          const option = findCommandOption(Find.command, '--key-only');
          assert.ok(option);
          assert.equal(option.short, '-k', 'has the short option');
        });
      });
    });
  });
});
