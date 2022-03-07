import { Command } from 'commander';
import { ProjectCommandBase, IProjectCommandOptions } from './ProjectCommandBase.js';

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
    // const operationArgument = new Argument('<operation>', 'The operation to perform.')
    //   .choices([...PatchUtils.patchOperations]);
    cmd
      // .addArgument(operationArgument)
      .argument('<path>', 'The path to the value. Deep values separated with a dot, e.g. "info.name"')
      .description('Updates a folder meta data')
      .option('-V, --value <value>', 'The value to set or append. Required for operation other than "delete".')
      .action(async (operation, path, options) => {
        const instance = new ProjectPatch();
        await instance.run(operation, path, options);
      });
    ProjectCommandBase.defaultOptions(cmd);
    return cmd;
  }

  async run(operation: string, path: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    // project.patch(operation, path, options.value);
    await this.finishProject(project, options);
  }
}
