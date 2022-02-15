import { Command, CommanderError } from 'commander';
import { ProjectFolderKind, ProjectRequestKind } from '@advanced-rest-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from './ProjectCommandBase.js';
import { ProjectCommand } from '../ProjectCommand.js';
import { parseInteger } from '../ValueParsers.js';

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
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.parentSearchOptions(cmd, true);
    ProjectCommand.outputOptions(cmd);

    cmd
      .argument('<key>', 'The key of the object to move. Names are not accepted here.')
      .description('Moves an object within a project.')
      .option('-n, --index <position>', 'The position at which to insert the object in the destination. By default it adds the object at the end.', parseInteger.bind(null, 'index'))
      .action(async (key, options) => {
        const instance = new ProjectMove();
        await instance.run(key, options);
      });
    return cmd;
  }

  async run(key: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const { definitions = [] } = project;
    const def = definitions.find(i => i.key === key);
    if (!def) {
      throw new CommanderError(0, 'ENOTFOUND', `Unable to locate the object: ${key}.`);
    }
    const { index, parent } = options;
    if (def.kind === ProjectFolderKind) {
      project.moveFolder(key, { index, parent });
    } else if (def.kind === ProjectRequestKind) {
      project.moveRequest(key, { index, parent });
    }
    await this.finishProject(project, options);
  }
}
