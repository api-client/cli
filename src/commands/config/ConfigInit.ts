/* eslint-disable import/no-named-as-default-member */
import { Command } from 'commander';
import inquirer from 'inquirer';
import { BaseCommand } from '../BaseCommand.js';
import { Config } from '../../lib/Config.js';
import { InteractiveConfig } from './InteractiveConfig.js';

export default class ConfigInit extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('init');
    
    cmd
      .description('Initializes the CLI configuration.')
      .action(async () => {
        const instance = new ConfigInit();
        await instance.run();
      });
    return cmd;
  }

  async run(): Promise<void> {
    const interactive = new InteractiveConfig();
    const config = new Config();
    const hasConfig = await config.hasConfig();
    if (hasConfig) {
      const result = await inquirer.prompt({
        type: 'list',
        name: 'flow',
        message: 'Configuration already exist. What would you like to do?',
        choices: [
          {
            key: 'n',
            name: 'Add new environment',
            value: 'add-new',
          },
          {
            key: 'c',
            name: 'Re-create the configuration',
            value: 're-create',
          },
          new inquirer.Separator(),
          {
            key: 'l',
            name: 'List environments',
            value: 'list',
          },
        ],
      });
      if (result.flow === 'list') {
        await interactive.listEnvironments(config);
      } else if (result.flow === 'add-new') {
        await interactive.addEnvironment();
      } else {
        await interactive.addEnvironment(true);
      }
    } else {
      await interactive.addEnvironment(true);
    }
  }
}
