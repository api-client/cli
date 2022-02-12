import { Command, Argument } from 'commander';
import * as PatchUtils from '@advanced-rest-client/core/build/src/models/PatchUtils.js';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';

export interface ICommandOptions extends IProjectCommandOptions {
  value?: string;
}

/**
 * A command that updates a folder in a project.
 */
export default class ProjectFolderPatch extends ProjectCommandBase {
  /**
   * The command, e.g. `project folder patch`
   */
  static get command(): Command {
    const cmd = new Command('patch');
    const operationArgument = new Argument('<operation>', 'The operation to perform.')
      .choices([...PatchUtils.patchOperations]);
    cmd
      .argument('<key>', 'The id of the folder')
      .addArgument(operationArgument)
      .argument('<path>', 'The path to the value. Deep values separated with a dot, e.g. "info.name"')
      .description('Updates a folder meta data')
      .option('-V, --value <value>', 'The value to set or append. Required for operation other than "delete".')
      .action(async (key, operation, path, options) => {
        const instance = new ProjectFolderPatch();
        await instance.run(key, operation, path, options);
      });
    ProjectCommandBase.appendProjectOptions(cmd);
    return cmd;
  }

  async run(key: string, operation: PatchUtils.PatchOperation, path: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const folder = project.findFolder(key, { keyOnly: true });
    if (!folder) {
      throw new Error(`Folder not found in the project.`);
    }
    folder.patch(operation, path, options.value);
    await this.finishProject(project, options);
  }
}
