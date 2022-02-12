import { Command } from 'commander';
import { ProjectFolderKind, ProjectRequestKind } from '@advanced-rest-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from './ProjectCommandBase.js';

export interface ICommandOptions extends IProjectCommandOptions {
  index?: number;
  parent?: string;
}

/**
 * A command that moves objects withing a project.
 */
export default class ProjectMove extends ProjectCommandBase {
  static get command(): Command {
    const cmd = new Command('move');
    cmd
      .argument('<key>', 'The key of the object to move. Names are not accepted here.')
      .description('Moves an object within a project.')
      .option('-p, --parent <value>', 'The name or the key of the parent folder to move the item into. When not set it assumes the project\'s root.')
      .option('-n, --index <position>', 'The position at which to insert the object in the destination. BY default it adds the object at the end.')
      .action(async (key, options) => {
        const instance = new ProjectMove();
        await instance.run(key, options);
      });
    ProjectCommandBase.defaultOptions(cmd);
    return cmd;
  }

  async run(key: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const { definitions = [] } = project;
    const def = definitions.find(i => i.key === key);
    if (!def) {
      throw new Error(`Unable to locate the object ${key}`);
    }
    const { index, parent } = options;
    if (def.kind === ProjectFolderKind) {
      project.moveFolder(key, { index, parent });
    } else if (def.kind === ProjectRequestKind) {
      project.moveRequest(key, { index, parent });
    }
    this.finishProject(project, options);
  }
}
