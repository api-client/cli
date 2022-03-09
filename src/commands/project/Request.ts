import { Command } from 'commander';
import { ProjectCommand } from '../ProjectCommand.js';
import Add from './request/Add.js';
import Delete from './request/Delete.js';
import Find from './request/Find.js';
import Read from './request/Read.js';

export default class RequestCommand extends ProjectCommand {
  /**
   * The command definition.
   */
  static get command(): Command {
    const project = new Command('request');
    project.description('Commands related to HTTP requests manipulation.');
    project.addCommand(Add.command);
    project.addCommand(Delete.command);
    project.addCommand(Read.command);
    project.addCommand(Find.command);
    return project;
  }

  async run(): Promise<void> {
    // ...
  }
}
