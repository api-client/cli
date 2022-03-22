import { Command } from 'commander';
import { IFolderCreateOptions } from '@api-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { ProjectCommand } from '../../ProjectCommand.js';
import { parseInteger } from '../../ValueParsers.js';
import { GeneralInteractions } from '../../../interactive/GeneralInteractions.js';
import { ProjectInteractions } from '../../../interactive/ProjectInteractions.js';
import { FileSourceInteractions } from '../../../interactive/FileSourceInteractions.js';
import { ConfigInteractions } from '../../../interactive/ConfigInteractions.js';
import { StoreInteractions } from '../../../interactive/StoreInteractions.js';

export interface ICommandOptions extends IProjectCommandOptions, IFolderCreateOptions {
  interactive?: boolean;
}

/**
 * A command that adds a folder to a project.
 */
export default class ProjectFolderAdd extends ProjectCommandBase {
  /**
   * The command, e.g. `project folder add`
   */
  static get command(): Command {
    const cmd = new Command('add');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.parentSearchOptions(cmd);
    ProjectCommand.outputOptions(cmd);
    cmd
      .argument('[name]', 'The name of the folder. When not set it runs an interactive UI to create the project.')
      .description('Creates a new folder in a project')
      .option('-s, --skip-existing', 'Ignores the operation when the folder with the same name exists. This command can be used used to ensure that the folder exists.')
      .option('-n, --index [position]', 'The 0-based position at which to add the folder into the list of items.', parseInteger.bind(null, 'index'))
      .option('--interactive', 'Runs an interactive shell to add a folder.')
      .action(async (name, options) => {
        const instance = new ProjectFolderAdd(cmd);
        if (!name || options.interactive) {
          await instance.interactive();
        } else {
          await instance.run(name, options);
        }
      });
    return cmd;
  }

  async run(name: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options);
    const { skipExisting, parent, index } = options;
    
    project.addFolder(name, { skipExisting, parent, index });
    await this.finishProject(project, options);
  }

  async interactive(): Promise<void> {
    GeneralInteractions.ttyOrThrow();
    // ask for the destination, depending on that a different flow is employed.
    const src = await GeneralInteractions.storeSource();
    if (src === 'file') {
      await this.interactiveFile();
    } else if (src === 'net-store') {
      await this.interactiveStore();
    }
  }

  /**
   * Creates a project file.
   */
  async interactiveFile(): Promise<void> {
    const file = await FileSourceInteractions.projectSourceFile();
    const project = await this.fileStore.readProject(file);

    const name = await ProjectInteractions.folderName();
    const parent = await ProjectInteractions.chooseFolder(project, {
      allowCreate: false,
    });
    const location = await FileSourceInteractions.getProjectFileLocation(file);
    const options: ICommandOptions = {
      in: file,
    };
    if (file === location) {
      options.overwrite = true;
    } else {
      options.out = location;
    }
    if (parent) {
      options.parent = parent;
    }
    await this.run(name, options);
    this.printCommand(name, options);
  }

  async interactiveStore(): Promise<void> {
    const envId = await ConfigInteractions.selectEnvironment(this.config, this.apiStore);
    const spaceId = await StoreInteractions.selectSpace(this.config, this.apiStore, envId);
    const projectId = await StoreInteractions.selectProject(this.config, this.apiStore, envId, spaceId);
    const options: ICommandOptions = {
      configEnv: envId,
      space: spaceId,
      project: projectId,
    };
    const project = await this.readProject(options);
    const name = await ProjectInteractions.folderName();
    const parent = await ProjectInteractions.chooseFolder(project, {
      allowCreate: false,
    });
    if (parent) {
      options.parent = parent;
    }
    await this.run(name, options);
    this.printCommand(name, options);
  }

  /**
   * Evaluates options and prints the command to use the next time.
   * @param name The project name
   * @param options Collected options.
   */
  printCommand(name: string, options: ICommandOptions): void {
    const lines: string[] = [
      `api-client project folder add "${name}"`,
    ];
    if (options.parent) {
      lines.push(`--parent "${options.parent}"`);
    }
    if (options.out) {
      lines.push(`--out "${options.out}"`);
    }
    if (options.overwrite) {
      lines.push(`--overwrite`);
    }
    if (options.space) {
      lines.push(`--space "${options.space}"`);
    }
    if (options.project) {
      lines.push(`--project "${options.project}"`);
    }
    if (options.configEnv) {
      lines.push(`--config-env "${options.configEnv}"`);
    }
    this.printCommandExample(lines);
  }
}
