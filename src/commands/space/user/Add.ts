import { Command, Option } from 'commander';
import { AccessControlLevel } from '@api-client/core';
import { BaseCommand, IGlobalOptions } from '../../BaseCommand.js';

export interface ICommandOptions extends IGlobalOptions {
  level: string;
}

export default class SpaceAddUser extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('add');
    BaseCommand.CliOptions(cmd);
    const lvlOption = new Option('-l, --level <level>', 'Access level for the user.');
    lvlOption.choices(['read', 'comment', 'write', 'owner']);
    lvlOption.required = true;
    cmd
      .argument('<user>', 'The key of the user to add to the space.')
      .description('Adds a user to the workspace. This is only available for the net-store type connection.')
      .addOption(lvlOption)
      .action(async (user, options) => {
        const instance = new SpaceAddUser(cmd);
        await instance.run(user, options);
      });
    return cmd;
  }

  async run(userKey: string, options: ICommandOptions): Promise<void> {
    this.apiStore.validateUserSpace(options);
    const { level, space } = options;
    if (!level) {
      throw new Error(`The "--level" option is required.`);
    }
    const env = await this.readEnvironment(options);
    const sdk = this.apiStore.getSdk(env);
    await this.apiStore.getStoreSessionToken(sdk, env);
    
    await sdk.space.patchUsers(space as string, [{
      uid: userKey,
      op: 'add',
      value: level as AccessControlLevel,
    }]);
    const user = await sdk.user.read(userKey);
    this.println(`The user ${user.name} has been added to the space with the ${level} access.`);
  }
}
