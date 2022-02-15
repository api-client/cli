import { Command } from 'commander';
import { ProjectCommand } from '../ProjectCommand.js';
import RequestAdd from './request/Add.js';
import Delete from './request/Delete.js';
import Find from './request/Find.js';
import Get from './request/Get.js';

export default class RequestCommand extends ProjectCommand {
  /**
   * The command definition.
   */
  static get command(): Command {
    const project = new Command('request');
    project.description('Commands related to HTTP requests manipulation.');
    project.addCommand(RequestAdd.command);
    project.addCommand(Delete.command);
    project.addCommand(Find.command);
    project.addCommand(Get.command);
    return project;
  }

  async run(): Promise<void> {
    // ...
  }
}
