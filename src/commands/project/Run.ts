import { Command, CommanderError } from 'commander';
import { ProjectRunner, DummyLogger, Environment } from '@advanced-rest-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from './ProjectCommandBase.js';
import { ProjectCommand } from '../ProjectCommand.js';

export interface ICommandOptions extends IProjectCommandOptions {
  environment?: string;
  parent?: string;
}

/**
 * A command that clones an HTTP project.
 */
export default class ProjectRun extends ProjectCommandBase {
  static get command(): Command {
    const cmd = new Command('clone');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.parentSearchOptions(cmd);

    cmd
      .description('Makes a copy of a project.')
      .option('--environment [key or name]', 'The name or the key of the environment to use.')
      .action(async (options) => {
        const instance = new ProjectRun();
        await instance.run(options);
      });
    return cmd;
  }

  /**
   * Runs the command to clone an HTTP project.
   * @param options Command options.
   */
  async run(options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const { environment, parent } = options;
    const root = parent ? project.findFolder(parent) : project;
    if (!root) {
      throw new Error(`Unable to locate the folder: ${parent}`);
    }
    let useEnvironment: Environment | undefined;
    if (environment) {
      useEnvironment = root.environments.find(i => i.key === environment || i.info.name === environment);
      if (!useEnvironment) {
        throw new CommanderError(0, 'EENVNOTFOUND', `The environment cannot be found: ${environment}.`);
      }
    }
    const runner = new ProjectRunner(project, useEnvironment);
    runner.logger = new DummyLogger();

    console.clear();
    // const result = await runner.run(parent);
    
  }
}
