import { Command, CommanderError } from 'commander';
import { IProperty } from '@advanced-rest-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { ProjectCommand } from '../../ProjectCommand.js';
import { findEnvironment } from '../environment/Utils.js';
import { printVariablesTable } from './Utils.js';

export interface ICommandOptions extends IProjectCommandOptions {
  reporter?: 'json' | 'table';
  showValues?: boolean;
}

/**
 * A command that lists variables in an environment.
 */
export default class EnvironmentVariableList extends ProjectCommandBase {
  static get command(): Command {
    const cmd = new Command('list');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.parentSearchOptions(cmd);
    ProjectCommand.reporterOptions(cmd);

    cmd
      .argument('<environment key>', 'The key of the parent environment')
      .description('Lists variables in an environment.\nVariable names are not visible by default. Use the --show-values to render the value.')
      .option('--show-values', 'When set it renders the values of variables to the console output.')
      .action(async (key, options) => {
        const instance = new EnvironmentVariableList();
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
    const { reporter='table', showValues } = options;
    if (reporter === 'json') {
      const data: IProperty[] = [];
      variables.forEach((item) => {
        const value = item.toJSON();
        if (!showValues) {
          value.value  = '***';
        }
        data.push(value);
      });
      const content = JSON.stringify(data, null, options.prettyPrint ? 2 : 0);
      this.println(content);
      return;
    }
    if (reporter === 'table') {
      printVariablesTable(variables, showValues);
      return;
    }
  }
}
