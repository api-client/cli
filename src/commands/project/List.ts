import { Command, Argument } from 'commander';
import { Table } from 'console-table-printer';
import { HttpProject, ProjectFolderKind, ProjectFolder, ProjectRequestKind, ProjectRequest } from '@advanced-rest-client/core';
import { printFolderKeys, printFolderTable } from './folder/Utils.js';
import { printRequestTable, printRequestKeys } from './request/Utils.js';
import { printEnvironmentTable, printEnvironmentKeys } from './environment/Utils.js';
import { ProjectCommandBase, IProjectCommandOptions } from './ProjectCommandBase.js';
import { ProjectCommand } from '../ProjectCommand.js';

export interface ICommandOptions extends IProjectCommandOptions {
  keyOnly?: boolean;
  reporter?: 'json' | 'table';
  parent?: string;
}

export type ProjectTypes = 'folders' | 'requests' | 'environments' | 'children';

/**
 * A command that lists project's items.
 */
export default class ProjectList extends ProjectCommandBase {
  /**
   * The command, e.g. `project folder add`
   */
  static get command(): Command {
    const cmd = new Command('list');
    const typeArgument = new Argument(
      '<type>', 
      'The type of the objects to list.'
    ).choices(['folders', 'requests', 'environments', 'children']);
    cmd.addArgument(typeArgument);
    
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.reporterOptions(cmd);
    ProjectCommand.parentSearchOptions(cmd);
    ProjectCommand.keyListingOptions(cmd);

    cmd
      .description('Lists project items by type.')
      .action(async (type, options) => {
        const instance = new ProjectList();
        await instance.run(type, options);
      });
    
    return cmd;
  }

  async run(type: ProjectTypes, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    switch (type) {
      case 'folders': return this.listFolders(project, options);
      case 'requests': return this.listRequests(project, options);
      case 'environments': return this.listEnvironments(project, options);
      case 'children': return this.listChildren(project, options);
      default: throw new Error(`Unknown entity type: ${type}`);
    }
  }

  listFolders(project: HttpProject, options: ICommandOptions): void {
    const items = project.listFolders({ folder: options.parent });
    if (options.keyOnly) {
      printFolderKeys(items);
      return;
    }
    if (options.reporter === 'json') {
      const contents = JSON.stringify(items, null, options.prettyPrint ? 2 : 0);
      this.println(contents);
      return;
    }
    if (options.reporter === 'table') {
      printFolderTable(items);
      return;
    }
    throw new Error(`Unknown reporter ${options.reporter}`);
  }

  listRequests(project: HttpProject, options: ICommandOptions): void {
    const items = project.listRequests(options.parent);
    if (options.keyOnly) {
      printRequestKeys(items);
      return;
    }
    if (options.reporter === 'json') {
      const contents = JSON.stringify(items, null, options.prettyPrint ? 2 : 0);
      this.println(contents);
      return;
    }
    if (options.reporter === 'table') {
      printRequestTable(items);
      return;
    }
    throw new Error(`Unknown reporter ${options.reporter}`);
  }

  async listEnvironments(project: HttpProject, options: ICommandOptions): Promise<void> {
    const root = options.parent ? project.findFolder(options.parent, { keyOnly: true }) : project;
    if (!root) {
      throw new Error(`Unable to locate the folder: ${options.parent}`);
    }
    const envs = root.getEnvironments();
    if (options.keyOnly) {
      printEnvironmentKeys(envs);
      return;
    }
    if (options.reporter === 'json') {
      const contents = JSON.stringify(envs, null, options.prettyPrint ? 2 : 0);
      this.println(contents);
      return;
    }
    if (options.reporter === 'table') {
      printEnvironmentTable(envs);
      return;
    }
    throw new Error(`Unknown reporter ${options.reporter}`);
  }

  listChildren(project: HttpProject, options: ICommandOptions): void {
    const table = new Table({
      columns: [
        { name: 'kind', title: 'Kind', alignment: 'left' },
        { name: 'key', title: 'Key', alignment: 'left' },
        { name: 'name', title: 'Name', alignment: 'right' },
      ],
    });
    const definitions = project.listDefinitions(options.parent);
    definitions.forEach((object) => {
      if (object.kind === ProjectFolderKind) {
        const item = object as ProjectFolder;
        table.addRow({
          kind: item.kind,
          key: item.key,
          name: item.info.name,
        });
      } else if (object.kind === ProjectRequestKind) {
        const item = object as ProjectRequest;
        const { info } = item;
        const name = info ? info.name : '';
        table.addRow({
          kind: item.kind,
          key: item.key,
          name: name,
        });
      }
    });
    table.printTable();
  }
}
