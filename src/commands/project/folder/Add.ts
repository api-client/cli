import { Command } from 'commander';
import { IFolderCreateOptions } from '@advanced-rest-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';

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
    const createProject = new Command('add');
    createProject
      .argument('<name>', 'The name of the folder')
      .description('Creates a new folder in a project')
      .option('-S, --skip-existing', 'Ignores the operation when the folder with the same name exists. This command can be used used to ensure that the folder exists.')
      .option('-p, --parent [key]', 'The id of the parent folder. When not set it adds the folder to the project root.')
      .option('-i, --index [position]', 'The position at which to add the folder into the list of items.')
      .action(async (name, options) => {
        const instance = new ProjectFolderAdd();
        await instance.run(name, options);
      });
    ProjectCommandBase.appendProjectOptions(createProject);
    return createProject;
  }

  async run(name: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const { skipExisting, parent, index } = options;
    project.addFolder(name, { skipExisting, parent, index });
    await this.finishProject(project, options);
  }
}
