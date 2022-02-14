import { Command } from 'commander';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { printFolderTable } from './Utils.js';
import { ProjectCommand } from '../../ProjectCommand.js';

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
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.reporterOptions(cmd);
    ProjectCommand.keyListingOptions(cmd);
    
    cmd
      .argument('<key or name>', 'The id or the name of the folder.')
      .description('Finds a folder in the project and prints it to the console.')
      .action(async (key, options) => {
        const instance = new ProjectFolderFind();
        await instance.run(key, options);
      });
    return cmd;
  }

  async run(keyOrName: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const folder = project.findFolder(keyOrName);
    if (!folder) {
      throw new Error(`The folder "${keyOrName}" not found in the project.`);
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
      printFolderTable([folder]);
      return;
    }
  }
}
