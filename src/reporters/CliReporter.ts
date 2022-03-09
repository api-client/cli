import { Table } from 'console-table-printer';
import chalk from 'chalk';
import { ErrorResponse, IErrorResponse, IArcResponse, ISerializedError } from '@api-client/core';
import { Reporter } from './Reporter.js';

/**
 * HTTP project execution reported for a terminal output.
 */
export class CliReporter extends Reporter {
  async generate(): Promise<void> {
    const { info } = this;

    const table = new Table({
      title: 'Project execution summary',
      columns: [
        { name: 'position', title: ' ', alignment: 'left',  },
        { name: 'succeeded', title: 'Succeeded', alignment: 'right', },
        { name: 'failed', title: 'Failed', alignment: 'right', },
        { name: 'total', title: 'Total', alignment: 'right', },
      ],
    });

    table.addRow({
      position: 'Iterations',
      succeeded: info.iterations.length,
      failed: 0,
      total: info.iterations.length,
    });

    const failed = this.computeFailed();
    const succeeded = this.computeSucceeded();
    table.addRow({
      position: 'Requests',
      succeeded,
      failed: failed > 0 ? chalk.redBright(failed) : failed,
      total: failed + succeeded,
    });
    table.printTable();
    console.log('');

    info.iterations.forEach((run, index) => {
      const itNumber = index + 1;
      if (run.error) {
        console.log(`Iteration ${itNumber} failed: ${run.error}\n`);
        return;
      }
      const failed = run.executed.filter(log => this.isFailedLog(log));
      if (!failed.length) {
        return;
      }
      console.log(`Iteration ${itNumber} Errors`);
      failed.forEach((log) => {
        let url = 'Unknown request URL.';
        if (log.request) {
          url = log.request.url;
        }
        const prefix = chalk.dim(`[${url}] `);

        if (log.response && ErrorResponse.isErrorResponse(log.response)) {
          const response = log.response as IErrorResponse;
          let message = (response.error as ISerializedError).message ? (response.error as Error).message : response.error;
          if (typeof message !== 'string') {
            message = 'Unknown error.';
          }
          console.log(`${prefix}${message}`);
          return;
        }
        if (!log.request) {
          console.log('Request not executed.');
          return;
        }
        const response = log.response as IArcResponse;
        console.log(`${prefix} Status code is: ${response.status}`);
      });
      console.log('\n');
    });
  }
}
