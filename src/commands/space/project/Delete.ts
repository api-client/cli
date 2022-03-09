import { Command } from 'commander';
import { BaseCommand, IGlobalOptions } from '../../BaseCommand.js';

export interface ICommandOptions extends IGlobalOptions {
}

export default class SpaceDeleteProject extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('delete');
    BaseCommand.CliOptions(cmd);
    cmd
      .argument('<project>', 'The key of the project to delete from the space.')
      .description('Deletes a project. This is only available for the net-store type connection.')
      .action(async (project, options) => {
        const instance = new SpaceDeleteProject(cmd);
        await instance.run(project, options);
      });
    return cmd;
  }

  async run(projectKey: string, options: ICommandOptions): Promise<void> {
    this.validateUserSpace(options);
    const { space } = options;
    const env = await this.readEnvironment(options);
    const sdk = this.getSdk(env);
    await this.getStoreSessionToken(sdk, env);
    
    await sdk.project.delete(space as string, projectKey);
  }
}
