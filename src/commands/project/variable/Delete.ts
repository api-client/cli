import { Command, CommanderError } from 'commander';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { ProjectCommand } from '../../ProjectCommand.js';
import { findEnvironment } from '../environment/Utils.js';
export interface ICommandOptions extends IProjectCommandOptions {
  safe?: boolean;
}

/**
 * A command that deletes a  variable from an environment.
 */
export default class EnvironmentVariableDelete extends ProjectCommandBase {
  static get command(): Command {
    const cmd = new Command('delete');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.outputOptions(cmd);

    cmd
      .argument('<environment key>', 'The key of the parent environment')
      .argument('<variable name>', 'The name of the variable')
      .description('Removes a variable from an environment')
      .option('-S, --safe', 'Does not print an error when the variable or environment does not exist.')
      .action(async (key, name, options) => {
        const instance = new EnvironmentVariableDelete();
        await instance.run(key, name, options);
      });
    
    return cmd;
  }

  async run(key: string, name: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const environment = findEnvironment(key, project);
    const { safe=false } = options;
    
    if (!environment) {
      if (safe) {
        return this.finishProject(project, options);
      }
      throw new CommanderError(0, 'ENOENV', `The environment "${key}" not found in the project.`);
    }

    const index = environment.variables.findIndex(i => i.name === name);
    if (index < 0) {
      if (safe) {
        return this.finishProject(project, options);
      }
      throw new CommanderError(0, 'ENOVAR', `The variable "${name}" not found in the environment.`);
    }
    environment.variables.splice(index, 1);
    await this.finishProject(project, options);
  }
}
