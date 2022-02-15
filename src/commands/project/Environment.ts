import { Command } from 'commander';
import { ProjectCommand } from '../ProjectCommand.js';
import Add from './environment/Add.js';
import Delete from './environment/Delete.js';
import Find from './environment/Find.js';
import Get from './environment/Get.js';


export default class EnvironmentCommand extends ProjectCommand {
  /**
   * The command definition.
   */
  static get command(): Command {
    const project = new Command('environment');
    project.description('Commands related to environments manipulation.');
    project.addCommand(Add.command);
    project.addCommand(Delete.command);
    project.addCommand(Find.command);
    project.addCommand(Get.command);
    return project;
  }

  async run(): Promise<void> {
    // ...
  }
}
