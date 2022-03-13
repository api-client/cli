/* eslint-disable no-unused-vars */
import { Command, Option } from 'commander';
import { exec } from 'child_process';
import { dirname } from 'path';
import { IHttpProject, HttpProject, fs, TestCliHelper } from '@api-client/core';
import { writeFile } from 'fs/promises';

export function cleanTerminalOutput(s: string): string {
  return TestCliHelper.cleanTerminalOutput(s);
}

export interface RunCommandOptions {
  includeError?: boolean;
  noCleaning?: boolean;
}

export async function runCommand(command: string, opts: RunCommandOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const finalCommand = `node build/cli.js ${command}`;

    exec(finalCommand, (error, stdout, stderr) => {
      if (error) {
        if (stderr) {
          reject(new Error(stderr));
        } else {
          reject(error);
        }
      } else {
        let returnValue = stdout;
        if (opts.includeError && !returnValue) {
          returnValue = stderr;
        }
        if (!returnValue) {
          returnValue = '';
        }
        if (opts.noCleaning) {
          returnValue = returnValue.trim();
        } else {
          returnValue = TestCliHelper.cleanTerminalOutput(returnValue);
        }
        resolve(returnValue);
      }
    });
  });
}

export async function writeProject(project: IHttpProject | HttpProject, filePath: string): Promise<void> {
  const dir = dirname(filePath);
  await fs.ensureDir(dir);
  let obj: IHttpProject;
  const typed = project as HttpProject;
  if (typeof typed.toJSON === 'function') {
    obj = typed.toJSON();
  } else {
    obj = project as IHttpProject;
  }
  await writeFile(filePath, JSON.stringify(obj), 'utf8');
}

export function splitTable(table: string): string[] {
  return TestCliHelper.splitLines(table);
}

export function findCommandOption(command: Command, q: string): Option {
  // @ts-ignore
  const options = command.options as Option[];
  return options.find(o => o.long === q || o.short === q) as Option;
}

/**
 * Executes a passed asynchronous function and captures stdout.
 * When the function fails, it cleans up output listeners and throws the error.
 * 
 * ```javascript
 * const cmd = new Delete(Delete.command); 
 * const out = exeCommand(async () => {
 *  cmd.run(...);
 * });
 * ```
 * 
 * @param fn The function to execute.
 * @returns The terminal output.
 */
export async function exeCommand(fn: () => Promise<void>): Promise<string> {
  return TestCliHelper.grabOutput(fn);
}
