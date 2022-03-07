import { assert } from 'chai';
import { join } from 'path';
import { HttpProject, ProjectFolder, ProjectRequest } from '@api-client/core';
import fs from 'fs/promises';
import { runCommand, writeProject } from '../helpers/CliHelper.js';

const projectPath = join('test', 'playground', 'project-clone');
const projectFile = join(projectPath, 'project.json');

const cmdRoot = 'project clone';

describe('Project', () => {
  describe('clone', () => {
    let f1: ProjectFolder;
    let f2: ProjectFolder;
    let r1: ProjectRequest;
    let r2: ProjectRequest;
    let sourceProject: HttpProject;
    
    before(async () => {
      sourceProject = HttpProject.fromName('test');
      f1 = sourceProject.addFolder('folder 1');
      f2 = f1.addFolder('folder 2');
      r1 = sourceProject.addRequest('https://r1.com');
      r2 = f1.addRequest('https://r2.com');
      await writeProject(sourceProject, projectFile);
    });

    after(async () => {
      await fs.rm(projectPath, { recursive: true, force: true });
    });

    it('outputs project with different keys', async () => {
      const result = await runCommand(`${cmdRoot} -i ${projectFile}`);
      const project = new HttpProject(result);
      
      const df1 = project.findFolder(f1.info.name as string) as ProjectFolder;
      assert.ok(df1, 'has folder 1');
      assert.notEqual(df1.key, f1.key, 'folder 1 as a new key');

      const df2 = project.findFolder(f2.info.name as string) as ProjectFolder;
      assert.ok(df2, 'has folder 2');
      assert.notEqual(df2.key, f2.key, 'folder 2 as a new key');

      const dr1 = project.findRequest(r1.expects.url as string) as ProjectRequest;
      assert.ok(dr1, 'has request 1');
      assert.notEqual(dr1.key, r1.key, 'request 1 as a new key');

      const dr2 = project.findRequest(r2.expects.url as string) as ProjectRequest;
      assert.ok(dr2, 'has request 2');
      assert.notEqual(dr2.key, f2.key, 'request 2 as a new key');
    });

    it('outputs project with the same keys keys', async () => {
      const result = await runCommand(`${cmdRoot} -i ${projectFile} --no-revalidate`);
      const project = new HttpProject(result);
      
      assert.deepEqual(project.toJSON(), sourceProject.toJSON());
    });

    it('outputs the project to a file', async () => {
      const targetFile = join(projectPath, 'project-new.json');
      await runCommand(`${cmdRoot} -i ${projectFile}  -o ${targetFile} --no-revalidate`);
      const contents = await fs.readFile(targetFile, 'utf8');
      const project = new HttpProject(contents);
      
      assert.deepEqual(project.toJSON(), sourceProject.toJSON());
    });
  });
});
