import { Command, CommanderError } from 'commander';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { printEnvironmentInfo, findEnvironment } from './Utils.js';
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
    const cmd = new Command('read');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.reporterOptions(cmd);
    ProjectCommand.keyListingOptions(cmd);

    cmd
      .argument('<key>', 'The id of the environment.')
      .description('Reads the environment from the project and prints it to the console.')
      .action(async (key, options) => {
        const instance = new ProjectEnvironmentGet(cmd);
        await instance.run(key, options);
      });
    return cmd;
  }

  async run(key: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options);
    const environment = findEnvironment(key, project);
    if (!environment) {
      throw new CommanderError(0, 'ENOENV', `The environment "${key}" not found in the project.`);
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
