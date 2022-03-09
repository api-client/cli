import { Command } from 'commander';
import { BaseCommand } from './BaseCommand.js';
import List from './space/List.js';
import Add from './space/Add.js';
import Delete from './space/Delete.js';
import Read from './space/Read.js';
import User from './space/User.js';
import Project from './space/Project.js';

export default class SpacesCommand extends BaseCommand {
  async run(): Promise<void> {
    // ...
  }

  static get command(): Command {
    const config = new Command('space');
    const desc = [
      `Spaces allow you to organize your projects and data and share them with other users in your organization.`,
    ];
    config.description(desc.join('\n'));
    config.addCommand(List.command);
    config.addCommand(Add.command);
    config.addCommand(Delete.command);
    config.addCommand(Read.command);
    // sub-commands
    config.addCommand(Project.command);
    config.addCommand(User.command);
    return config;
  }
}
