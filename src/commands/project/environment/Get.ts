import { Command } from 'commander';
import { ProjectFolderKind, ProjectFolder, Environment } from '@advanced-rest-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { printEnvironmentInfo } from './Utils.js';
import { ProjectCommand } from '../../ProjectCommand.js';

export interface ICommandOptions extends IProjectCommandOptions {
  keyOnly?: boolean;
  reporter?: 'json' | 'table';
}

/**
 * A command that reads an environment from a project.
 */
export default class ProjectEnvironmentGet extends ProjectCommandBase {
  
  static get command(): Command {
    const cmd = new Command('get');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.reporterOptions(cmd);
    ProjectCommand.keyListingOptions(cmd);

    cmd
      .argument('<key>', 'The id of the environment.')
      .description('Reads the environment from the project and prints it to the console.')
      .action(async (key, options) => {
        const instance = new ProjectEnvironmentGet();
        await instance.run(key, options);
      });
    return cmd;
  }

  async run(key: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    let environment: Environment | undefined;
    if (Array.isArray(project.environments)) {
      environment = project.environments.find(i => i.key === key);
    }
    if (!environment) {
      for (const def of project.definitions) {
        if (environment) {
          break;
        }
        if (def.kind !== ProjectFolderKind) {
          return;
        }
        const folder = def as ProjectFolder;
        environment = folder.environments.find(i => i.key === key);
      }
    }
    if (!environment) {
      throw new Error(`The environment "${key}" not found in the project.`);
    }
    const { keyOnly, reporter='table' } = options;
    if (keyOnly) {
      this.println(environment.key)
      return;
    }
    if (reporter === 'json') {
      const content = options.prettyPrint ? JSON.stringify(environment, null, 2) : JSON.stringify(environment);
      this.println(content);
      return;
    }
    if (reporter === 'table') {
      printEnvironmentInfo(environment);
      return;
    }
    throw new Error(`Unknown reporter ${reporter}`);
  }
}
