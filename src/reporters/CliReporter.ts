import { Table } from 'console-table-printer';
import chalk from 'chalk';
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
  }
}
