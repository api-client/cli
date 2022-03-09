import { Command } from 'commander';
import { BaseCommand } from '../BaseCommand.js';
import List from './project/List.js';
import Add from './project/Add.js';
import Read from './project/Read.js';
import Delete from './project/Delete.js';

export default class SpacesCommand extends BaseCommand {
  async run(): Promise<void> {
    // ...
  }

  static get command(): Command {
    const cmd = new Command('project');
    const desc = [
      `Manipulates projects in the user space.`,
    ];
    cmd.description(desc.join('\n'));
    cmd.addCommand(List.command);
    cmd.addCommand(Add.command);
    cmd.addCommand(Delete.command);
    cmd.addCommand(Read.command);
    return cmd;
  }
}
