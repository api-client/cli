import { Command } from 'commander';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { printRequestInfo } from './Utils.js';
import { ProjectCommand } from '../../ProjectCommand.js';

export interface ICommandOptions extends IProjectCommandOptions {
  keyOnly?: boolean;
  reporter?: 'json' | 'table';
}

/**
 * A command that reads a request from a project.
 */
export default class ProjectRequestGet extends ProjectCommandBase {
  static get command(): Command {
    const cmd = new Command('get');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.reporterOptions(cmd);
    ProjectCommand.keyListingOptions(cmd);
    cmd
      .argument('<key>', 'The id of the request.')
      .description('Reads the request from the project and prints it to the console.')
      .action(async (key, options) => {
        const instance = new ProjectRequestGet();
        await instance.run(key, options);
      });
    return cmd;
  }

  async run(key: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const request = project.findRequest(key, { keyOnly: true });
    if (!request) {
      throw new Error(`The request "${key}" not found in the project.`);
    }
    const { keyOnly, reporter='table' } = options;
    if (keyOnly) {
      this.println(request.key)
      return;
    }
    if (reporter === 'json') {
      const content = options.prettyPrint ? JSON.stringify(request, null, 2) : JSON.stringify(request);
      this.println(content);
      return;
    }
    if (reporter === 'table') {
      printRequestInfo(request);
      return;
    }
    throw new Error(`Unknown reporter ${reporter}`);
  }
}
