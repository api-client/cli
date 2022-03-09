import { Command } from 'commander';
import { ProjectCommandBase, IProjectCommandOptions } from './ProjectCommandBase.js';
import { ProjectCommand } from '../ProjectCommand.js';
import { ProjectExeFactory } from '../../runner/ProjectExeFactory.js';
import { ProjectExeOptions } from '../../runner/ProjectExe.js';
import { ProjectParallelExeFactory } from '../../runner/ProjectParallelExeFactory.js';
import { parseInteger } from '../ValueParsers.js'

export interface ICommandOptions extends IProjectCommandOptions, ProjectExeOptions {
  
}

/**
 * A command that executes requests in an HTTP project.
 */
export default class ProjectRun extends ProjectCommandBase {
  static get command(): Command {
    const cmd = new Command('run');
    
    cmd
      .description('Executes requests from the project.')
      .option('-e, --environment [key, name, or path]', 'The name or the key of the environment to use or a path to the environment definition (in JSON format).')
      .option('-r, --request [key or name...]', 'The name or the key of a request to execute from the parent folder or the project.')
      .option('-r, --ignore [key or name...]', 'The name or the key of a request to ignore when collecting the requests information.')
      .option('-n, --iterations [number]', 'The number of times the execution should be repeated.', parseInteger.bind(null, 'iterations'))
      .option('-d, --iteration-delay [number]', 'The number of milliseconds to wait between each iteration. Default to the next frame (vary from 1 to tens of milliseconds).', parseInteger.bind(null, 'iteration-delay'))
      .option('--parallel', 'Performs a parallel execution for each iteration.')
      .option('--recursive', 'Runs all requests in the selected folder or the project root and from all sub-folders in order.')
      .action(async (options) => {
        const instance = new ProjectRun(cmd);
        await instance.run(options);
      });
    ProjectCommand.parentSearchOptions(cmd);
    ProjectCommand.globalOptions(cmd);
    return cmd;
  }

  /**
   * Runs the command to clone an HTTP project.
   * @param options Command options.
   */
  async run(options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options);
    if (options.parallel) {
      const factory = new ProjectParallelExeFactory(project, options);
      await factory.run();
    } else {
      // eslint-disable-next-line no-inner-declarations
      function unhandledRejection(): void {}
      // the executing library handles all related errors it need.
      // However, when executing a request to an unknown host Node process may 
      // throw unhandled error event when the error is properly reported by the 
      // application. This suppresses these errors.
      // Note, uncomment this line for debug.
      process.on('unhandledRejection', unhandledRejection);

      const factory = new ProjectExeFactory();
      await factory.configure(project, options);
      await factory.execute();
    }
  }
}
