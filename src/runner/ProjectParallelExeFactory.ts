import cluster, { Worker } from 'cluster';
import { cpus } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { HttpProject, IHttpProject } from '@api-client/core';
import { ProjectExeOptions } from './ProjectExe.js';
import { ProjectExecutionIteration, ProjectExecutionLog } from '../reporters/Reporter.js';
import { CliReporter } from '../reporters/CliReporter.js';

const numCPUs = cpus().length;
const __dirname = dirname(fileURLToPath(import.meta.url));

interface WorkerInfo {
  worker: Worker;
  online: boolean;
  iterations: number;
  status: 'initializing' | 'ready' | 'running' | 'finished' | 'error';
  message?: string;
}

export interface WorkerMessage {
  cmd: string;
  data?: unknown;
}

export interface ProjectParallelFactoryOptions extends ProjectExeOptions {
  in?: string;
}

export interface ProjectParallelWorkerOptions extends ProjectExeOptions {
  project: IHttpProject;
}

export class ProjectParallelExeFactory {
  project: HttpProject;
  options: ProjectParallelFactoryOptions;
  workers: WorkerInfo[] = [];
  private executed: ProjectExecutionIteration[] = [];
  private mainResolver?: () => void;
  private mainRejecter?: (err: Error) => void;
  protected startTime?: number;
  protected endTime?: number;

  constructor(project: HttpProject, opts: ProjectParallelFactoryOptions = {}) {
    this.project = project;
    this.options = opts || {};

    this.exitHandler = this.exitHandler.bind(this);
  }

  run(): Promise<void> {
    cluster.setupPrimary({
      exec: join(__dirname, 'ProjectExeWorker.js'),
    });
    const { iterations = 1 } = this.options;
    const poolSize = Math.min(iterations, numCPUs);
    for (let i = 0; i < poolSize; i++) {
      const worker = cluster.fork();
      this.setupWorker(worker);
    }
    this.distributeIterations();
    this.printStatus();
    cluster.on('exit', this.exitHandler);
    return new Promise((resolve, reject) => {
      this.mainResolver = resolve;
      this.mainRejecter = reject;
    });
  }

  private distributeIterations(): void {
    const workers = this.workers.length;
    const { iterations = 1 } = this.options;
    let iterationsRemaining = iterations - workers;
    let currentIndex = 0;
    while (iterationsRemaining > 0) {
      this.workers[currentIndex].iterations += 1;
      iterationsRemaining--;
      currentIndex++;
      if (currentIndex + 1 === workers) {
        currentIndex = 0;
      }
    }
  }

  private setupWorker(worker: Worker): void {
    this.workers.push({
      worker,
      online: false,
      iterations: 1,
      status: 'initializing',
    });
    worker.on('message', this.messageHandler.bind(this, worker));
  }

  private messageHandler(worker: Worker, message: WorkerMessage): void {
    switch (message.cmd) {
      case 'online': this.setOnline(worker); break;
      case 'result': this.setRunResult(worker, message); break;
      case 'error': this.setRunError(worker, message); break;
    }
  }

  private exitHandler(worker: Worker): void {
    const info = this.workers.find(i => i.worker === worker);
    if (!info) {
      return;
    }
    this.finishWhenReady();
  }

  private setOnline(worker: Worker): void {
    const info = this.workers.find(i => i.worker === worker);
    if (!info) {
      return;
    }
    info.online = true;
    info.status = 'ready';
    this.runWhenReady();
    this.printStatus();
  }

  private setRunResult(worker: Worker, message: WorkerMessage): void {
    const reports = message.data as ProjectExecutionIteration[];
    this.executed = this.executed.concat(reports);
    worker.destroy();
    const info = this.workers.find(i => i.worker === worker);
    if (!info) {
      return;
    }
    info.status = 'finished';
    this.printStatus();
  }

  private runWhenReady(): void {
    const waiting = this.workers.some(i => !i.online);
    if (waiting) {
      return;
    }
    this.startTime = Date.now();
    this.workers.forEach((info) => {
      const opts: ProjectParallelWorkerOptions = { ...this.options, project: this.project.toJSON() };
      opts.iterations = info.iterations;
      info.status = 'running';
      info.worker.send({
        cmd: 'run',
        data: opts,
      });
    });
  }

  private finishWhenReady(): void {
    const working = this.workers.some(i => !['finished', 'error'].includes(i.status));
    if (working || !this.mainResolver) {
      return;
    }
    this.endTime = Date.now();
    this.printStatus();
    this.generateReport();
    this.mainResolver();
  }

  private setRunError(worker: Worker, message: WorkerMessage): void {
    worker.destroy();
    const info = this.workers.find(i => i.worker === worker);
    if (!info) {
      return;
    }
    info.status = 'error';
    info.message = message.data as string;
    this.printStatus();
  }

  private printStatus(): void {
    this.printProjectInfo();
    this.printWorkersInfo();
  }

  private printProjectInfo(): void {
    const { project } = this;
    console.clear();
    const padding = ' ';
    process.stdout.write(`${padding}Project: ${project.info.name || '(no name)'}\n`);
    process.stdout.write(' │\n');
  }

  private printWorkersInfo(): void {
    const { workers } = this;
    workers.forEach((info, index) => {
      const borderStyle = index === workers.length - 1 ? '└' : '├';
      const state = this.readWorkerState(info, index);
      const line = ` ${borderStyle} ${state}\n`;
      process.stdout.write(line);
    });
  }

  private readWorkerState(info: WorkerInfo, index: number): string {
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

  private async generateReport(): Promise<void> {
    console.log('');
    const log: ProjectExecutionLog = {
      started: this.startTime as number,
      ended: this.endTime as number,
      iterations: this.executed,
    };
    const reporter = new CliReporter(log);
    await reporter.generate();
  }
}
