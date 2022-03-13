import { Command } from 'commander';
import { HttpProject } from '@api-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from './ProjectCommandBase.js';
import { ProjectCommand } from '../ProjectCommand.js';
import { printProjectInfo } from './Utils.js';

export interface ICommandOptions extends IProjectCommandOptions {
  revalidate?: boolean;
}

/**
 * A command that clones an HTTP project.
 */
export default class ProjectClone extends ProjectCommandBase {
  static get command(): Command {
    const cmd = new Command('clone');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.outputOptions(cmd);
    cmd
      .description('Makes a copy of a project.')
      .option('--no-revalidate', 'By default keys are re-generated in the project (requests, folders, etc). Use this option to make an exact copy.')
      .action(async (options) => {
        const instance = new ProjectClone(cmd);
        await instance.run(options);
      });
    return cmd;
  }

  /**
   * Runs the command to clone an HTTP project.
   * @param options Command options.
   */
  async run(options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options);
    let revalidate = options.revalidate;
    if (options.space) {
      revalidate = true;
    }
    const clone = project.clone({
      withoutRevalidate: !revalidate,
    });
    await this.finishProject(clone, options);
  }

  /**
   * Custom save function to mitigate missing project snapshot 
   */
  protected async finishProjectStore(result: HttpProject, options: IProjectCommandOptions): Promise<void> {
    const sdk = await this.getAuthenticatedSdk(options);
    const { space } = options;
    const altered = result.toJSON();
    const id = await sdk.project.create(space as string, altered);
    const created = await sdk.project.read(space as string, id);
    printProjectInfo(new HttpProject(created));
  }
}
