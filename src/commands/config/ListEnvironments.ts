import { Command } from 'commander';
import { BaseCommand } from '../BaseCommand.js';
import { InteractiveConfig } from './InteractiveConfig.js';
import { Config } from '../../lib/Config.js';

export default class ListEnvironments extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('list');
    
    cmd
      .description('Lists configuration environments.')
      .action(async () => {
        const instance = new ListEnvironments();
        await instance.run();
      });
    return cmd;
  }

  async run(): Promise<void> {
    const interactive = new InteractiveConfig();
    const config = new Config();
    interactive.listEnvironments(config);
  }
}
