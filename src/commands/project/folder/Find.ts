import { Command, Option } from 'commander';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { printFolderTable } from './Utils.js';

export interface ICommandOptions extends IProjectCommandOptions {
  keyOnly?: boolean;
  reporter?: 'json' | 'table';
}

/**
 * A command that finds a folder in a project.
 */
export default class ProjectFolderFind extends ProjectCommandBase {
  /**
   * The command, e.g. `project folder find "my folder"`
   */
  static get command(): Command {
    const cmd = new Command('find');
    cmd.addOption(new Option('-r, --reporter <value>', 'The reporter to use to print the values. Ignored when --key-only is set. Default to "table".').choices(['json', 'table']).default('table'))
    cmd
      .argument('<key or name>', 'The id or the name of the folder.')
      .description('Finds a folder in the project and prints it to the console.')
      .option('-K, --key-only', 'Prints the key value of the project only. Ignores the `--reporter` option when set.')
      .action(async (key, options) => {
        const instance = new ProjectFolderFind();
        await instance.run(key, options);
      });
    ProjectCommandBase.appendProjectOptions(cmd);
    return cmd;
  }

  async run(keyOrName: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const folder = project.findFolder(keyOrName);
    if (!folder) {
      throw new Error(`The folder ${keyOrName} not found in the project.`);
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
