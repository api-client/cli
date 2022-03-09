import { Command } from 'commander';
import { BaseCommand } from '../BaseCommand.js';
import Add from './user/Add.js';
import Delete from './user/Delete.js';

export default class SpacesCommand extends BaseCommand {
  async run(): Promise<void> {
    // ...
  }

  static get command(): Command {
    const cmd = new Command('user');
    const desc = [
      `Manipulates users of the user space.`,
    ];
    cmd.description(desc.join('\n'));
    // cmd.addCommand(List.command);
    cmd.addCommand(Add.command);
    cmd.addCommand(Delete.command);
    // cmd.addCommand(Read.command);
    return cmd;
  }
}
