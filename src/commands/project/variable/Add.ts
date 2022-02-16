import { Command, CommanderError, Option } from 'commander';
import { Property } from '@advanced-rest-client/core'
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { ProjectCommand } from '../../ProjectCommand.js';
import { findEnvironment } from '../environment/Utils.js';

export interface ICommandOptions extends IProjectCommandOptions {
  name: string;
  value?: string;
  disabled?: boolean;
  type?: string;
}

/**
 * A command that adds a variable to an environment.
 */
export default class EnvironmentVariableAdd extends ProjectCommandBase {
  static get command(): Command {
    const cmd = new Command('add');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.outputOptions(cmd);

    const typeOption = new Option(
      '-t, --type <value>', 
      `The data type of the variable. It is a "string" by default.`
    ).choices(Property.supportedTypes).default('string');
    cmd.addOption(typeOption);
    cmd
      .argument('<environment key>', 'The key of the parent environment')
      .description('Adds a variable to an environment.')
      .option('--name <value>', 'The name of the variable')
      .option('--value [value]', 'The value of the variable. Can be unset but by default a string is assumed.')
      .option('--disabled', 'Whether the variable is disabled.')
      .action(async (key, options) => {
        const instance = new EnvironmentVariableAdd();
        await instance.run(key, options);
      });
    return cmd;
  }

  async run(key: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const environment = findEnvironment(key, project);
    if (!environment) {
      throw new CommanderError(0, 'ENOENV', `The environment "${key}" not found in the project.`);
    }

    const { disabled, type='string', value, name  } = options;
    let variable: Property;
    switch (type) {
      case 'date': 
      case 'datetime': 
      case 'time':
      case 'string': 
        variable = environment.addVariable(name, value || ''); 
        break;
      case 'int32':
      case 'int64': 
      case 'uint32': 
      case 'uint64': 
      case 'sint32': 
      case 'sint64': 
      case 'fixed32': 
      case 'fixed64':
      case 'sfixed32': 
      case 'sfixed64': 
      case 'double': 
      case 'integer': 
      case 'float': 
        variable = environment.addVariable(name, value ? Number(value) : 0); 
        break;
      case 'nil': variable = environment.addVariable(name, null); break;
      case 'boolean': variable = environment.addVariable(name, value === 'true' ? true : false); break;
      case 'bytes':
        variable = environment.addVariable(name, value || ''); 
        break;
      default: throw new CommanderError(0, 'EPROPERTYTYPE', `Unknown property type ${type}`);
    }
    if (disabled) {
      variable.enabled = false;
    }
    await this.finishProject(project, options);
  }
}
