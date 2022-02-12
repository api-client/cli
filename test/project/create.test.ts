import { assert } from 'chai';
import { join } from 'path';
import { IHttpProject } from '@advanced-rest-client/core';
import fs from 'fs/promises';
import { runCommand } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-create');
const defaultTestFile = join(projectPath, 'project.json');

describe('Project', () => {
  describe('create', () => {
    after(async () => {
      await fs.rm(projectPath, { recursive: true, force: true });
    });

    afterEach(async () => {
      await fs.rm(defaultTestFile, { force: true });
    });

    it('creates a project in the terminal output', async () => {
      const result = await runCommand('project create "test api"');
      assert.ok(result, 'has the output');

      const data: IHttpProject = JSON.parse(result);
      assert.typeOf(data, 'object', 'has the project object');
      assert.equal(data.info.name, 'test api');
    });

    it('creates a project in the file', async () => {
      await runCommand(`project create "test api" --out ${defaultTestFile}`);
      const contents = await fs.readFile(defaultTestFile, 'utf8');
      assert.ok(contents, 'has the output');

      const data: IHttpProject = JSON.parse(contents);
      assert.typeOf(data, 'object', 'has the project object');
      assert.equal(data.info.name, 'test api');
    });

    it('adds the version information', async () => {
      const result = await runCommand('project create "test api" --project-version "0.1.0"');
      assert.ok(result, 'has the output');

      const data: IHttpProject = JSON.parse(result);
      assert.typeOf(data, 'object', 'has the project object');
      assert.equal(data.info.version, '0.1.0');
    });

    it('prints an error when file already exists', async () => {
      await runCommand(`project create "test api" --out ${defaultTestFile}`);
      const result = await runCommand(`project create "test api" --out ${defaultTestFile}`);
      assert.equal(result, 'The project already exists. Use --overwrite to replace the contents.');
    });

    it('overrides the file', async () => {
      await runCommand(`project create "test api" --out ${defaultTestFile}`);
      await runCommand(`project create "other api" --out ${defaultTestFile} --overwrite`);
      const contents = await fs.readFile(defaultTestFile, 'utf8');
      const data: IHttpProject = JSON.parse(contents);
      assert.typeOf(data, 'object', 'has the project object');
      assert.equal(data.info.name, 'other api');
    });
  });
});
