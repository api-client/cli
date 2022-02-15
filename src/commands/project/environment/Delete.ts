import { Command, CommanderError } from 'commander';
import { ProjectFolder, ProjectFolderKind } from '@advanced-rest-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { ProjectCommand } from '../../ProjectCommand.js';

export interface ICommandOptions extends IProjectCommandOptions {
  safe?: boolean;
}

/**
 * A command that deletes an environment from a project.
 */
export default class ProjectEnvironmentDelete extends ProjectCommandBase {
  static get command(): Command {
    const cmd = new Command('delete');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.outputOptions(cmd);

    cmd
      .argument('<key>', 'The id of the environment. It ignores the name when searching to an environment to avoid ambiguity.')
      .description('Removes an environment from the project')
      .option('-S, --safe', 'Does not print an error when the environment does not exist.')
      .action(async (key, options) => {
        const instance = new ProjectEnvironmentDelete();
        await instance.run(key, options);
      });
    
    return cmd;
  }

  async run(key: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const { safe=false } = options;
    let removed = false;
    if (Array.isArray(project.environments)) {
      const index = project.environments.findIndex(i => i.key === key);
      if (index !== -1) {
        project.environments.splice(index, 1);
        removed = true;
      }
    }
    if (!removed) {
      for (const def of project.definitions) {
        const folder = def as ProjectFolder;
        if (folder.kind !== ProjectFolderKind || !Array.isArray(folder.environments)) {
          continue;
        }
        const index = folder.environments.findIndex(i => i.key === key);
        if (index !== -1) {
          folder.environments.splice(index, 1);
          removed = true;
          break;
        }
      }
    }
    if (!removed && !safe) {
      throw new CommanderError(0, 'EENVNOTFOUND', `The environment cannot be found: ${key}.`);
    }
    await this.finishProject(project, options);
  }
}
