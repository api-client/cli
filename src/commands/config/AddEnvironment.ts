import { Command } from 'commander';
import { BaseCommand } from '../BaseCommand.js';
import { InteractiveConfig } from './InteractiveConfig.js';

export default class AddEnvironment extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('add');
    
    cmd
      .description('Adds a new configuration environment.')
      .action(async () => {
        const instance = new AddEnvironment(cmd);
        await instance.run();
      });
    return cmd;
  }

  async run(): Promise<void> {
    if (!process.stdout.isTTY) {
      throw new Error(`This commands can only run in the interactive mode.`);
    }
    const interactive = new InteractiveConfig();
    await interactive.addEnvironment();
  }
}
