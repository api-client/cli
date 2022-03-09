import { Command } from 'commander';
import { IFolderCreateOptions } from '@api-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { ProjectCommand } from '../../ProjectCommand.js';
import { parseInteger } from '../../ValueParsers.js';

export interface ICommandOptions extends IProjectCommandOptions, IFolderCreateOptions {
}

/**
 * A command that adds a folder to a project.
 */
export default class ProjectFolderAdd extends ProjectCommandBase {
  /**
   * The command, e.g. `project folder add`
   */
  static get command(): Command {
    const cmd = new Command('add');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.parentSearchOptions(cmd);
    ProjectCommand.outputOptions(cmd);
    cmd
      .argument('<name>', 'The name of the folder')
      .description('Creates a new folder in a project')
      .option('-S, --skip-existing', 'Ignores the operation when the folder with the same name exists. This command can be used used to ensure that the folder exists.')
      .option('-n, --index [position]', 'The 0-based position at which to add the folder into the list of items.', parseInteger.bind(null, 'index'))
      .action(async (name, options) => {
        const instance = new ProjectFolderAdd(cmd);
        await instance.run(name, options);
      });
    return cmd;
  }

  async run(name: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options);
    const { skipExisting, parent, index } = options;
    
    project.addFolder(name, { skipExisting, parent, index });
    await this.finishProject(project, options);
  }
}
