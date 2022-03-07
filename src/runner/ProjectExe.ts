/* eslint-disable no-unused-vars */
import { CommanderError } from 'commander';
import { 
  HttpProject, 
  ProjectFolder, 
  ProjectRunner, 
  DummyLogger, 
  Environment, 
  IHttpRequest, 
  IRequestLog,
  IEnvironment,
} from '@advanced-rest-client/core';
import { ProjectExecutionIteration, ProjectExecutionLog } from '../reporters/Reporter.js';
import { pathExists, readJson } from '../lib/Fs.js';

type ProjectParent = HttpProject | ProjectFolder;

export interface ProjectExeOptions {
  /**
   * The environment to use.
   * This can be a name or the key of the environment located under the parent or root.
   * It can also be a path to the environment definition. If the file exists it is used. Otherwise it tried to 
   * find the environment in the project.
   */
  environment?: string;
  /**
   * The parent folder to execute.
   */
  parent?: string;
  /**
   * The names or the keys of requests to execute.
   * This can be used to limit the number of requests.
   */
  request?: string[];
  /**
   * The number of times the execution should be repeated.
   * Default to 1.
   */
  iterations?: number;
  /**
   * The number of milliseconds to wait between each iteration.
   * Default to the next frame (vary from 1 to tens of milliseconds).
   */
  iterationDelay?: number;
  /**
   * When set it performs parallel execution for each iteration.
   * The number of executions at the same time depends on the number of processor cores
   * available on the current machine. The maximum of the parallel execution
   * is the number of available cores. When the `iterations` number is higher
   * then the "rest" is added to the iterations per each core.
   */
  parallel?: boolean;
  /**
   * When set it includes requests in the current folder and sub-folder according to the order
   * defined in the folder.
   */
  recursive?: boolean;
  /**
   * The opposite of the `requests`. The list of names or keys of requests or folders to ignore.
   * Note, ignore is tested before the `requests`.
   */
  ignore?: string[];
}

export abstract class ProjectExe {
  project?: HttpProject;
  options?: ProjectExeOptions;
  root?: ProjectParent;
  environment?: Environment;
  target = new EventTarget();
  /**
   * This is used with `--iterations`. The index of the current iteration.
   */
  protected index = 0;
  protected currentIteration?: ProjectExecutionIteration;
  protected executed: ProjectExecutionIteration[] = [];
  protected startTime?: number;
  protected endTime?: number;
  /**
   * The number of remaining iterations to run.
   */
  protected remaining = 1;
  protected hasIterations = false;

  constructor() {
    this.requestHandler = this.requestHandler.bind(this);
    this.responseHandler = this.responseHandler.bind(this);
  }

  /**
   * A required step before running the project.
   * It configures the execution context. It may throw an error when configuration is not valid.
   */
  async configure(project: HttpProject, opts: ProjectExeOptions = {}): Promise<void> {
    this.project = project;
    this.options = opts || {};
    if (typeof this.options.iterations === 'number' && this.options.iterations >= 0) {
      this.remaining = this.options.iterations;
    }
    this.hasIterations = this.remaining > 1;

    const root = opts.parent ? project.findFolder(opts.parent) : project;
    if (!root) {
      throw new Error(`Unable to locate the folder: ${opts.parent}`);
    }
    this.root = root;
    this.environment = await this.getEnvironment();
  }

  /**
   * Executes the requests in the project.
   */
  abstract execute(): Promise<void>;

  async createReport(): Promise<ProjectExecutionLog> {
    const log: ProjectExecutionLog = {
      started: this.startTime as number,
      ended: this.endTime as number,
      iterations: this.executed,
    };
    return log;
  }

  protected async getEnvironment(): Promise<Environment | undefined> {
    const { options } = this;
    if (!options) {
      throw new Error(`Run configure() first.`);
    }
    if (!options.environment) {
      return;
    }
    const fileExists = await pathExists(options.environment);
    if (fileExists) {
      const contents = await readJson(options.environment);
      return new Environment(contents as IEnvironment);
    }
    const root = this.root as ProjectParent;
    const envs = root.getEnvironments();
    const env = envs.find(i => i.key === options.environment || i.info.name === options.environment);
    if (!env) {
      throw new CommanderError(0, 'EENVNOTFOUND', `The environment cannot be found: ${options.environment}.`);
    }
    return env;
  }

  protected async executeIteration(): Promise<void> {
    const { environment, project, options, hasIterations, index } = this;
    if (!options || !project) {
      throw new Error(`Run configure() first.`);
    }
    await this.beforeIteration(index, hasIterations);

    const runner = new ProjectRunner(project, {
      environment,
      logger: new DummyLogger(),
      eventTarget: this.target,
      variables: this.getSystemVariables(),
    });
    
    runner.on('request', this.requestHandler);
    runner.on('response', this.responseHandler);

    this.currentIteration = {
      index: this.index,
      executed: [],
    };
    try {
      await runner.run({ 
        parent: options.parent, 
        requests: options.request, 
        ignore: options.ignore, 
        recursive: options.recursive 
      });
    } catch (e) {
      // ...
    }
    this.executed.push(this.currentIteration);

    await this.afterIteration(index, hasIterations);
  }

  /**
   * A lifecycle function called before the iteration begins.
   * @param index The index of the current iteration.
   * @param iterated Whether the library performs multiple iterations
   */
  async beforeIteration(index: number, iterated: boolean): Promise<void> {
    // ...
  }

  /**
   * A lifecycle function called after the iteration ended.
   * @param index The index of the current iteration.
   * @param iterated Whether the library performs multiple iterations
   */
  async afterIteration(index: number, iterated: boolean): Promise<void> {
    // ...
  }

  protected abstract requestHandler(key: string, request: IHttpRequest): void;

  protected abstract responseHandler(key: string, log: IRequestLog): void;

  protected getSystemVariables(): Record<string, string> {
    const result: Record<string, string> = {};
    Object.keys(process.env).forEach((key) => {
      const value = process.env[key];
      if (value) {
        result[key] = value;
      }
    });
    return result;
  }
}
