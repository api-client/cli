import { Command } from 'commander';
import { BaseCommand, IGlobalOptions } from '../../BaseCommand.js';

export interface ICommandOptions extends IGlobalOptions {
}

export default class SpaceDeleteUser extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('delete');
    BaseCommand.CliOptions(cmd);
    cmd
      .argument('<user>', 'The key of the user to remove from the space.')
      .description('Removes user access to the workspace. This is only available for the net-store type connection.')
      .action(async (user, options) => {
        const instance = new SpaceDeleteUser(cmd);
        await instance.run(user, options);
      });
    return cmd;
  }

  async run(userKey: string, options: ICommandOptions): Promise<void> {
    this.apiStore.validateUserSpace(options);
    const { space } = options;

    const env = await this.readEnvironment(options);
    const sdk = this.apiStore.getSdk(env);
    await this.apiStore.getStoreSessionToken(sdk, env);
    
    await sdk.space.patchUsers(space as string, [{
      uid: userKey,
      op: 'remove',
    }]);
    const user = await sdk.user.read(userKey);
    this.println(`The user ${user.name} has been removed from the space.`);
  }
}
