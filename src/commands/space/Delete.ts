import { Command } from 'commander';
import { BaseCommand, IGlobalOptions } from '../BaseCommand.js';

export interface ICommandOptions extends IGlobalOptions {
}

export default class UserSpaceDelete extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('delete');
    BaseCommand.CliOptions(cmd);
    cmd
      .description('Deletes a user space and its contents. Throws when the user has no write permission to the space.')
      .action(async (options) => {
        const instance = new UserSpaceDelete(cmd);
        await instance.run(options);
      });
    return cmd;
  }

  async run(options: ICommandOptions): Promise<void> {
    this.apiStore.validateUserSpace(options);
    const { space } = options;

    const env = await this.readEnvironment(options);
    const sdk = this.apiStore.getSdk(env);
    await this.apiStore.getStoreSessionToken(sdk, env);
    await sdk.space.delete(space as string);
  }
}
