import { exec } from 'child_process';
import { dirname } from 'path';
import { IHttpProject, HttpProject } from '@advanced-rest-client/core';
import { writeFile } from 'fs/promises';
import { ensureDir } from '../../src/lib/Fs.js';

export async function runCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const finalCommand = `node build/src/cli.js ${command}`;

    exec(finalCommand, (error, stdout, stderr) => {
      if (error) {
        if (stderr) {
          reject(new Error(stderr));
        } else {
          reject(error);
        }
      } else {
        const returnValue = stdout || stderr || '';
        resolve(returnValue.trim());
      }
    });
  });
}

export async function writeProject(project: IHttpProject | HttpProject, filePath: string): Promise<void> {
  const dir = dirname(filePath);
  await ensureDir(dir);
  let obj: IHttpProject;
  const typed = project as HttpProject;
  if (typeof typed.toJSON === 'function') {
    obj = typed.toJSON();
  } else {
    obj = project as IHttpProject;
  }
  await writeFile(filePath, JSON.stringify(obj), 'utf8');
}
