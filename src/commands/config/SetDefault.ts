import { Command } from 'commander';
import { BaseCommand } from '../BaseCommand.js';
import { InteractiveConfig } from './InteractiveConfig.js';
import { Config } from '../../lib/Config.js';

export default class SetDefault extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('set-default');
    
    cmd
      .argument('[name]', 'The key or name of the config environment')
      .description('Sets the environment as default.')
      .option('--interactive', 'Interactively selects the environment using the CLI. Used instead of [name].')
      .action(async (name, opts) => {
        const instance = new SetDefault(cmd);
        await instance.run(name, opts);
      });
    return cmd;
  }

  async run(nameOrKey?: string, opts: any = {}): Promise<void> {
    if (!process.stdout.isTTY) {
      throw new Error(`This commands can only run in the interactive mode.`);
    }
    let key = nameOrKey;
    if (!key && !opts.interactive) {
      throw new Error(`Either [name] or "--interactive" must be set.`);
    }
    if (!key) {
      const interactive = new InteractiveConfig();
      key = await interactive.selectEnvironment();
    }
    const config = new Config();
    const data = await config.read();
    data.loaded = key;
    await config.write(data);
  }
}
