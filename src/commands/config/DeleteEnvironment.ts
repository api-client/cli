import { Command } from 'commander';
import { BaseCommand } from '../BaseCommand.js';
import { Config } from '../../lib/Config.js';

export default class DeleteEnvironment extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('delete');
    
    cmd
      .argument('<key>', 'The key of the configuration environment to delete')
      .description('Deletes an environment from the configuration.')
      .action(async (key) => {
        const instance = new DeleteEnvironment(cmd);
        await instance.run(key);
      });
    return cmd;
  }

  async run(key: string): Promise<void> {
    const config = new Config();
    const data = await config.read();
    if (!Array.isArray(data.environments) || !data.environments.length) {
      this.err('The configuration has no environments.');
      return;
    }
    const index = data.environments.findIndex(i => i.key === key);
    if (index === -1) {
      this.err('The configuration environment not found.');
      return;
    }
    data.environments.splice(index, 1);
    await config.write(data);
  }
}
