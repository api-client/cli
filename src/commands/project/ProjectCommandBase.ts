/* eslint-disable import/no-named-as-default-member */
import { Command } from 'commander';
import { HttpProject, IHttpProject, fs as coreFs, StoreSdk } from '@api-client/core';
import ooPatch from 'json8-patch';
import { ProjectCommand } from '../ProjectCommand.js';
import { IGlobalOptions } from '../BaseCommand.js';

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
      return this.fileStore.readProject(inputFile);
    }
    const env = opts.env ? opts.env : await this.readEnvironment(opts);
    const value = await this.apiStore.readProject(env, opts);
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

  protected async finishProjectFile(result: HttpProject, options: IProjectCommandOptions): Promise<void> {
    const { in: input } = options;
    let { out } = options;
    let { overwrite=false } = options;
    if (input && input === out) {
      overwrite = true;
    }
    if (!out && !overwrite) {
      throw new Error('Unknown output location.');
    }
    if (!out) {
      out = input as string;
    }
    const exists = await coreFs.pathExists(out);
    if (exists && !overwrite) {
      throw new Error('The project already exists. Use --overwrite to replace the contents.');
    }
    await this.fileStore.writeProject(result, out, options);
  }

  protected async finishProjectStore(result: HttpProject, options: IProjectCommandOptions): Promise<void> {
    const { projectSnapshot } = this;
    if (!projectSnapshot) {
      throw new Error(`Invalid state. Missing project snapshot.`);
    }
    this.projectSnapshot = undefined;
    const sdk = await this.getAuthenticatedSdk(options);
    const altered = result.toJSON();
    const patch = ooPatch.diff(projectSnapshot, altered);
    if (patch.length === 0) {
      // no alterations
      this.println('No changes to the project. Not updating.');
      return;
    }
    const { space } = options;
    await sdk.project.patch(space as string, altered.key as string, patch);
    this.println('OK');
  }

  /**
   * Reads the environment and returns API sdk that is authenticated.
   */
  protected async getAuthenticatedSdk(options: IProjectCommandOptions): Promise<StoreSdk> {
    const env = options.env ? options.env : await this.readEnvironment(options);
    const sdk = this.apiStore.getSdk(env);
    await this.apiStore.getStoreSessionToken(sdk, env);
    return sdk;
  }
}
