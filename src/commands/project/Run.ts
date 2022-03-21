import { Command } from 'commander';
import { 
  HttpProject, IProjectRunnerOptions, ProjectRunCliReporter, IProjectExecutionLog, 
  IHttpHistoryBulkAdd,
} from '@api-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from './ProjectCommandBase.js';
import { ProjectCommand } from '../ProjectCommand.js';
import { parseInteger } from '../ValueParsers.js';
import { ParallelRun } from './run/ParallelRun.js';
import { SerialRun } from './run/SerialRun.js';
import app from '../../lib/CliApp.js';

export interface ICommandOptions extends IProjectCommandOptions, IProjectRunnerOptions {
  history?: boolean;
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
      .option('-i, --ignore [key or name...]', 'The name or the key of a request to ignore when collecting the requests information.')
      .option('-n, --iterations [number]', 'The number of times the execution should be repeated.', parseInteger.bind(null, 'iterations'))
      .option('-d, --iteration-delay [number]', 'The number of milliseconds to wait between each iteration. Default to the next frame (vary from 1 to tens of milliseconds).', parseInteger.bind(null, 'iteration-delay'))
      .option('--parallel', 'Performs a parallel execution for each iteration.')
      .option('--recursive', 'Runs all requests in the selected folder or the project root and from all sub-folders in order.')
      .option('-h, --history', 'Saves the execution of each request in the history. It is ignored in parallel mode and when the environment is not a store.')
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
  async run(options: ICommandOptions={}): Promise<void> {
    const project = await this.readProject(options);
    if (options.parallel) {
      await this.runParallel(project, options);
    } else {
      await this.runSerial(project, options);
    }
  }

  /**
   * Runs the project in the parallel mode.
   * Prints out the workers status and the summary.
   */
  protected async runParallel(project: HttpProject, options: ICommandOptions={}): Promise<void> {
    const factory = new ParallelRun(project, options);
    const report = await factory.execute();
    const reporter = new ProjectRunCliReporter(report);
    process.stdout.write('\n');
    await reporter.generate();
  }

  /**
   * Runs the project in the serial mode.
   * Prints out the status pof each request for each iteration.
   */
  protected async runSerial(project: HttpProject, options: ICommandOptions={}): Promise<void> {
    // eslint-disable-next-line no-inner-declarations
    function unhandledRejection(): void {}
    // the executing library handles all related errors it need.
    // However, when executing a request to an unknown host Node process may 
    // throw unhandled error event when the error is properly reported by the 
    // application. This suppresses these errors.
    // Note, uncomment this line for debug.
    process.on('unhandledRejection', unhandledRejection);
    const factory = new SerialRun();
    await factory.configure(project, options);
    const report = await factory.execute();
    process.off('unhandledRejection', unhandledRejection);

    const reporter = new ProjectRunCliReporter(report);
    process.stdout.write('\n');
    await reporter.generate();
    if (options.history) {
      await this.saveHistory(report, options);
    }
  }

  protected async saveHistory(report: IProjectExecutionLog, options: ICommandOptions={}): Promise<void> {
    if (!options.project) {
      throw new Error(`Unable toi save history. The input has no --project.`);
    }
    const env = await this.readEnvironment(options);
    if (env.source !== 'net-store') {
      throw new Error(`History saving is only available when connecting to a store.`);
    }
    const bulk: IHttpHistoryBulkAdd = {
      log: [],
      app: app.code,
      project: options.project,
      space: options.space,
    };
    report.iterations.forEach((group) => {
      if (group.error) {
        return;
      }
      group.executed.forEach((info) => {
        bulk.log.push(info);
      });
    });
    const sdk = this.apiStore.getSdk(env);
    await sdk.history.createBulk(bulk);
  }
}
