import inquirer from 'inquirer';
import { uuidV4, StoreSdk } from '@api-client/core';
import { Config, IConfigEnvironment } from '../lib/Config.js';
import { ApiStore } from '../lib/ApiStore.js';


export interface IEnvironmentCreateOptions {
  name: string;
  location: string;
  makeDefault: boolean;
  authenticate: boolean;
  source: 'file' | 'net-store';
}

export class ConfigInteractions {
  /**
   * Presents a list of environments to pick.
   */
  static async selectEnvironment(config: Config, api: ApiStore): Promise<string> {
    const data = await config.read();
    const { environments=[] } = data;
    if (!environments.length) {
      await this.suggestCreateEnvironment(config, api);
      return this.selectEnvironment(config, api);
    }
    const choices: any = [];
    data.environments.forEach((env) => {
      choices.push({
        name: env.name,
        value: env.key,
      });
    })
    const result = await inquirer.prompt({
      type: 'list',
      name: 'env',
      message: 'Select the environment to use:',
      choices,
    });
    return result.env;
  }

  /**
   * Collect user options to create an environment.
   */
  static async createStoreOptions(): Promise<IEnvironmentCreateOptions> {
    const result: IEnvironmentCreateOptions = {
      source: 'net-store',
      name: '',
      location: '',
      authenticate: false,
      makeDefault: false,
    };
    result.name = await ConfigInteractions.getEnvironmentName();
    result.location = await this.getStoreUrl();
    result.authenticate = await this.shouldAuthenticateStore();
    result.makeDefault = await this.shouldMakeDefaultEnvironment();
    return result;
  }

  /**
   * Asks the user about environment name.
   */
  static async getEnvironmentName(): Promise<string> {
    const result = await inquirer.prompt({
      type: 'input',
      message: 'Enter the environment name',
      name: 'name',
      validate: async (value: string): Promise<string | boolean> => {
        if (!value) {
          return `Please, enter a value.`;
        }
        return true;
      }
    });
    return result.name;
  }

  /**
   * Asks the user about the location to the store.
   */
  static async getStoreUrl(): Promise<string> {
    const result = await inquirer.prompt({
      type: 'input',
      message: 'Enter base URI to the store, for example http://localhost:8487/v1',
      name: 'url',
      validate: (value: string): string | boolean => {
        const error = ApiStore.validateStoreUrl(value);
        if (error) {
          return error;
        }
        return true;
      }
    });
    return result.url;
  }

  /**
   * Asks the user whether they want to authenticate the store in the multi-user scenario
   */
  static async shouldAuthenticateStore(): Promise<boolean> {
    const result = await inquirer.prompt({
      type: 'confirm',
      message: 'Would you like to authenticate with the store? You will be asked about that later when no.',
      default: true,
      name: 'authenticate',
    });
    return result.authenticate;
  }

  /**
   * Asks the user whether they want to set a default project location.
   */
  static async shouldMakeDefaultEnvironment(): Promise<boolean> {
    const result = await inquirer.prompt({
      type: 'confirm',
      message: 'Would you like to set this environment as default?',
      default: true,
      name: 'isDefault',
    });
    return result.isDefault;
  }

  static async suggestCreateEnvironment(config: Config, api: ApiStore): Promise<void> {
    process.stdout.write(`It looks like you don't have any environment configured.\nI'll ask you few question about the store you would like to connect.\n`);
    const options = await ConfigInteractions.createStoreOptions();
    const env: IConfigEnvironment = {
      key: uuidV4(),
      source: options.source,
      name: options.name,
      location: options.location,
      authenticated: false,
    };
    await config.addEnvironment(env, { makeDefault: options.makeDefault });
    if (options.authenticate) {
      const sdk = new StoreSdk(env.location as string);
      const { token, expires } = await sdk.auth.createSession();
      sdk.token = token;
      env.token = token;
      env.tokenExpires = expires;
      try {
        await api.authenticateStore(sdk);
      } catch (e) {
        const err = e as Error;
        throw new Error(`Unable to authenticate: ${err.message}`);
      }
      env.authenticated = true;
      const data = await config.read();
      await config.write(data);
    }
  }
}
