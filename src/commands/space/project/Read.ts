import { Command } from 'commander';
import { HttpProject } from '@api-client/core';
import { BaseCommand, IGlobalOptions } from '../../BaseCommand.js';
import { printProjectInfo } from '../../project/Utils.js';

export interface ICommandOptions extends IGlobalOptions {
  projectVersion?: string;
}

export default class SpaceReadProject extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('read');
    BaseCommand.CliOptions(cmd);
    cmd
      .argument('<project>', 'The key of the project')
      .description('Reads and prints a project from the store. This is only available for the net-store type connection.')
      .action(async (projectKey, options) => {
        const instance = new SpaceReadProject(cmd);
        await instance.run(projectKey, options);
      });
    return cmd;
  }

  async run(project: string, options: ICommandOptions): Promise<void> {
    this.validateUserSpace(options);
    const { space } = options;

    const env = await this.readEnvironment(options);
    const sdk = this.getSdk(env);
    await this.getStoreSessionToken(sdk, env);

    const value = await sdk.project.read(space as string, project);
    printProjectInfo(new HttpProject(value));
  }
}
