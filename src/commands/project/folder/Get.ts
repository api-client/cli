import { Command, Option } from 'commander';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { printFolderTable } from './Utils.js';

export interface ICommandOptions extends IProjectCommandOptions {
  keyOnly?: boolean;
  reporter?: 'json' | 'table';
}

/**
 * A command that reads a folder from a project.
 */
export default class ProjectFolderGet extends ProjectCommandBase {
  /**
   * The command, e.g. `project folder get xxx`
   */
  static get command(): Command {
    const cmd = new Command('get');
    cmd.addOption(new Option('-r, --reporter <value>', 'The reporter to use to print the values. Default to "table".').choices(['json', 'table']).default('table'))
    cmd
      .argument('<key>', 'The id of the folder.')
      .description('reads the folder from the project and prints it to the console.')
      .action(async (key, options) => {
        const instance = new ProjectFolderGet();
        await instance.run(key, options);
      });
    ProjectCommandBase.appendProjectOptions(cmd);
    return cmd;
  }

  async run(key: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const folder = project.findFolder(key, { keyOnly: true });
    if (!folder) {
      throw new Error(`The folder ${key} not found in the project.`);
    }
    const { keyOnly, reporter='table' } = options;
    if (keyOnly) {
      this.println(folder.key)
      return;
    }
    if (reporter === 'json') {
      this.println(JSON.stringify(folder, null, 2));
      return;
    }
    if (reporter === 'table') {
      printFolderTable([folder]);
      return;
    }
    throw new Error(`Unknown reporter ${reporter}`);
  }
}
