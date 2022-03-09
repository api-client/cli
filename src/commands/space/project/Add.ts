import { Command } from 'commander';
import { HttpProject } from '@api-client/core';
import { BaseCommand, IGlobalOptions } from '../../BaseCommand.js';
import { printProjectInfo } from '../../project/Utils.js';

export interface ICommandOptions extends IGlobalOptions {
  projectVersion?: string;
}

export default class SpaceAddProject extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('create');
    BaseCommand.CliOptions(cmd);
    cmd
      .argument('<name>', 'The name of the project')
      .description('Creates a new new user space in the data store. This is only available for the net-store type connection.')
      .option('-v, --project-version [value]', 'Sets the version of the project')
      .action(async (projectName, options) => {
        const instance = new SpaceAddProject(cmd);
        await instance.run(projectName, options);
      });
    return cmd;
  }

  async run(name: string, options: ICommandOptions): Promise<void> {
    this.validateUserSpace(options);
    const { space } = options;

    const env = await this.readEnvironment(options);
    const sdk = this.getSdk(env);
    await this.getStoreSessionToken(sdk, env);
    const project = this.createProject(name, options);

    const id = await sdk.project.create(space as string, project);
    const created = await sdk.project.read(space as string, id);
    printProjectInfo(new HttpProject(created))
  }

  /**
   * Creates an instance of an HTTP project from the passed options.
   * @param projectName The name of the project to set.
   * @param options Command options.
   */
  createProject(projectName: string, options: ICommandOptions): HttpProject {
    const project = HttpProject.fromName(projectName);
    if (options.projectVersion) {
      const { info } = project;
      info.version = options.projectVersion;
    }
    return project;
  }
}
