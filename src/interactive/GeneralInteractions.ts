import inquirer from 'inquirer';
import { DataSourceType } from '../lib/Config.js';

export class GeneralInteractions {
  static isTty(): boolean {
    return !!process.stdout.isTTY;
  }

  static ttyOrThrow(): void {
    if (!this.isTty()) {
      throw new Error(`This commands can only run in the interactive mode.`);
    }
  }

  /**
   * Asks the user about the data source for this operation.
   */
  static async storeSource(): Promise<DataSourceType> {
    const result = await inquirer.prompt({
      type: 'list',
      name: 'source',
      message: 'What is the data source?',
      choices: [
        {
          key: 'f',
          name: 'Local file',
          value: 'file',
        },
        {
          key: 's',
          name: 'API Client store',
          value: 'net-store',
        }
      ],
    });
    return result.source as DataSourceType;
  }
}
