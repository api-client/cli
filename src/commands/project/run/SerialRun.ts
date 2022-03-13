import chalk from 'chalk';
import { 
  IRequestLog, ErrorResponse, IHttpRequest, ProjectSerialRunner, IArcResponse, IErrorResponse, 
  ISerializedError, DataCalculator, IProjectExecutionLog,
} from '@api-client/core';

export class SerialRun extends ProjectSerialRunner {
  constructor() {
    super();
    this.on('before-sleep', this._beforeSleepHandler.bind(this));
    this.on('after-sleep', this._afterSleepHandler.bind(this));
    this.on('before-iteration', this._beforeIterationHandler.bind(this));
    this.on('after-iteration', this._afterIterationHandler.bind(this));
  }

  async execute(): Promise<IProjectExecutionLog> {
    this.printProjectInfo();
    const log = await super.execute();
    process.stdout.write(` └`);
    process.stdout.write(chalk.green(` Run complete\n\n`));
    return log;
  }

  private _beforeSleepHandler(): void {
    const { options } = this;
    if (!options) {
      return;
    }
    if (!options.iterationDelay) {
      return;
    }
    const formatted = new Intl.NumberFormat(undefined, {
      style: 'unit',
      unit: 'millisecond',
      unitDisplay: 'long',
    }).format(options.iterationDelay);
    process.stdout.write(` │ Waiting ${formatted}`);
  }

  private _afterSleepHandler(): void {
    process.stdout.clearLine(-1);
    process.stdout.write(`\r`);
  }

  /**
   * A lifecycle function called before the iteration begins.
   * @param index The index of the current iteration.
   * @param iterated Whether the library performs multiple iterations
   */
  private _beforeIterationHandler(index: number, iterated: boolean): void {
    if (iterated) {
      const info = chalk.bold(`Iteration #${index + 1}`);
      process.stdout.write(` │ ${info}\n │\n`);
    }
  }

  /**
   * A lifecycle function called after the iteration ended.
   * @param index The index of the current iteration.
   * @param iterated Whether the library performs multiple iterations
   */
  private _afterIterationHandler(index: number, iterated: boolean): void {
    if (iterated) {
      process.stdout.write(` │\n`);
    }
  }

  protected _requestHandler(key: string, request: IHttpRequest): void {
    super._requestHandler(key, request);
    const { url, method } = request;
    const projectRequest = this.project!.findRequest(key);
    if (!projectRequest) {
      process.stdout.write(chalk.red(`Unable to find a request in the project.`));
      return;
    }
    const name = projectRequest.info.name || key;
    
    process.stdout.write(` ├ ${name}\n │  `);
    process.stdout.write(chalk.gray(`└ ${method} ${url}`));
  }

  protected _responseHandler(key: string, log: IRequestLog): void {
    super._responseHandler(key, log);
    const { response } = log;
    if (ErrorResponse.isErrorResponse(response)) {
      this.writeErrorResponse(log);
    } else {
      this.writeResponse(log);
    }
  }

  protected _errorHandler(key: string, log: IRequestLog, message: string): void {
    // this intentionally does not call the super method.
    this.currentIteration?.executed.push(log);
    const projectRequest = this.project!.findRequest(key);
    if (!projectRequest) {
      process.stdout.write(chalk.red(`Unable to find a request in the project.`));
      return;
    }
    this.writeError(message);
  }

  private printProjectInfo(): void {
    const { root, environment, project } = this;
    if (!project) {
      throw new Error(`Run configure() first.`);
    }

    console.clear();
    const padding = ' ';
    process.stdout.write(`${padding}Project: ${project.info.name || '(no name)'}\n`);
    if (root && root !== project) {
      process.stdout.write(`${padding}Folder: ${root.info.name || '(no name)'}\n`);
    }
    if (environment) {
      process.stdout.write(`${padding}Environment: ${environment.info.name || '(no name)'}\n`);
    }
    process.stdout.write(' │\n');
  }

  private statusPart(execLog: IRequestLog): string {
    const response = execLog.response as IArcResponse | IErrorResponse;
    if (!response) {
      return '0';
    }
    let status = `${response.status || '0'}`;
    if (response.statusText) {
      status += ` ${response.statusText}`;
    }
    return status;
  }

  private sizePart(execLog: IRequestLog): string|undefined {
    if (execLog.size) {
      return DataCalculator.bytesToSize(execLog.size.request);
    }
  }

  private timePart(execLog: IRequestLog): string|undefined {
    const rsp = execLog.response as IArcResponse;
    if (rsp.loadingTime) {
      return `${rsp.loadingTime}ms`;
    }
  }

  private writeErrorResponse(execLog: IRequestLog): void {
    const response = execLog.response as IErrorResponse;
    this.writeError(response.error);
  }

  private writeError(message: string | Error | ISerializedError): void {
    const parts = [
      ` [${chalk.redBright(message)}]\n`,
    ];
    process.stdout.write(chalk.gray(parts.join(', ')));
  }

  private writeResponse(execLog: IRequestLog): void {
    const response = execLog.response as IArcResponse;
    if (response.status < 200) {
      this.writeInformResponse(execLog);
    } else if (response.status < 300) {
      this.writeSuccessResponse(execLog);
    } else if (response.status < 400) {
      this.writeRedirectResponse(execLog);
    } else if (response.status < 500) {
      this.writeClientErrorResponse(execLog);
    } else if (response.status < 600) {
      this.writeServerErrorResponse(execLog);
    } else {
      this.writeUnknownResponse(execLog);
    }
  }

  private writeInformResponse(execLog: IRequestLog): void {
    const status = this.statusPart(execLog);
    const size = this.sizePart(execLog);
    const time = this.timePart(execLog);
    const parts = [status];
    if (time) {
      parts.push(time);
    }
    if (size) {
      parts.push(size);
    }
    process.stdout.write(chalk.gray(` [${parts.join(', ')}]\n`));
  }

  private writeSuccessResponse(execLog: IRequestLog): void {
    const status = this.statusPart(execLog);
    const size = this.sizePart(execLog);
    const time = this.timePart(execLog);
    const parts = [chalk.greenBright(status)];
    if (time) {
      parts.push(time);
    }
    if (size) {
      parts.push(size);
    }
    process.stdout.write(chalk.gray(` [${parts.join(', ')}]\n`));
  }

  private writeRedirectResponse(execLog: IRequestLog): void {
    const status = this.statusPart(execLog);
    const size = this.sizePart(execLog);
    const time = this.timePart(execLog);
    const parts = [chalk.blueBright(status)];
    if (time) {
      parts.push(time);
    }
    if (size) {
      parts.push(size);
    }
    process.stdout.write(chalk.gray(` [${parts.join(', ')}]\n`));
  }

  private writeClientErrorResponse(execLog: IRequestLog): void {
    const status = this.statusPart(execLog);
    const size = this.sizePart(execLog);
    const time = this.timePart(execLog);
    const parts = [chalk.yellowBright(status)];
    if (time) {
      parts.push(time);
    }
    if (size) {
      parts.push(size);
    }
    process.stdout.write(chalk.gray(` [${parts.join(', ')}]\n`));
  }

  private writeServerErrorResponse(execLog: IRequestLog): void {
    const status = this.statusPart(execLog);
    const size = this.sizePart(execLog);
    const time = this.timePart(execLog);
    const parts = [chalk.redBright(status)];
    if (time) {
      parts.push(time);
    }
    if (size) {
      parts.push(size);
    }
    process.stdout.write(chalk.gray(` [${parts.join(', ')}]\n`));
  }

  private writeUnknownResponse(execLog: IRequestLog): void {
    const status = this.statusPart(execLog);
    const size = this.sizePart(execLog);
    const time = this.timePart(execLog);
    const parts = [status];
    if (time) {
      parts.push(time);
    }
    if (size) {
      parts.push(size);
    }
    process.stdout.write(chalk.gray(` [${parts.join(', ')}]\n`));
  }
}
