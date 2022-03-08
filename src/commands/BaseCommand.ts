import { Command } from 'commander';
import chalk from 'chalk';
import { StoreSdk } from '@api-client/core';
import { Config, IConfigEnvironment, IConfig } from '../lib/Config.js';

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
}

export abstract class BaseCommand {
  /**
   * The command definition.
   */
  static get command(): Command {
    throw new Error('Not implemented');
  }

  /**
   * Appends the project common options to the command.
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
        '-S, --store [store URL]', 
        'The URL to the data store to use. It is the base URI of the API Client\'s store.\n' +
        'When using this option an authentication flow may start before running the command.'
      );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract run(...args: any[]): Promise<void>;

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
    return this.getEnv(data, configEnv);
  }

  /**
   * Finds an environment by the name or the key or returns the default environment.
   * 
   * @param data The list of environments configured in the application.
   * @param key Optional key or the name of the environment. When not set it reads the default environment.
   * @returns The environment configuration or throws when not found.
   */
  getEnv(data: IConfig, key?: string): IConfigEnvironment {
    if (!Array.isArray(data.environments) || !data.environments.length) {
      throw new Error('The configuration has no environments.');
    }
    const id = key || data.loaded;
    if (!id) {
      throw new Error('The configuration has no default environment.');
    }
    const result = data.environments.find(i => i.key === id || i.name === id);
    if (!result) {
      throw new Error('The configuration environment not found.');
    }
    return result;
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
    const meUri = `${env.location}/users/me`;
    if (token) {
      const user = await sdk.get(meUri, { token });
      if (user.status !== 200) {
        token = undefined;
      }
    }
    if (!token) {
      token = await sdk.createSession();
      sdk.token = token;
      env.token = token;
      env.authenticated = false;
    }
    const user = await sdk.get(meUri, { token });
    if (user.status === 200) {
      env.authenticated = true;
    } else {
      await this.authenticateStore(sdk);
    }
    return token;
  }

  async authenticateStore(sdk: StoreSdk): Promise<void> {
    const loginEndpoint = `${sdk.baseUri}/auth/login`;
    const result = await sdk.post(loginEndpoint);
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
    await sdk.listenAuth(loginEndpoint);
    // there, authenticated.
  }
}
