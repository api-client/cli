import { Command } from 'commander';
import { ProjectCommandBase, IProjectCommandOptions } from './ProjectCommandBase.js';
import { ProjectCommand } from '../ProjectCommand.js';

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
        const instance = new ProjectClone();
        await instance.run(options);
      });
    return cmd;
  }

  /**
   * Runs the command to clone an HTTP project.
   * @param options Command options.
   */
  async run(options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const clone = project.clone({
      withoutRevalidate: !options.revalidate,
    });
    await this.finishProject(clone, options);
  }
}
