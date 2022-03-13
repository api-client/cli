import { Command } from 'commander';
import { HttpProject } from '@api-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from './ProjectCommandBase.js';
import { ProjectCommand } from '../ProjectCommand.js';
import { printProjectInfo } from './Utils.js';

export interface ICommandOptions extends IProjectCommandOptions {
  projectVersion?: string;
}

export default class ProjectAdd extends ProjectCommandBase {
  /**
   * The command, e.g. `project request add`
   */
  static get command(): Command {
    const cmd = new Command('add');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.outputOptions(cmd);
    cmd
      .argument('<name>', 'The name of the project to create')
      .description('Creates a new HTTP project. Depending on the configuration it creates the project in the data store, file, our prints the project to the terminal.')
      .option('-v, --project-version [value]', 'Sets the version of the project')
      .action(async (projectName, options) => {
        const instance = new ProjectAdd(cmd);
        await instance.run(projectName, options);
      });
    return cmd;
  }

  /**
   * Runs the command to create a new HTTP project.
   * @param projectName The name of the project to set.
   * @param options Command options.
   */
  async run(projectName: string, options: ICommandOptions={}): Promise<void> {
    const project = this.createProject(projectName, options);
    await this.finishProject(project, options);
  }

  /**
   * Creates an instance of an HTTP project from the passed options.
   * @param projectName The name of the project to set.
   * @param options Command options.
   */
  createProject(projectName: string, options: ICommandOptions={}): HttpProject {
    const project = HttpProject.fromName(projectName);
    if (options.projectVersion) {
      const { info } = project;
      info.version = options.projectVersion;
    }
    return project;
  }

  /**
   * Custom save function to mitigate missing project snapshot 
   */
  protected async finishProjectStore(result: HttpProject, options: IProjectCommandOptions): Promise<void> {
    const sdk = await this.getAuthenticatedSdk(options);
    const { space } = options;
    const altered = result.toJSON();
    const id = await sdk.project.create(space as string, altered);
    const created = await sdk.project.read(space as string, id);
    printProjectInfo(new HttpProject(created));
  }
}
