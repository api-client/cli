import { Command } from 'commander';
import { ISpaceUser } from '@api-client/core';
import { BaseCommand, IGlobalOptions } from '../../BaseCommand.js';
import { printSpaceUsersTable } from '../../users/Utils.js';

export interface ICommandOptions extends IGlobalOptions {
}

export default class SpaceListUsers extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('list');
    BaseCommand.CliOptions(cmd);
    cmd
      .description('Lists the users having access to the user space.')
      .action(async (options) => {
        const instance = new SpaceListUsers(cmd);
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
    
    const result = await sdk.space.listUsers(space as string);
    printSpaceUsersTable(result.data as ISpaceUser[]);
  }
}
