import { Command } from 'commander';
import { ProjectCommandBase, IProjectCommandOptions } from './ProjectCommandBase.js';
import { ProjectCommand } from '../ProjectCommand.js';
import { printProjectInfo } from './Utils.js';

export interface ICommandOptions extends IProjectCommandOptions {
}

export default class ProjectRead extends ProjectCommandBase {
  static get command(): Command {
    const cmd = new Command('read');
    ProjectCommand.globalOptions(cmd);
    
    cmd
      .description('Prints information about the project.')
      .action(async (options) => {
        const instance = new ProjectRead(cmd);
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
    printProjectInfo(project);
  }
}
