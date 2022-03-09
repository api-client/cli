import { Command } from 'commander';
import { ProjectCommand } from '../ProjectCommand.js';
import Add from './folder/Add.js';
import Delete from './folder/Delete.js';
import Find from './folder/Find.js';
import Read from './folder/Read.js';
import Patch from './folder/Patch.js';

export default class FolderCommand extends ProjectCommand {
  /**
   * The command definition.
   */
  static get command(): Command {
    const project = new Command('folder');
    project.description('Commands related to a folder manipulation.');
    project.addCommand(Add.command);
    project.addCommand(Delete.command);
    project.addCommand(Read.command);
    project.addCommand(Patch.command);
    project.addCommand(Find.command);
    return project;
  }

  async run(): Promise<void> {
    // ...
  }
}
