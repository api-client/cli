import { 
  IRequestLog, 
  ErrorResponse,
  IArcResponse,
} from '@advanced-rest-client/core';

export interface ProjectExecutionIteration {
  /**
   * The index of the iteration.
   */
  index: number;
  /**
   * The list of requests executed in the iteration.
   */
  executed: IRequestLog[];
}

export interface ProjectExecutionLog {
  /**
   * The timestamp when the execution started
   */
  started: number;
  /**
   * The timestamp when the execution ended
   */
  ended: number;
  /**
   * The execution logs for each iteration.
   */
  iterations: ProjectExecutionIteration[];
}

/**
 * Base class for project execution reporters.
 */
export abstract class Reporter {
  info: ProjectExecutionLog;

  constructor(info: ProjectExecutionLog) {
    this.info = info;
  }

  /**
   * Generates the report for the current execution log.
   */
  abstract generate(): Promise<void>;

  /**
   * Computes the number of requests that failed.
   */
  computeFailed(): number {
    let result = 0;
    const { info } = this;
    const { iterations } = info;
    iterations.forEach((iteration) => {
      iteration.executed.forEach((log) => {
        if (!log.response || ErrorResponse.isErrorResponse(log.response)) {
          result++;
          return;
        }
        const response = log.response as IArcResponse;
        if (response.status >= 400) {
          result++;
        }
      });
    });

    return result;
  }

  /**
   * Computes the number of requests that ended with the status code 399 at the most.
   */
  computeSucceeded(): number {
    let result = 0;
    const { info } = this;
    const { iterations } = info;
    iterations.forEach((iteration) => {
      iteration.executed.forEach((log) => {
        if (!log.response || ErrorResponse.isErrorResponse(log.response)) {
          return;
        }
        const response = log.response as IArcResponse;
        if (response.status < 400) {
          result++;
        }
      });
    });
    return result;
  }

  /**
   * Computes the total time of sending each request.
   */
  computeTotalTime(): number {
    let result = 0;
    const { info } = this;
    const { iterations } = info;
    iterations.forEach((iteration) => {
      iteration.executed.forEach((log) => {
        if (!log.response || ErrorResponse.isErrorResponse(log.response)) {
          return;
        }
        const response = log.response as IArcResponse;
        if (response.loadingTime && response.loadingTime > 0) {
          result += response.loadingTime;
        }
      });
    });
    return result;
  }

  /**
   * Computes the total size of received data.
   */
  computeTotalSize(): number {
    let result = 0;
    const { info } = this;
    const { iterations } = info;
    iterations.forEach((iteration) => {
      iteration.executed.forEach((log) => {
        if (log.size && log.size.response) {
          result += log.size.response;
        }
      });
    });
    return result;
  }
}
