import { HttpProject, IProjectRunnerOptions, ProjectParallelRunner, IWorkerInfo } from '@api-client/core';
import chalk from 'chalk';

const { isTTY } = process.stdout;

export class ParallelRun extends ProjectParallelRunner {
  /**
   * The terminal row # relative to the start command
   */
  protected currentRow = 0;

  constructor(project: HttpProject, opts: IProjectRunnerOptions = {}) {
    super(project, opts);
    this.on('status', this._printStatus.bind(this));
  }

  private _printStatus(workers: IWorkerInfo[]): void {
    this._printProjectInfo();
    this._printWorkersInfo(workers);
  }

  private _printProjectInfo(): void {
    const { project } = this;
    const padding = ' ';
    if (this.currentRow > 0) {
      // the project info is already printed. Move to the 3rd line where the status start
      const diff = this.currentRow - 2;
      if (isTTY) {
        process.stdout.moveCursor(0, -diff);
      }
      this.currentRow = 2;
      return;
    }
    process.stdout.write(`${padding}Project: ${project.info.name || '(no name)'}\n`);
    process.stdout.write(' │\n');
    this.currentRow += 2;
  }

  private _printWorkersInfo(workers: IWorkerInfo[]): void {
    workers.forEach((info, index) => {
      const borderStyle = index === workers.length - 1 ? '└' : '├';
      const state = this._readWorkerState(info, index);
      const line = ` ${borderStyle} ${state}\n`;
      if (isTTY) {
        process.stdout.cursorTo(0);
        process.stdout.clearLine(1);
      }
      process.stdout.write(line);
      this.currentRow += 1;
    });
  }

  private _readWorkerState(info: IWorkerInfo, index: number): string {
    const { status, message, iterations } = info;
    let str = `Worker ${index + 1} `;
    if (status === 'initializing') {
      str += 'is initializing.';
    } else if (status === 'ready') {
      str += 'is ready to start.'; 
    } else if (status === 'running') {
      if (iterations > 1) {
        str += `is running ${iterations} iterations.`;
      } else {
        str += 'is running.';
      }
    } else if (status === 'finished') {
      str += 'has finished.';
    } else if (status === 'error') {
      str += `failed with: ${chalk.red(message)}.`;
    }
    return str;
  }
}
