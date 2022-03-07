import { Command } from 'commander';
import { ProjectRequest } from '@advanced-rest-client/core';
import FlexSearch from 'flexsearch';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { printRequestTable, printRequestKeys } from './Utils.js';
import { ProjectCommand } from '../../ProjectCommand.js';

export interface ICommandOptions extends IProjectCommandOptions {
  keyOnly?: boolean;
  reporter?: 'json' | 'table';
}

/**
 * A command that finds a request in a project.
 */
export default class ProjectRequestFind extends ProjectCommandBase {
  
  static get command(): Command {
    const cmd = new Command('find');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.reporterOptions(cmd);
    ProjectCommand.keyListingOptions(cmd);
    
    cmd
      .argument('<query>', 'The query to use to search for a request.')
      .description('Finds requests in the project and prints it to the console.')
      .action(async (key, options) => {
        const instance = new ProjectRequestFind();
        await instance.run(key, options);
      });
    return cmd;
  }

  async run(query: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const all = project.definitions.requests;
    // eslint-disable-next-line import/no-named-as-default-member
    const index = new FlexSearch.Document({
      document: {
        id: 'key',
        index: [
          'info:name',
          'info:description',
          'expects:method',
          'expects:url',
          'expects:headers',
          'log:response:headers',
        ],
      },
      charset: 'latin:extra',
      tokenize: 'reverse',
      resolution: 9,
    });
    all.forEach((request) => {
      const typed = request as ProjectRequest;
      index.add(typed.toJSON());
    });
    const result = index.search(query);
    const requests: ProjectRequest[] = [];
    const ids: string[] = [];
    
    result.forEach((result) => {
      result.result.forEach((id) => {
        const key = id.toString();
        if (ids.includes(key)) {
          return;
        }
        ids.push(key);
        const request = project.findRequest(key, { keyOnly: true }) as ProjectRequest;
        requests.push(request);
      });
    });

    const { keyOnly, reporter='table' } = options;
    if (keyOnly) {
      printRequestKeys(requests);
      return;
    }
    if (reporter === 'json') {
      const content = options.prettyPrint ? JSON.stringify(requests, null, 2) : JSON.stringify(requests);
      this.println(content);
      return;
    }
    if (reporter === 'table') {
      printRequestTable(requests);
      return;
    }
  }
}
