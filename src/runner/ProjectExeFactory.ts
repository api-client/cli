import chalk from 'chalk';
import { CommanderError } from 'commander';
import { 
  IHttpRequest, 
  IRequestLog, 
  IArcResponse, 
  IErrorResponse, 
  ErrorResponse,
} from '@api-client/core';
import { CliReporter } from '../reporters/CliReporter.js';
import { bytesToSize } from '../lib/DataSize.js';
import { sleep } from '../lib/Timers.js';
import { ProjectExe } from './ProjectExe.js';

export class ProjectExeFactory extends ProjectExe {
  /**
   * When set it automatically generates the report at tge end of the run.
   */
  autoReport = true;

  /**
   * Executes the requests in the project.
   */
  async execute(): Promise<void> {
    const { root } = this;
    if (!root) {
      throw new CommanderError(0, 'ECONFIGURE', `The project runner is not configured.`);
    }
    this.printProjectInfo();
    
    this.startTime = Date.now();
    while (this.remaining > 0) {
      this.remaining--;
      await this.executeIteration();
      this.index++;
      if (this.remaining && this.options?.iterationDelay) {
        const formatted = new Intl.NumberFormat(undefined, {
          style: 'unit',
          unit: 'millisecond',
          unitDisplay: 'long',
        }).format(this.options.iterationDelay);
        process.stdout.write(` │ Waiting ${formatted}`);
        await sleep(this.options.iterationDelay);
        process.stdout.clearLine(-1);
        process.stdout.write(`\r`);
      }
    }

    this.endTime = Date.now();

    process.stdout.write(` └`);
    process.stdout.write(chalk.green(` Complete\n\n`));
    if (this.autoReport) {
      await this.generateReport();
    }
  }

  private async generateReport(): Promise<void> {
    const log = await this.createReport();
    const reporter = new CliReporter(log);
    await reporter.generate();
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

  protected requestHandler(key: string, request: IHttpRequest): void {
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

  protected responseHandler(key: string, log: IRequestLog): void {
    this.currentIteration?.executed.push(log);
    const { response } = log;
    if (ErrorResponse.isErrorResponse(response)) {
      this.writeErrorResponse(log);
    } else {
      this.writeResponse(log);
    }
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
      return bytesToSize(execLog.size.request);
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
    const parts = [
      ` [${chalk.redBright(response.error)}]\n`,
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

  /**
   * A lifecycle function called before the iteration begins.
   * @param index The index of the current iteration.
   * @param iterated Whether the library performs multiple iterations
   */
  async beforeIteration(index: number, iterated: boolean): Promise<void> {
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
  async afterIteration(index: number, iterated: boolean): Promise<void> {
    if (iterated) {
      process.stdout.write(` │\n`);
    }
  }
}
