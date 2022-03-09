import { Command } from 'commander';
import { BaseCommand } from './BaseCommand.js';
import List from './users/List.js';

/**
 * User in the net-store command
 * - users list - list users
 */
export default class UsersCommand extends BaseCommand {
  async run(): Promise<void> {
    // ...
  }

  /**
   * The command definition.
   */
  static get command(): Command {
    const config = new Command('users');
    const desc = [
      `Commands related to store users.`,
    ];
    config.description(desc.join('\n'));
    config.addCommand(List.command);
    return config;
  }
}
