import { Command } from 'commander';
import { ProjectFolderKind, ProjectFolder, ProjectRequestKind, ProjectRequest } from '@advanced-rest-client/core';
import { printFolderTable } from './folder/Utils.js';
import { printRequestTable } from './request/Utils.js';
import { ProjectCommandBase, IProjectCommandOptions } from './ProjectCommandBase.js';
import { ProjectCommand } from '../ProjectCommand.js';

export interface ICommandOptions extends IProjectCommandOptions {
  reporter?: 'json' | 'table';
}

/**
 * A command that describes an object found in the project.
 */
export default class ProjectDescribe extends ProjectCommandBase {
  static get command(): Command {
    const cmd = new Command('describe');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.outputOptions(cmd);
    ProjectCommand.reporterOptions(cmd);
    cmd
      .argument('<key>', 'The key of the object to describe. Names are not accepted here.')
      .description('Describes an object from the project.')
      .action(async (key, options) => {
        const instance = new ProjectDescribe();
        await instance.run(key, options);
      });
    return cmd;
  }

  async run(key: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const { definitions=[] } = project;
    const object = definitions.find(i => i.key === key);
    if (!object) {
      throw new Error(`Object not found in the project.`);
    }
    if (object.kind === ProjectRequestKind) {
      this.printRequest(object as ProjectRequest, options);
    } else if (object.kind === ProjectFolderKind) {
      this.printFolder(object as ProjectFolder, options);
    } else {
      throw new Error(`Unsupported object type ${object.kind}`);
    }
  }

  printFolder(object: ProjectFolder, options: ICommandOptions): void {
    if (options.reporter === 'json') {
      const content = options.prettyPrint ? JSON.stringify(object, null, 2) : JSON.stringify(object);
      this.println(content);
    } else if (options.reporter === 'table') {
      printFolderTable([object]);
    }
  }

  printRequest(object: ProjectRequest, options: ICommandOptions): void {
    if (options.reporter === 'json') {
      const content = options.prettyPrint ? JSON.stringify(object, null, 2) : JSON.stringify(object);
      this.println(content);
    } else if (options.reporter === 'table') {
      printRequestTable([object]);
    }
  }
}
