import { Command } from 'commander';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';

export interface ICommandOptions extends IProjectCommandOptions {
  safe?: boolean;
}

/**
 * A command that deletes a folder from a project.
 */
export default class ProjectFolderDelete extends ProjectCommandBase {
  /**
   * The command, e.g. `project folder delete xxx`
   */
  static get command(): Command {
    const createProject = new Command('delete');
    createProject
      .argument('<key>', 'The id of the folder. It ignores the name when searching to the folder to avoid ambiguity.')
      .description('Removes the folder from the project')
      .option('-S, --safe', 'Does not throw an error when the folder does not exist.')
      .action(async (key, options) => {
        const instance = new ProjectFolderDelete();
        await instance.run(key, options);
      });
    ProjectCommandBase.appendProjectOptions(createProject);
    return createProject;
  }

  async run(key: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const { safe=false } = options;
    project.removeFolder(key, { safe });
    await this.finishProject(project, options);
  }
}
