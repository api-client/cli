import { Command } from 'commander';
import FlexSearch from 'flexsearch';
import { ProjectFolder } from '@api-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { printFolderTable, printFolderKeys,  } from './Utils.js';
import { ProjectCommand } from '../../ProjectCommand.js';

export interface ICommandOptions extends IProjectCommandOptions {
  keyOnly?: boolean;
  reporter?: 'json' | 'table';
}

/**
 * A command that finds a folder in a project.
 */
export default class ProjectFolderFind extends ProjectCommandBase {
  /**
   * The command, e.g. `project folder find "my folder"`
   */
  static get command(): Command {
    const cmd = new Command('find');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.reporterOptions(cmd);
    ProjectCommand.keyListingOptions(cmd);
    
    cmd
      .argument('<query>', 'The query to use to search for a folder.')
      .description('Finds folders in the project and prints it to the console.')
      .action(async (query, options) => {
        const instance = new ProjectFolderFind();
        await instance.run(query, options);
      });
    return cmd;
  }

  async run(query: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const all = project.definitions.folders;
    // eslint-disable-next-line import/no-named-as-default-member
    const index = new FlexSearch.Document({
      document: {
        id: 'key',
        index: [
          'info:name',
          'info:description',
        ],
      },
      charset: 'latin:extra',
      tokenize: 'reverse',
      resolution: 9,
    });
    all.forEach((request) => {
      const typed = request as ProjectFolder;
      index.add(typed.toJSON());
    });
    const result = index.search(query);
    const folders: ProjectFolder[] = [];
    const ids: string[] = [];
    
    result.forEach((result) => {
      result.result.forEach((id) => {
        const key = id.toString();
        if (ids.includes(key)) {
          return;
        }
        ids.push(key);
        const request = project.findFolder(key, { keyOnly: true }) as ProjectFolder;
        folders.push(request);
      });
    });

    const { keyOnly, reporter='table' } = options;
    if (keyOnly) {
      printFolderKeys(folders)
      return;
    }
    if (reporter === 'json') {
      const content = options.prettyPrint ? JSON.stringify(folders, null, 2) : JSON.stringify(folders);
      this.println(content);
      return;
    }
    if (reporter === 'table') {
      printFolderTable(folders);
      return;
    }
  }
}
