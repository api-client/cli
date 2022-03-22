import { Command } from 'commander';
import { HttpProject } from '@api-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from './ProjectCommandBase.js';
import { ProjectCommand } from '../ProjectCommand.js';
import { printProjectInfo } from './Utils.js';
import { GeneralInteractions } from '../../interactive/GeneralInteractions.js';
import { ProjectInteractions } from '../../interactive/ProjectInteractions.js';
import { FileSourceInteractions } from '../../interactive/FileSourceInteractions.js';
import { ConfigInteractions } from '../../interactive/ConfigInteractions.js';
import { StoreInteractions } from '../../interactive/StoreInteractions.js';

export interface ICommandOptions extends IProjectCommandOptions {
  projectVersion?: string;
  interactive?: boolean;
}

export default class ProjectAdd extends ProjectCommandBase {
  /**
   * The command, e.g. `project request add`
   */
  static get command(): Command {
    const cmd = new Command('add');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.outputOptions(cmd);
    cmd
      .argument('[name]', 'The name of the project to create. When not set it runs an interactive UI to create the project.')
      .description('Creates a new HTTP project. Depending on the configuration it creates the project in the data store, file, our prints the project to the terminal.')
      .option('-v, --project-version [value]', 'Sets the version of the project')
      .option('--interactive', 'Runs an interactive shell to add a project.')
      .action(async (name, options) => {
        const instance = new ProjectAdd(cmd);
        if (!name || options.interactive) {
          await instance.interactive();
        } else {
          await instance.run(name, options);
        }
      });
    return cmd;
  }

  /**
   * Runs the command to create a new HTTP project.
   * @param projectName The name of the project to set.
   * @param options Command options.
   */
  async run(projectName: string, options: ICommandOptions={}): Promise<void> {
    const project = this.createProject(projectName, options);
    await this.finishProject(project, options);
  }

  /**
   * Creates an instance of an HTTP project from the passed options.
   * @param projectName The name of the project to set.
   * @param options Command options.
   */
  createProject(projectName: string, options: ICommandOptions={}): HttpProject {
    const project = HttpProject.fromName(projectName);
    if (options.projectVersion) {
      const { info } = project;
      info.version = options.projectVersion;
    }
    return project;
  }

  /**
   * Custom save function to mitigate missing project snapshot 
   */
  protected async finishProjectStore(result: HttpProject, options: IProjectCommandOptions): Promise<void> {
    const sdk = await this.getAuthenticatedSdk(options);
    const { space } = options;
    const altered = result.toJSON();
    const id = await sdk.project.create(space as string, altered);
    const created = await sdk.project.read(space as string, id);
    printProjectInfo(new HttpProject(created));
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
    const name = await ProjectInteractions.projectName();
    const projectVersion = await ProjectInteractions.projectVersion();
    const defaultLocation = FileSourceInteractions.filePathFromName(name);
    const location = await FileSourceInteractions.getProjectFileLocation(defaultLocation);

    const options: ICommandOptions = {
      projectVersion,
      out: location,
    };
    await this.run(name, options);
    this.printCommand(name, options);
  }

  /**
   * Creates a new project in the data store.
   */
  async interactiveStore(): Promise<void> {
    // 1. select / create environment
    // 2. select / create space
    // 3. get project name
    // 4. get optional version
    // 5. Create the project
    // 6. Print command.
    const envId = await ConfigInteractions.selectEnvironment(this.config, this.apiStore);
    const spaceId = await StoreInteractions.selectSpace(this.config, this.apiStore, envId);
    const name = await ProjectInteractions.projectName();
    const projectVersion = await ProjectInteractions.projectVersion();

    const options: ICommandOptions = {
      projectVersion,
      configEnv: envId,
      space: spaceId,
    };

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
      `api-client project add "${name}"`,
    ];
    if (options.projectVersion) {
      lines.push(`--project-version "${options.projectVersion}"`);
    }
    if (options.out) {
      lines.push(`--out ${options.out}`);
    }
    if (options.space) {
      lines.push(`--space ${options.space}`);
    }
    if (options.configEnv) {
      lines.push(`--config-env ${options.configEnv}`);
    }
    this.printCommandExample(lines);
  }
}
