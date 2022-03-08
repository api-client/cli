import { Command } from 'commander';
import { BaseCommand } from './BaseCommand.js';
import ListSpaces from './spaces/List.js';
/**
 * User spaces in the net-store command
 * - spaces list - list user spaces
 * - spaces add - creates a space
 * - spaces delete <key> - deletes a space
 * - spaces users add <space-key> <user id> -l write - adds a user to a space
 * - spaces users remove <space-key> <user id> - removes a user from a space
 * - spaces users list <space-key> - lists users with the access to the space.
 * - spaces projects list <key> - lists projects in the space
 * - spaces projects add <key> - adds a project to the space.
 * - spaces projects delete <space key> <project key> - removes a project from the space
 * 
 */
export default class SpacesCommand extends BaseCommand {
  async run(): Promise<void> {
    // ...
  }

  /**
   * The command definition.
   */
  static get command(): Command {
    const config = new Command('spaces');
    const desc = [
      `Only available with the net-store. Commands related to user spaces.`,
      `You need to be authenticated to access the store if configured for multi-user environment.`,
      `Spaces allow you to organize your projects and data and share them with other users in your organization.`,
    ];
    config.description(desc.join('\n'));
    config.addCommand(ListSpaces.command);
    return config;
  }
}
