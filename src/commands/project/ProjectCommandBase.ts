/* eslint-disable import/no-named-as-default-member */
import { Command } from 'commander';
import { HttpProject, IHttpProject } from '@api-client/core';
import ooPatch from 'json8-patch';
import fs from 'fs/promises';
import path from 'path';
import { ProjectCommand } from '../ProjectCommand.js';
import { IGlobalOptions } from '../BaseCommand.js';
import { ensureDir, pathExists, readJson } from '../../lib/Fs.js';
import { printProjectInfo } from '../project/Utils.js';

export interface IProjectCommandOptions extends IGlobalOptions {
  /**
   * Only when operating on a project file.
   * The path to the project file location.
   * It is an error to set both `--in` and `--project`.
   */
  in?: string;
  /**
   * Only when reading a project from the store.
   * It is an error to set both `--in` and `--project`.
   */
  project?: string;
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
      .option('-P, --project', 'The key of the project folder. Cannot be set together with "--in".')
      .option('-o, --out [path]', 'The output location of the project file. When not specified, it outputs the project to the std output')
      .option('--overwrite', 'Overrides the input project when --out is not set. When --out is set it overrides the existing file if exists.');
  }

  /**
   * This is used when a project is read from the data store.
   * This is the project schema before any alterations. If the project has been altered,
   * then the `finishProject()` function creates a JSON patch object for the difference and
   * sends the patch to the data store.
   */
  private projectSnapshot?: IHttpProject;

  /**
   * Reads the project for the given configuration.
   */
  async readProject(opts: IProjectCommandOptions = {}): Promise<HttpProject> {
    const { in: inputFile, project } = opts;
    if (inputFile && project) {
      throw new Error('The "--in" and "--project" options are mutually exclusive. Use only one of the options.');
    }
    if (!inputFile && !project) {
      throw new Error('You must specify either "--in" or "--project" option.');
    }
    if (inputFile) {
      return this.readFileProject(inputFile);
    }
    return this.readStoreProject(opts);
  }

  /**
   * Reads project contents from a file.
   */
  private async readFileProject(location: string): Promise<HttpProject> {
    const exists = await pathExists(location);
    if (!exists) {
      throw new Error(`No such file ${location}`);
    }
    let contents: any; 
    try {
      contents = await readJson(location, { throws: true });
    } catch (e) {
      throw new Error(`Invalid ARC project contents in file ${location}`);
    }
    return new HttpProject(contents);
  }

  /**
   * Reads the project data from the data store.
   */
  private async readStoreProject(options: IProjectCommandOptions): Promise<HttpProject> {
    this.validateUserSpace(options);
    const { space, project } = options;
    if (!project) {
      throw new Error(`The --project option is required when reading a project from the data store.`);
    }
    const env = await this.readEnvironment(options);
    const sdk = this.getSdk(env);
    await this.getStoreSessionToken(sdk, env);
    const value = await sdk.project.read(space as string, project);
    this.projectSnapshot = value;
    return new HttpProject(value);
  }

  /**
   * Called when the project manipulation ends.
   * It outputs the project to the std output or to a file.
   */
  async finishProject(result: HttpProject, options: IProjectCommandOptions): Promise<void> {
    const { in: input, out, space } = options;
    let { overwrite=false } = options;
    if (input && input === out) {
      overwrite = true;
    }
    
    if (!overwrite && !out && !space) {
      // output to the terminal
      const contents = JSON.stringify(result, null, options.prettyPrint ? 2 : 0);
      process.stdout.write(Buffer.from(`${contents}\n`));
      return;
    }
    if (overwrite || out) {
      return this.finishProjectFile(result, options);
    }
    return this.finishProjectStore(result, options);
  }

  private async finishProjectFile(result: HttpProject, options: IProjectCommandOptions): Promise<void> {
    const { in: input } = options;
    let { out } = options;
    let { overwrite=false } = options;
    if (input && input === out) {
      overwrite = true;
    }
    if (!out && !overwrite) {
      this.err('Unknown output location.');
      return;
    }
    if (!out) {
      out = input as string;
    }
    const exists = await pathExists(out);
    if (exists && !overwrite) {
      this.err('The project already exists. Use --overwrite to replace the contents.');
      return;
    }
    
    const contents = JSON.stringify(result, null, options.prettyPrint ? 2 : 0);
    const dir = path.dirname(out);
    await ensureDir(dir);
    await fs.writeFile(out, contents, 'utf8');
  }

  private async finishProjectStore(result: HttpProject, options: IProjectCommandOptions): Promise<void> {
    const { projectSnapshot } = this;
    this.projectSnapshot = undefined;
    const altered = result.toJSON();
    const { space } = options;
    const env = await this.readEnvironment(options);
    const sdk = this.getSdk(env);
    await this.getStoreSessionToken(sdk, env);

    if (!projectSnapshot) {
      if (this.command.name() === 'add' && this.command.parent?.name() === 'project') {
        // creating a new project
        const id = await sdk.project.create(space as string, altered);
        const created = await sdk.project.read(space as string, id);
        printProjectInfo(new HttpProject(created));
        return;
      }
      throw new Error(`Invalid state. Missing project snapshot.`);
    }

    const patch = ooPatch.diff(projectSnapshot, altered);
    if (patch.length === 0) {
      // no alterations
      this.println('No changes to the project. Not updating.');
      return;
    }
    
    await sdk.project.patch(space as string, altered.key as string, patch);
    this.println('OK');
  }
}
