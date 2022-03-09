import { Command, Option } from 'commander';
import { exec } from 'child_process';
import { dirname } from 'path';
import { IHttpProject, HttpProject } from '@api-client/core';
import { writeFile } from 'fs/promises';
import { ensureDir } from '../../src/lib/Fs.js';

function cleanTerminalOutput(s: string): string {
  let result = s.trim();
  result = result.replace(/[^\x20-\x7E\n]/gm, '');
  result = result.replace(/\[\d+m/gm, '');
  result = result.split('\n').filter(i => !!i.trim()).join('\n');
  return result;
}

export interface RunCommandOptions {
  includeError?: boolean;
  noCleaning?: boolean;
}

class OutputCapture {
  private messages: string[] = [];

  constructor() {
    this.messageHandler = this.messageHandler.bind(this);
  }

  start(): () => string {
    const origOut = process.stdout.write;
    const origErr = process.stderr.write;
    process.stdout.write = this.messageHandler;
    process.stderr.write = this.messageHandler;
    return () => {
      process.stdout.write = origOut;
      process.stderr.write = origErr;
      return this.messages.join('');
    };
  }

  private messageHandler(buffer: string | Buffer): boolean {
    if (typeof buffer === 'string') {
      this.messages.push(buffer);
    } else {
      this.messages.push(buffer.toString('utf8'));
    }
    return true;
  }
}

export function captureOutput(): () => string {
  const instance = new OutputCapture();
  return instance.start();
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
          returnValue = cleanTerminalOutput(returnValue);
        }
        resolve(returnValue);
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

export function splitTable(table: string): string[] {
  const result: string[] = [];
  table.split('\n').forEach((line) => {
    const value = line.trim();
    if (!value) {
      return;
    }
    result.push(line.trim());
  });
  return result;
}

export function findCommandOption(command: Command, q: string): Option {
  // @ts-ignore
  const options = command.options as Option[];
  return options.find(o => o.long === q || o.short === q) as Option;
}
