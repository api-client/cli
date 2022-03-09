/* eslint-disable no-unused-vars */
import { Command } from 'commander';
import { ProjectCommandBase, IProjectCommandOptions } from './ProjectCommandBase.js';
import { ProjectCommand } from '../ProjectCommand.js';

export interface ICommandOptions extends IProjectCommandOptions {
  value?: string;
}

/**
 * A command that updates a project.
 */
export default class ProjectPatch extends ProjectCommandBase {
  /**
   * The command, e.g. `project patch`
   */
  static get command(): Command {
    const cmd = new Command('patch');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.outputOptions(cmd);

    cmd
      .argument('<path>', 'The path to the value. Deep values separated with a dot, e.g. "info.name"')
      .description('Updates a folder meta data')
      .option('-V, --value <value>', 'The value to set or append. Required for operation other than "delete".')
      .action(async (operation, path, options) => {
        const instance = new ProjectPatch(cmd);
        await instance.run(operation, path, options);
      });
    return cmd;
  }

  async run(operation: string, path: string, options: ICommandOptions): Promise<void> {
    throw new Error(`Not yet implemented`);
    // const project = await this.readProject(options.in);
    // // project.patch(operation, path, options.value);
    // await this.finishProject(project, options);
  }
}
