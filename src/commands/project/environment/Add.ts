import { Command, CommanderError } from 'commander';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { ProjectCommand } from '../../ProjectCommand.js';

export interface ICommandOptions extends IProjectCommandOptions {
  parent?: string;
  baseUri?: string;
  basePath?: string;
  protocol?: string;
  description?: string;
  serverDescription?: string;
}

/**
 * A command that adds an environment to a project.
 */
export default class ProjectEnvironmentAdd extends ProjectCommandBase {
  /**
   * The command, e.g. `project folder add`
   */
  static get command(): Command {
    const cmd = new Command('add');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.parentSearchOptions(cmd);
    ProjectCommand.outputOptions(cmd);
    cmd
      .argument('<name>', 'The name of the environment')
      .description('Creates a new environment in a project or a folder')
      .option('--description [value]', 'The description of the environment')
      .option('--base-uri [value]', 'Adds server definition to the environment. The base URI of the API or the full URI to the base endpoint')
      .option('--base-path [value]', 'Adds server definition to the environment. The path name added to the base URI.')
      .option('--protocol [value]', 'Adds server definition to the environment. The protocol to use when missing in the base URI')
      .option('--server-description [value]', 'Adds server definition to the environment. The description of the server')
      .action(async (name, options) => {
        const instance = new ProjectEnvironmentAdd(cmd);
        await instance.run(name, options);
      });
    return cmd;
  }

  async run(name: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options);
    const { parent, baseUri, basePath, protocol, description, serverDescription } = options;
    const root = parent ? project.findFolder(parent) : project;
    if (!root) {
      throw new CommanderError(0, 'ENOPARENT', `Cannot find the parent folder: ${parent}.`);
    }
    const env = root.addEnvironment(name);
    if (description) {
      env.info.description = description;
    }
    if (baseUri || basePath || protocol || serverDescription) {
      const srv = env.addServer(baseUri || '');
      if (basePath) {
        srv.basePath = basePath;
      }
      if (protocol) {
        srv.protocol = protocol;
      }
      if (serverDescription) {
        srv.description = serverDescription;
      }
    }
    await this.finishProject(project, options);
  }
}
