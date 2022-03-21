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
        const instance = new ListEnvironments(cmd);
        await instance.run();
      });
    return cmd;
  }

  async run(): Promise<void> {
    if (!process.stdout.isTTY) {
      throw new Error(`This commands can only run in the interactive mode.`);
    }
    const interactive = new InteractiveConfig(this.config);
    const config = new Config();
    interactive.listEnvironments(config);
  }
}
