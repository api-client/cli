import { Command } from 'commander';
import { ProjectCommand } from '../ProjectCommand.js';
import RequestAdd from './request/Add.js';

export default class RequestCommand extends ProjectCommand {
  /**
   * The command definition.
   */
  static get command(): Command {
    const project = new Command('request');
    project.description('Commands related to an HTTP requests manipulation.');
    project.addCommand(RequestAdd.command);
    return project;
  }

  async run(): Promise<void> {
    // ...
  }
}
