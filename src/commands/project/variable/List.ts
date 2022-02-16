import { Command, CommanderError } from 'commander';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { ProjectCommand } from '../../ProjectCommand.js';
import { findEnvironment } from '../environment/Utils.js';
import { printVariablesTable } from './Utils.js';

export interface ICommandOptions extends IProjectCommandOptions {
  reporter?: 'json' | 'table';
}

/**
 * A command that lists variables in an environment.
 */
export default class ProjectVariableList extends ProjectCommandBase {
  static get command(): Command {
    const cmd = new Command('list');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.parentSearchOptions(cmd);
    ProjectCommand.reporterOptions(cmd);

    cmd
      .argument('<environment key>', 'The key of the parent environment')
      .description('Lists variables in an environment.\nVariable names are not visible by default. Use the --show-values to render the value.')
      .action(async (key, options) => {
        const instance = new ProjectVariableList();
        await instance.run(key, options);
      });
    return cmd;
  }

  async run(key: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const environment = findEnvironment(key, project);
    if (!environment) {
      throw new CommanderError(0, 'ENOENV', `The environment "${key}" not found in the project.`);
    }

    const { variables=[] } = environment;
    const { reporter='table' } = options;
    if (reporter === 'json') {
      const content = options.prettyPrint ? JSON.stringify(variables, null, 2) : JSON.stringify(variables);
      this.println(content);
      return;
    }
    if (reporter === 'table') {
      printVariablesTable(variables);
      return;
    }
  }
}
