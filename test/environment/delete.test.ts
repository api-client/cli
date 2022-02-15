import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder, Environment } from '@advanced-rest-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-environment-delete');
const projectInFile = join(projectPath, 'project-in.json');
const projectOutFile = join(projectPath, 'project-out.json');

const cmdRoot = 'project environment';

describe('Project', () => {
  describe('Environment', () => {
    describe('Delete', () => {
      const finalCmd = `${cmdRoot} delete`;
      after(async () => {
        await fs.rm(projectPath, { recursive: true, force: true });
      });

      let f1: ProjectFolder;
      let e1: Environment;
      let e2: Environment;

      before(async () => {
        const project = new HttpProject();
        f1 = project.addFolder('f1');
        e1 = project.addEnvironment('e1');
        e2 = f1.addEnvironment('e2');
        await writeProject(project, projectInFile);
      });

      it('removes an environment from the project', async () => {
        const result = await runCommand(`${finalCmd} -i ${projectInFile} ${e1.key}`);
        const project = new HttpProject(result);
        assert.deepEqual(project.environments, []);
      });

      it('removes an environment from a folder', async () => {
        const result = await runCommand(`${finalCmd} -i ${projectInFile} ${e2.key}`, { includeError: true });
        
        const project = new HttpProject(result);
        const folder = project.findFolder(f1.key) as ProjectFolder;
        assert.deepEqual(folder.environments, []);
      });

      it('prints a message when the environment is not found', async () => {
        const result = await runCommand(`${finalCmd} -i ${projectInFile} "test"`, { includeError: true });
        assert.equal(result, 'The environment cannot be found: test.');
      });

      it('ignores errors when --safe', async () => {
        const result = await runCommand(`${finalCmd} -i ${projectInFile} --safe "test"`, { includeError: true });
        const project = new HttpProject(result);
        assert.ok(project);
      });

      it('removes an environment from the project and saved to the output file', async () => {
        await runCommand(`${finalCmd} -i ${projectInFile} -o ${projectOutFile} ${e1.key}`);
        const contents = await fs.readFile(projectOutFile, 'utf8');
        const project = new HttpProject(contents);
        assert.deepEqual(project.environments, []);
      });
    });  
  });
});
