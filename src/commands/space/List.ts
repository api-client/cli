/* eslint-disable import/no-named-as-default-member */
import { Command } from 'commander';
import { IUserWorkspace, IListOptions } from '@api-client/core';
import { BaseCommand, IGlobalOptions } from '../BaseCommand.js';
import { printSpacesTable } from './Utils.js';

export interface ICommandOptions extends IGlobalOptions, IListOptions {
}

export default class ListSpaces extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('list');
    BaseCommand.CliOptions(cmd);
    BaseCommand.ListOptions(cmd);
    cmd
      .description('Lists spaces available to the current user.')
      .action(async (opts) => {
        const instance = new ListSpaces(cmd);
        await instance.run(opts);
      });
    return cmd;
  }

  async run(opts: ICommandOptions = {}): Promise<void> {
    const env = await this.readEnvironment(opts);
    const sdk = this.apiStore.getSdk(env);
    await this.apiStore.getStoreSessionToken(sdk, env);
    const response = await sdk.space.list(opts);
    printSpacesTable(response.data as IUserWorkspace[]);
    if (response.cursor) {
      this.println(`Next page cursor: ${response.cursor}`);
    }
  }
}
