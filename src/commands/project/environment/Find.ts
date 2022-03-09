import { Command } from 'commander';
import FlexSearch from 'flexsearch';
import { Environment } from '@api-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { printEnvironmentTable, printEnvironmentKeys,  } from './Utils.js';
import { ProjectCommand } from '../../ProjectCommand.js';

export interface ICommandOptions extends IProjectCommandOptions {
  keyOnly?: boolean;
  reporter?: 'json' | 'table';
}

/**
 * A command that finds environments in a project.
 */
export default class ProjectEnvironmentFind extends ProjectCommandBase {
  static get command(): Command {
    const cmd = new Command('find');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.reporterOptions(cmd);
    ProjectCommand.keyListingOptions(cmd);

    const description = [
      'Finds environments in the project and prints it to the console.',
      'You can search for environment name, base URI, or in variables by the name of the value.'
    ];
    
    cmd
      .argument('<query>', 'The query to use to search for an environment.')
      .description(description.join('\n'))
      .action(async (query, options) => {
        const instance = new ProjectEnvironmentFind(cmd);
        await instance.run(query, options);
      });
    return cmd;
  }

  async run(query: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options);
    const all = project.definitions.environments;
    
    // eslint-disable-next-line import/no-named-as-default-member
    const index = new FlexSearch.Document({
      document: {
        id: 'id',
        index: [
          'doc:info:name',
          'doc:info:description',
          'doc:server:uri',
          'doc:variables[]:name',
          'doc:variables[]:value',
        ],
      },
      charset: 'latin:extra',
      tokenize: 'reverse',
      resolution: 9,
    });
    all.forEach((environment, i) => {
      const typed = environment as Environment;
      index.add({
        id: i,
        doc: typed.toJSON(),
      });
    });
    const result = index.search(query);
    const environments: Environment[] = [];
    const ids: number[] = [];
    
    result.forEach((result) => {
      result.result.forEach((id) => {
        const i = Number(id);
        if (ids.includes(i)) {
          return;
        }
        ids.push(i);
        environments.push(all[i]);
      });
    });

    const { keyOnly, reporter='table' } = options;
    if (keyOnly) {
      printEnvironmentKeys(environments)
      return;
    }
    if (reporter === 'json') {
      const content = options.prettyPrint ? JSON.stringify(environments, null, 2) : JSON.stringify(environments);
      this.println(content);
      return;
    }
    if (reporter === 'table') {
      printEnvironmentTable(environments);
      return;
    }
  }
}
