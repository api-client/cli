import { Command } from 'commander';
import { BaseCommand, IGlobalOptions } from './BaseCommand.js';
import { Config, IConfigEnvironment } from '../lib/Config.js';

export interface ICommandOptions extends IGlobalOptions {
}

/**
 * CLI auth in the store command
 * - auth - authorizes the current environment
 * - auth --E xxxx - authorizes the selected environment
 * - auth whoami [--E xxxx]
 * - auth renew [--E xxxx]
 */
export default class AuthCommand extends BaseCommand {
  async run(options?: ICommandOptions): Promise<void> {
    if (!process.stdout.isTTY) {
      throw new Error(`This commands can only run in the interactive mode.`);
    }
    await this.authorize(options);
  }

  protected validateEnvironment(env: IConfigEnvironment): void {
    if (!env.key) {
      throw new Error(`Unable to authenticate an abstract environment.`);
    }
    if (env.source !== 'net-store') {
      throw new Error(`Unable to authenticate a non-http connection.`);
    }
    if (!env.location) {
      throw new Error(`Incomplete configuration of the environment. Missing the "location" value.`);
    }
  }

  protected async whoami(options: ICommandOptions = {}): Promise<void> {
    if (!process.stdout.isTTY) {
      throw new Error(`This commands can only run in the interactive mode.`);
    }
    const env = await this.readEnvironment(options);
    this.validateEnvironment(env);
    const sdk = this.getSdk(env);
    await this.getStoreSessionToken(sdk, env);
    const user = await sdk.user.me();
    this.println(user.name)
  }

  protected async renew(options: ICommandOptions = {}): Promise<void> {
    if (!process.stdout.isTTY) {
      throw new Error(`This commands can only run in the interactive mode.`);
    }
    const env = await this.readEnvironment(options);
    this.validateEnvironment(env);
    const sdk = this.getSdk(env);
    const token = await this.getStoreSessionToken(sdk, env);
    const info = await sdk.auth.renewToken(token);
    const config = new Config();
    const data = await config.read();
    const i = config.getEnvIndex(data, options.configEnv);
    data.environments[i].token = info.token;
    data.environments[i].authenticated = true;
    await config.write(data);
    this.println(`OK`);
  }

  protected async authorize(options: ICommandOptions = {}): Promise<void> {
    if (!process.stdout.isTTY) {
      throw new Error(`This commands can only run in the interactive mode.`);
    }
    const env = await this.readEnvironment(options);
    this.validateEnvironment(env);
    const sdk = this.getSdk(env);
    const token = await this.getStoreSessionToken(sdk, env);
    const config = new Config();
    const data = await config.read();
    const i = config.getEnvIndex(data, options.configEnv);
    data.environments[i].token = token;
    data.environments[i].authenticated = true;
    await config.write(data);
    this.println(`OK`);
  }

  /**
   * The command definition.
   */
  static get command(): Command {
    const cmd = new Command('auth');
    const desc = [
      `Only available with the net-store. Commands related to user authentication.`,
    ];
    cmd.description(desc.join('\n'));
    BaseCommand.CliOptions(cmd);
    // const arg = new Argument('action', 'The action to perform').argOptional().choices(['whoami', 'renew']);
    cmd
      .description('The user authorization command.')
      .action(async (options) => {
        const instance = new AuthCommand(cmd);
        await instance.run(options);
      });

    const whoami = new Command('whoami')
    .description('Identifies the user in the store')
    .action(async (options) => {
      const instance = new AuthCommand(cmd);
      await instance.whoami(options);
    });
    cmd.addCommand(whoami);

    const renew = new Command('renew')
    .description('Renews the session token')
    .action(async (options) => {
      const instance = new AuthCommand(cmd);
      await instance.renew(options);
    });
    cmd.addCommand(renew);
    return cmd;
  }
}
