import { Command, CommanderError } from 'commander';
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
        const instance = new ProjectMove(cmd);
        await instance.run(key, options);
      });
    return cmd;
  }

  async run(key: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options);
    const { definitions } = project;
    const { index, parent } = options;
    const request = definitions.requests.find(i => i.key === key);
    let moved = false;
    if (request) {
      project.moveRequest(key, { index, parent });
      moved = true;
    }
    if (!moved) {
      const folder = definitions.folders.find(i => i.key === key);
      if (folder) {
        project.moveFolder(key, { index, parent });
        moved = true;
      }
    }
    if (!moved) {
      throw new CommanderError(0, 'ENOTFOUND', `Unable to locate the object: ${key}.`);
    }
    await this.finishProject(project, options);
  }
}
