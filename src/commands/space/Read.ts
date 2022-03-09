import { Command } from 'commander';
import { BaseCommand, IGlobalOptions } from '../BaseCommand.js';
import { printSpaceInfo } from './Utils.js';

export interface ICommandOptions extends IGlobalOptions {
  projectVersion?: string;
}

export default class SpaceRead extends BaseCommand {
  static get command(): Command {
    const cmd = new Command('read');
    BaseCommand.CliOptions(cmd);
    cmd
      .description('Reads and prints a space from the store. This is only available for the net-store type connection.')
      .action(async (options) => {
        const instance = new SpaceRead(cmd);
        await instance.run(options);
      });
    return cmd;
  }

  async run(options: ICommandOptions): Promise<void> {
    this.validateUserSpace(options);
    const { space } = options;

    const env = await this.readEnvironment(options);
    const sdk = this.getSdk(env);
    await this.getStoreSessionToken(sdk, env);

    const value = await sdk.space.read(space as string);
    printSpaceInfo(value);
  }
}
