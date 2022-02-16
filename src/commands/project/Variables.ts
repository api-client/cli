import { Command } from 'commander';
import { ProjectCommand } from '../ProjectCommand.js';
import List from './variable/List.js';
import Add from './variable/Add.js';


export default class VariablesCommand extends ProjectCommand {
  /**
   * The command definition.
   */
  static get command(): Command {
    const project = new Command('variables');
    project.description('Commands related to environment variables manipulation.');
    project.addCommand(List.command);
    project.addCommand(Add.command);
    return project;
  }

  async run(): Promise<void> {
    // ...
  }
}
