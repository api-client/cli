import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder, Server } from '@advanced-rest-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-environment-add');
const projectInFile = join(projectPath, 'project-in.json');
const projectOutFile = join(projectPath, 'project-out.json');

const cmdRoot = 'project environment';

describe('Project', () => {
  describe('Environment', () => {
    describe('Add', () => {
      const finalCmd = `${cmdRoot} add`;
      let f1: ProjectFolder;

      before(async () => {
        const project = new HttpProject();
        f1 = project.addFolder('f1');
        await writeProject(project, projectInFile);
      });

      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });

      it('adds an environment to the project', async () => {
        const result = await runCommand(`${finalCmd} -i ${projectInFile} "test env"`);
        
        const project = new HttpProject(result);
        const { environments } = project;
        assert.lengthOf(environments, 1, 'project has the environment');
        const [env] = environments;
        assert.equal(env.info.name as string, 'test env');
        assert.isUndefined(env.info.description);
        assert.deepEqual(env.variables, []);
        assert.isUndefined(env.server);
      });

      it('adds an environment to a folder', async () => {
        const result = await runCommand(`${finalCmd} -i ${projectInFile} -p ${f1.key} "test env"`);
        
        const project = new HttpProject(result);
        assert.lengthOf(project.environments, 0, 'project has no environment');

        const folder = project.findFolder(f1.key) as ProjectFolder;
        const { environments } = folder;
        const [env] = environments;
        assert.equal(env.info.name as string, 'test env');
        assert.isUndefined(env.info.description);
        assert.deepEqual(env.variables, []);
        assert.isUndefined(env.server);
      });

      it('adds the description', async () => {
        const result = await runCommand(`${finalCmd} -i ${projectInFile} "test env" --description "My environment"`);
        const project = new HttpProject(result);
        const { environments } = project;
        const [env] = environments;
        assert.equal(env.info.description as string, 'My environment');
      });

      it('adds the base URI', async () => {
        const result = await runCommand(`${finalCmd} -i ${projectInFile} "test env" --base-uri "api.com"`);
        const project = new HttpProject(result);
        const { environments } = project;
        const [env] = environments;
        assert.ok(env.server, 'has the server');
        const srv = env.server as Server;
        assert.equal(srv.uri as string, 'api.com');
      });

      it('adds the protocol', async () => {
        const result = await runCommand(`${finalCmd} -i ${projectInFile} "test env" --base-uri "api.com" --protocol "https:"`);
        const project = new HttpProject(result);
        const { environments } = project;
        const [env] = environments;
        assert.ok(env.server, 'has the server');
        const srv = env.server as Server;
        assert.equal(srv.protocol as string, 'https:');
      });

      it('adds the base path', async () => {
        const result = await runCommand(`${finalCmd} -i ${projectInFile} "test env" --base-uri "api.com" --base-path "/v2/api"`);
        const project = new HttpProject(result);
        const { environments } = project;
        const [env] = environments;
        assert.ok(env.server, 'has the server');
        const srv = env.server as Server;
        assert.equal(srv.basePath as string, '/v2/api');
      });

      it('adds server description', async () => {
        const result = await runCommand(`${finalCmd} -i ${projectInFile} "test env" --server-description "My API server"`);
        const project = new HttpProject(result);
        const { environments } = project;
        const [env] = environments;
        assert.ok(env.server, 'has the server');
        const srv = env.server as Server;
        assert.equal(srv.description as string, 'My API server');
      });

      it('outputs to a file', async () => {
        await runCommand(`${finalCmd} -i ${projectInFile} -o ${projectOutFile} "test env"`);
        
        const content = await fs.readFile(projectOutFile, 'utf8');
        const project = new HttpProject(content);
        const { environments } = project;
        assert.lengthOf(environments, 1, 'project has the environment');
      });
    });
  });
});
