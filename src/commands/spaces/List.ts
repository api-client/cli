/* eslint-disable import/no-named-as-default-member */
import { Command } from 'commander';
import { IListResponse, IUserWorkspace } from '@api-client/core';
import { BaseCommand, IGlobalOptions } from '../BaseCommand.js';
import { printSpacesTable } from './Utils.js';

export default class ListSpaces extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('list');
    BaseCommand.CliOptions(cmd);
    cmd
      .description('Lists all spaces available to the current user.')
      .action(async (opts) => {
        const instance = new ListSpaces();
        await instance.run(opts);
      });
    return cmd;
  }

  async run(opts?: IGlobalOptions): Promise<void> {
    const env = await this.readEnvironment(opts);
    const sdk = this.getSdk(env);
    const token = await this.getStoreSessionToken(sdk, env);
    const result = await sdk.get(`${env.location}/spaces`, {
      token,
    });
    if (result.status !== 200) {
      throw new Error(`Invalid response status code: ${result.status}.`)
    }
    const data = JSON.parse(result.body as string) as IListResponse;
    printSpacesTable(data.data as IUserWorkspace[]);
  }
}
