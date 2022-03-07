import { Command } from 'commander';
import { HttpProject } from '@api-client/core';
import fs from 'fs/promises';
import path from 'path';
import { ProjectCommand } from '../ProjectCommand.js';
import { ensureDir, pathExists, readJson } from '../../lib/Fs.js';

export interface IProjectCommandOptions {
  in: string;
  out?: string;
  overwrite?: boolean;
  prettyPrint?: boolean;
}

/**
 * Base class for project related commands.
 */
export abstract class ProjectCommandBase extends ProjectCommand {
  /**
   * Appends the project common options to the command.
   * @param command The input command
   * @returns The same command for chaining.
   * @deprecated Use `ProjectCommand.globalOptions()` instead.
   */
  static defaultOptions(command: Command): Command {
    return ProjectCommand.globalOptions(command)
      .option('-o, --out [path]', 'The output location of the project file. When not specified, it outputs the project to the std output')
      .option('--overwrite', 'Overrides the input project when --out is not set. When --out is set it overrides the existing file if exists.');
  }

  /**
   * Reads the project contents.
   * @param projectLocation The location of the project file.
   */
  async readProject(projectLocation: string): Promise<HttpProject> {
    if (!projectLocation) {
      throw new Error('Project location not specified. Use the --in option to locate the project file or the HTTP_PROJECT variable.');
    }
    const exists = await pathExists(projectLocation);
    if (!exists) {
      throw new Error(`No such file ${projectLocation}`);
    }
    let contents: any; 
    try {
      contents = await readJson(projectLocation, { throws: true });
    } catch (e) {
      throw new Error(`Invalid ARC project contents in file ${projectLocation}`);
    }
    return new HttpProject(contents);
  }

  /**
   * Called when the project manipulation ends.
   * It outputs the project to the std output or to a file.
   */
  async finishProject(project: HttpProject, options: IProjectCommandOptions): Promise<void> {
    const { in: input, out } = options;
    let { overwrite=false } = options;
    if (input && input === out) {
      overwrite = true;
    }

    const contents = JSON.stringify(project, null, options.prettyPrint ? 2 : 0);
    if (!overwrite && !out) {
      process.stdout.write(Buffer.from(`${contents}\n`));
      return;
    }
    if (overwrite && !out) {
      const dir = path.dirname(input);
      await ensureDir(dir);
      await fs.writeFile(input, contents, 'utf8');
      return;
    }
    if (!out) {
      this.warn('Unknown output location.');
      return;
    }
    const exists = await pathExists(out);
    if (exists && !overwrite) {
      this.warn('The project already exists. Use --overwrite to replace the contents.');
      return;
    }

    const dir = path.dirname(out);
    await ensureDir(dir);
    await fs.writeFile(out, contents, 'utf8');
  }
}
