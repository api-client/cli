/* eslint-disable no-unused-vars */
import process from 'process';
import cluster from 'cluster';
import { IHttpRequest, IRequestLog, HttpProject } from '@api-client/core';
import { WorkerMessage, ProjectParallelWorkerOptions } from './ProjectParallelExeFactory.js';
import { sleep } from '../lib/Timers.js';
import { ProjectExe } from './ProjectExe.js';

class ProjectExeWorker extends ProjectExe {
  initialize(): void {
    if (cluster.isPrimary) {
      throw new Error(`This file should not be called directly.`);
    }
    process.send!({ cmd: 'online' });
    process.on('message', this.messageHandler.bind(this));
  }

  messageHandler(message: WorkerMessage): void {
    switch (message.cmd) {
      case 'run': this.run(message.data as ProjectParallelWorkerOptions); break;
    }
  }

  async run(options: ProjectParallelWorkerOptions): Promise<void> {
    try {
      await this.configure(new HttpProject(options.project), options);
      await this.execute();
    } catch (e) {
      const cause = e as Error;
      process.send!({ cmd: 'error', data: cause.message });
    }
  }

  async execute(): Promise<void> {
    const { root } = this;
    if (!root) {
      throw new Error(`The project runner is not configured.`);
    }
    function unhandledRejection(): void {}
    process.on('unhandledRejection', unhandledRejection);
    this.startTime = Date.now();
    while (this.remaining > 0) {
      this.remaining--;
      await this.executeIteration();
      this.index++;
      if (this.remaining && this.options?.iterationDelay) {
        await sleep(this.options.iterationDelay);
      }
    }
    process.off('unhandledRejection', unhandledRejection);
    this.endTime = Date.now();

    const log = await this.createReport();
    process.send!({ cmd: 'result', data: log.iterations });
  }
  
  protected requestHandler(key: string, request: IHttpRequest): void {
    // ...
  }

  protected responseHandler(key: string, log: IRequestLog): void {
    this.currentIteration?.executed.push(log);
  }

  protected errorHandler(key: string, log: IRequestLog, message: string): void {
    this.currentIteration?.executed.push(log);
  }
}

const instance = new ProjectExeWorker();
instance.initialize();
