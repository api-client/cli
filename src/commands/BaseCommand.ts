import { Command, CommanderError } from 'commander';
import chalk from 'chalk';
import { StoreSdk } from '@api-client/core';
import { Config, IConfigEnvironment } from '../lib/Config.js';
import { parseInteger } from './ValueParsers.js';

export interface IGlobalOptions {
  /**
   * The key or the name of the configuration environment to use.
   * When not provided then it takes the default environment, if defined.
   */
  configEnv?: string;
  /**
   * The URL of the store to use to connect to the data.
   * Note, setting this up will require authentication flow when running the command.
   */
  store?: string;
  /**
   * For commands that require a selection of the space. The key of the user space to use.
   */
  space?: string;
}

export abstract class BaseCommand {
  /**
   * The command definition.
   */
  static get command(): Command {
    throw new Error('Not implemented');
  }

  /**
   * Appends common for all commands options.
   * @param command The input command
   * @returns The same command for chaining.
   */
  static CliOptions(command: Command): Command {
    return command
      .option(
        '-E, --config-env [name or key]', 
        'The configuration environment to use. When not set it searches for other options (--in, --store) to read the data.'
      )
      .option(
        '-S, --space [key]', 
        'The key of the user space to use.'
      );
  }

  /**
   * Adds options that are reserved for listing objects from the store.
   */
  static ListOptions(command: Command): Command {
    return command
    .option('-c, --cursor [value]', 'The cursor for pagination. It is returned with every list query.')
    .option('-l, --limit [value]', 'The maximum number of results in the response.', parseInteger.bind(null, 'limit'))
    .option('-q, --query [value]', 'If the API supports it, the query term to filter the results')
    .option('-f, --query-field [value...]', 'The list of fields to apply the "--query" to.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract run(...args: any[]): Promise<void>;

  constructor(public command: Command) {}

  /**
   * Prints out a warning message.
   * @param message The message to write to the stdout
   */
  warn(message: string): void {
    const data = chalk.magenta(`\n${message}\n`);
    process.stdout.write(Buffer.from(data));
  }

  /**
   * Prints out an error message.
   * @param message The message to write to the stdout
   */
  err(message: string): void {
    const data = chalk.red(`\n${message}\n`);
    process.stderr.write(Buffer.from(data));
  }

  /**
   * Prints out a message in a new line.
   * @param message The message to write to the stdout
   */
  println(message: string): void {
    const data =`\n${message}\n`;
    process.stdout.write(Buffer.from(data));
  }

  /**
   * Reads the environment to use depending on the configuration and options. 
   */
  async readEnvironment(opts: IGlobalOptions={}): Promise<IConfigEnvironment> {
    const { configEnv, store } = opts;
    if (configEnv && store) {
      throw new Error(`You can either specify the "--store" or "--config-env" option. Not both.`);
    }
    if (store) {
      return {
        key: '',
        name: 'Default',
        source: 'net-store',
        authenticated: false,
        location: store,
      }
    }
    const config = new Config();
    const data = await config.read();
    return config.getEnv(data, configEnv);
  }

  getSdk(env: IConfigEnvironment): StoreSdk {
    if (!env.location) {
      throw new Error(`The environment has no store location.`);
    }
    if (env.source !== 'net-store') {
      throw new Error(`Current environment is set to a file. Select a "net-store" environment.`);
    }
    const sdk = new StoreSdk(env.location);
    return sdk;
  }

  async getStoreSessionToken(sdk: StoreSdk, env: IConfigEnvironment): Promise<string> {
    let { token } = env;
    const meUri = sdk.getUrl(`/users/me`).toString();
    
    if (token) {
      const user = await sdk.http.get(meUri, { token });
      if (user.status === 200) {
        env.authenticated = true;
        sdk.token = token;
        return token;
      }
      token = undefined;
    }
    if (!token) {
      const ti = await sdk.auth.createSession();
      token = ti.token;
      sdk.token = ti.token;
      env.token = ti.token;
      env.authenticated = false;
    }
    const user = await sdk.http.get(meUri, { token });
    if (user.status === 200) {
      env.authenticated = true;
    } else {
      await this.authenticateStore(sdk);
    }
    return token;
  }

  async authenticateStore(sdk: StoreSdk): Promise<void> {
    const loginEndpoint = sdk.getUrl('/auth/login').toString();
    
    const result = await sdk.http.post(loginEndpoint);
    if (result.status !== 204) {
      throw new Error(`Unable to create the authorization session on the store. Invalid status code: ${result.status}.`);
    }
    if (!result.headers.location) {
      throw new Error(`Unable to create the authorization session on the store. The location header is missing.`);
    }
    const open = await import('open');
    const url = new URL(`/v1${result.headers.location}`, sdk.baseUri).toString();

    console.log(`Opening a web browser to log in to the store.`);
    console.log(`If nothing happened, open this URL: ${url}`);

    await open.default(url); // this has the state parameter.
    await sdk.auth.listenAuth(loginEndpoint);
    // there, authenticated.
  }

  validateUserSpace(options: IGlobalOptions): void {
    const { space } = options;
    if (!space) {
      throw new CommanderError(0, 'E_MISSING_OPTION', `The "space" option is required.`);
    }
  }
}
