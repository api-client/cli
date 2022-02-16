import { Command } from 'commander';
import { ProjectCommand } from './ProjectCommand.js';
import Create from './project/Create.js';
import List from './project/List.js';
import Request from './project/Request.js';
import Folder from './project/Folder.js';
import Environment from './project/Environment.js';
import Variables from './project/Variables.js';
import Move from './project/Move.js';
import Describe from './project/Describe.js';
import Patch from './project/Patch.js';
import Clone from './project/Clone.js';
import Info from './project/Info.js';

/**
 * The top-level project command.
 */
export default class Project extends ProjectCommand {
  /**
   * The command definition.
   */
  static get command(): Command {
    const project = new Command('project');
    project.description('Commands related to an HTTP project manipulation.');
    project.addCommand(Create.command);
    project.addCommand(List.command);
    project.addCommand(Describe.command);
    project.addCommand(Move.command);
    project.addCommand(Patch.command);
    project.addCommand(Clone.command);
    project.addCommand(Info.command);
    project.addCommand(Request.command);
    project.addCommand(Folder.command);
    project.addCommand(Environment.command);
    project.addCommand(Variables.command);
    return project;
  }

  async run(): Promise<void> {
    // ...
  }
}
