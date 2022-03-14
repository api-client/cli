import { assert } from 'chai';
import { join } from 'path';
import { IHttpProject } from '@api-client/core';
import fs from 'fs/promises';
import { exeCommand, findCommandOption } from '../helpers/CliHelper.js';
import Add from '../../src/commands/project/Add.js';

const projectPath = join('test', 'playground', 'project-add');
const defaultTestFile = join(projectPath, 'project.json');

describe('Project', () => {
  describe('File store', () => {
    describe('add', () => {
      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });
  
      afterEach(async () => {
        await fs.rm(defaultTestFile, { force: true });
      });
  
      const name = 'test api';
  
      it('creates a project in the terminal output', async () => {
        const cmd = new Add(Add.command);
        const result = await exeCommand(async () => {
          await cmd.run(name);
        });
  
        assert.ok(result, 'has the output');
  
        const data: IHttpProject = JSON.parse(result);
        assert.typeOf(data, 'object', 'has the project object');
        assert.equal(data.info.name, 'test api');
      });
  
      it('creates a project in the file', async () => {
        const cmd = new Add(Add.command);
        await cmd.run(name, {
          out: defaultTestFile,
        });
        const contents = await fs.readFile(defaultTestFile, 'utf8');
        assert.ok(contents, 'has the output');
  
        const data: IHttpProject = JSON.parse(contents);
        assert.typeOf(data, 'object', 'has the project object');
        assert.equal(data.info.name, 'test api');
      });
  
      it('adds the version information', async () => {
        const cmd = new Add(Add.command);
        const result = await exeCommand(async () => {
          await cmd.run(name, {
            projectVersion: '0.1.0'
          });
        });
        const data: IHttpProject = JSON.parse(result);
        assert.typeOf(data, 'object', 'has the project object');
        assert.equal(data.info.version, '0.1.0');
      });
  
      it('prints an error when file already exists', async () => {
        const cmd = new Add(Add.command);
        await cmd.run(name, {
          out: defaultTestFile,
        });
  
        let e: Error | undefined;
        try {
          await cmd.run(name, {
            out: defaultTestFile,
          });
        } catch (cause) {
          e = cause as Error;
        }
        assert.ok(e, 'has the error');
        if (e) {
          assert.equal(e.message, 'The project already exists. Use --overwrite to replace the contents.');
        }
      });
  
      it('overrides the file', async () => {
        const cmd = new Add(Add.command);
        await cmd.run(name, {
          out: defaultTestFile,
        });
        await cmd.run('other api', {
          out: defaultTestFile,
          overwrite: true,
        });
        const contents = await fs.readFile(defaultTestFile, 'utf8');
        const data: IHttpProject = JSON.parse(contents);
        assert.typeOf(data, 'object', 'has the project object');
        assert.equal(data.info.name, 'other api');
      });
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

    it('adds the project-version option', () => {
      const option = findCommandOption(Add.command, '--project-version');
      assert.ok(option);
      assert.equal(option.short, '-v', 'has the shortcut');
    });
  });
});
