import { Command } from 'commander';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { printFolderInfo } from './Utils.js';
import { ProjectCommand } from '../../ProjectCommand.js';

export interface ICommandOptions extends IProjectCommandOptions {
  keyOnly?: boolean;
  reporter?: 'json' | 'table';
}

export default class FolderRead extends ProjectCommandBase {
  static get command(): Command {
    const cmd = new Command('read');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.reporterOptions(cmd);
    ProjectCommand.keyListingOptions(cmd);

    cmd
      .argument('<key>', 'The id of the folder.')
      .description('reads the folder from the project and prints it to the console.')
      .action(async (key, options) => {
        const instance = new FolderRead(cmd);
        await instance.run(key, options);
      });
    return cmd;
  }

  async run(key: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options);
    const folder = project.findFolder(key, { keyOnly: true });
    if (!folder) {
      throw new Error(`The folder "${key}" not found in the project.`);
    }
    const { keyOnly, reporter='table' } = options;
    if (keyOnly) {
      this.println(folder.key)
      return;
    }
    if (reporter === 'json') {
      const content = options.prettyPrint ? JSON.stringify(folder, null, 2) : JSON.stringify(folder);
      this.println(content);
      return;
    }
    if (reporter === 'table') {
      printFolderInfo(folder);
      return;
    }
    throw new Error(`Unknown reporter ${reporter}`);
  }
}
