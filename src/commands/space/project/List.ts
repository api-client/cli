import { Command } from 'commander';
import { IListOptions, IHttpProjectListItem } from '@api-client/core';
import { BaseCommand, IGlobalOptions } from '../../BaseCommand.js';
import { printProjectsTable } from '../../project/Utils.js';

export interface ICommandOptions extends IGlobalOptions, IListOptions {
}

export default class ListProjects extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('list');
    BaseCommand.CliOptions(cmd);
    BaseCommand.ListOptions(cmd);
    cmd
      .description('Lists projects in a user space.')
      .action(async (opts) => {
        const instance = new ListProjects(cmd);
        await instance.run(opts);
      });
    return cmd;
  }

  async run(options: ICommandOptions = {}): Promise<void> {
    this.validateUserSpace(options);
    const { space } = options;

    const env = await this.readEnvironment(options);
    const sdk = this.getSdk(env);
    await this.getStoreSessionToken(sdk, env);
    const response = await sdk.project.list(space as string, options);
    const instances = (response.data as IHttpProjectListItem[]);
    printProjectsTable(instances);
    if (response.cursor) {
      this.println(`Next page cursor: ${response.cursor}`);
    }
  }
}
