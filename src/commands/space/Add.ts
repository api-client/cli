import { Command } from 'commander';
import { Workspace } from '@api-client/core';
import { BaseCommand, IGlobalOptions } from '../BaseCommand.js';
import { printSpaceInfo } from './Utils.js';

export interface ICommandOptions extends IGlobalOptions {
  // skipExisting?: boolean;
}

/**
 * A command that adds a user space to the store.
 */
export default class UserSpaceAdd extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('add');
    BaseCommand.CliOptions(cmd);
    cmd
      .argument('<name>', 'The name of the user space')
      .description('Creates a new new user space in the data store. This is only available for the net-store type connection.')
      // .option('-S, --skip-existing', 'Ignores the operation when the user space with the same name exists. This command can be used used to ensure that the user space exists.')
      .action(async (name, options) => {
        const instance = new UserSpaceAdd(cmd);
        await instance.run(name, options);
      });
    return cmd;
  }

  async run(name: string, options: ICommandOptions): Promise<void> {
    const env = await this.readEnvironment(options);
    const sdk = this.apiStore.getSdk(env);
    await this.apiStore.getStoreSessionToken(sdk, env);
    // const { skipExisting } = options;
    const workspace = Workspace.fromName(name);
    const key = await sdk.space.create(workspace);
    const created = await sdk.space.read(key);
    printSpaceInfo(created)
  }
}
