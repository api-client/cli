/* eslint-disable import/no-named-as-default-member */
import { Command } from 'commander';
import { IUser, IListOptions } from '@api-client/core';
import { BaseCommand, IGlobalOptions } from '../BaseCommand.js';
import { printUsersTable } from './Utils.js';

export interface ICommandOptions extends IGlobalOptions, IListOptions {
}

export default class ListUsers extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('list');
    BaseCommand.CliOptions(cmd);
    BaseCommand.ListOptions(cmd);
    cmd
      .description('Lists users in the store.')
      .action(async (opts) => {
        const instance = new ListUsers(cmd);
        await instance.run(opts);
      });
    return cmd;
  }

  async run(opts: ICommandOptions = {}): Promise<void> {
    const env = await this.readEnvironment(opts);
    const sdk = this.apiStore.getSdk(env);
    await this.apiStore.getStoreSessionToken(sdk, env);
    const response = await sdk.user.list(opts);
    
    printUsersTable(response.data as IUser[]);
    if (response.cursor) {
      this.println(`Next page cursor: ${response.cursor}`);
    }
  }
}
