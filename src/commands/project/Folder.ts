import { Command } from 'commander';
import { ProjectCommand } from '../ProjectCommand.js';
import ProjectFolderAdd from './folder/Add.js';
import ProjectFolderDelete from './folder/Delete.js';
import ProjectFolderFind from './folder/Find.js';
import ProjectFolderGet from './folder/Get.js';
import ProjectFolderPatch from './folder/Patch.js';

export default class FolderCommand extends ProjectCommand {
  /**
   * The command definition.
   */
  static get command(): Command {
    const project = new Command('folder');
    project.description('Commands related to a folder manipulation.');
    project.addCommand(ProjectFolderAdd.command);
    project.addCommand(ProjectFolderDelete.command);
    project.addCommand(ProjectFolderFind.command);
    project.addCommand(ProjectFolderGet.command);
    project.addCommand(ProjectFolderPatch.command);
    return project;
  }

  async run(): Promise<void> {
    // ...
  }
}
