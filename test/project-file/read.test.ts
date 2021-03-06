import { assert } from 'chai';
import { join } from 'path';
import { HttpProject } from '@api-client/core';
import fs from 'fs/promises';
import { exeCommand, findCommandOption, writeProject, splitTable, cleanTerminalOutput } from '../helpers/CliHelper.js';
import Read from '../../src/commands/project/Read.js';

const projectPath = join('test', 'playground', 'project-read');
const projectFile = join(projectPath, 'project.json');

describe('Project', () => {
  describe('File store', () => {
    describe('read', () => {
      describe('Units', () => {
        after(async () => {
          await fs.rm(projectPath, { recursive: true, force: true });
        });
    
        it('prints the basic info', async () => {
          const source = HttpProject.fromName('test');
          await writeProject(source, projectFile);
          
          const cmd = new Read(Read.command);
          const result = await exeCommand(async () => {
            await cmd.run({
              in: projectFile,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [key, name, envs, folders, requests, schemas] = lines;
          assert.include(key, 'key', 'has the "key" line');
          assert.include(key, source.key, 'has the "key" value');
          assert.include(name, 'name', 'has the "name" line');
          assert.include(name, source.info.name as string, 'has the "name" value');
          assert.include(envs, 'environments', 'has the "environments" line');
          assert.include(envs, '(none)', 'has the "environments" default value');
          assert.include(folders, 'folders', 'has the "folders" line');
          assert.include(folders, '(none)', 'has the "folders" default value');
          assert.include(requests, 'requests', 'has the "requests" line');
          assert.include(requests, '(none)', 'has the "requests" default value');
          assert.include(schemas, 'schemas', 'has the "schemas" line');
          assert.include(schemas, '(none)', 'has the "schemas" default value');
        });
    
        it('prints the environments', async () => {
          const source = HttpProject.fromName('test');
          source.addEnvironment('env 1');
          source.addEnvironment('env 2');
          source.addEnvironment('env 3');
          await writeProject(source, projectFile);
    
          const cmd = new Read(Read.command);
          const result = await exeCommand(async () => {
            await cmd.run({
              in: projectFile,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [, , envs] = lines;
          assert.include(envs, 'environments', 'has the "environments" line');
          assert.include(envs, 'env 1, env 2, env 3', 'has the "environments" value');
        });
    
        it('prints the folders', async () => {
          const source = HttpProject.fromName('test');
          source.addFolder('f 1');
          source.addFolder('f 2');
          source.addFolder('f 3');
          await writeProject(source, projectFile);
    
          const cmd = new Read(Read.command);
          const result = await exeCommand(async () => {
            await cmd.run({
              in: projectFile,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [, , , folders] = lines;
          assert.include(folders, 'folders', 'has the "folders" line');
          assert.include(folders, 'f 1, f 2, f 3', 'has the "folders" value');
        });
    
        it('prints the folders', async () => {
          const source = HttpProject.fromName('test');
          source.addRequest('r 1');
          source.addRequest('r 2');
          source.addRequest('r 3');
          await writeProject(source, projectFile);
    
          const cmd = new Read(Read.command);
          const result = await exeCommand(async () => {
            await cmd.run({
              in: projectFile,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [, , , , requests] = lines;
          assert.include(requests, 'requests', 'has the "requests" line');
          assert.include(requests, 'r 1, r 2, r 3', 'has the "requests" default value');
        });
    
        it('prints the schemas', async () => {
          const source = HttpProject.fromName('test');
          source.addSchema('s 1');
          source.addSchema('s 2');
          source.addSchema('s 3');
          await writeProject(source, projectFile);
    
          const cmd = new Read(Read.command);
          const result = await exeCommand(async () => {
            await cmd.run({
              in: projectFile,
            });
          });
          const lines = splitTable(cleanTerminalOutput(result));
          
          const [, , , , , schemas] = lines;
          assert.include(schemas, 'schemas', 'has the "schemas" line');
          assert.include(schemas, 's 1, s 2, s 3', 'has the "schemas" default value');
        });
      });

      describe('#command', () => {
        it('adds global options', () => {
          const option = findCommandOption(Read.command, '--in');
          assert.ok(option, 'has a global option');
        });
      });
    });
  });
});
