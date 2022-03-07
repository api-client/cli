import { Command } from 'commander';
import { HttpProject } from '@api-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from './ProjectCommandBase.js';
import { ProjectCommand } from '../ProjectCommand.js';

export interface ICommandOptions extends IProjectCommandOptions {
  projectVersion?: string;
}

/**
 * A command that creates a new HTTP project.
 */
export default class ProjectCreate extends ProjectCommandBase {
  /**
   * The command, e.g. `project request add`
   */
  static get command(): Command {
    const cmd = new Command('create');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.outputOptions(cmd);
    cmd
      .argument('<name>', 'The name of the project to create')
      .description('Creates a new HTTP project')
      .option('-v, --project-version [value]', 'Sets the version of the project')
      .action(async (projectName, options) => {
        const instance = new ProjectCreate();
        await instance.run(projectName, options);
      });
    return cmd;
  }

  /**
   * Runs the command to create a new HTTP project.
   * @param projectName The name of the project to set.
   * @param options Command options.
   */
  async run(projectName: string, options: ICommandOptions): Promise<void> {
    const project = this.createProject(projectName, options);
    await this.finishProject(project, options);
  }

  /**
   * Creates an instance of an HTTP project from the passed options.
   * @param projectName The name of the project to set.
   * @param options Command options.
   */
  createProject(projectName: string, options: ICommandOptions): HttpProject {
    const project = HttpProject.fromName(projectName);
    if (options.projectVersion) {
      const { info } = project;
      info.version = options.projectVersion;
    }
    return project;
  }
}
