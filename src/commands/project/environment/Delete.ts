import { Command, CommanderError } from 'commander';
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
      .option('-s, --safe', 'Does not print an error when the environment does not exist.')
      .action(async (key, options) => {
        const instance = new ProjectEnvironmentDelete(cmd);
        await instance.run(key, options);
      });
    
    return cmd;
  }

  async run(key: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options);
    const { safe=false } = options;
    // first find and remove the definition of the environment
    const index = project.definitions.environments.findIndex(i => i.key === key);
    if (index < 0) {
      if (safe) {
        await this.finishProject(project, options);
        return;
      }
      throw new CommanderError(0, 'EENVNOTFOUND', `The environment cannot be found: ${key}.`);
    }
    project.definitions.environments.splice(index, 1);

    // now find where the env is applied and remove it from there.
    if (project.environments.includes(key)) {
      const index = project.environments.indexOf(key);
      project.environments.splice(index, 1);
    } else {
      for (const folder of project.definitions.folders) {
        if (!Array.isArray(folder.environments)) {
          continue;
        }
        const index = folder.environments.indexOf(key);
        if (index !== -1) {
          folder.environments.splice(index, 1);
          break;
        }
      }
    }
    await this.finishProject(project, options);
  }
}
