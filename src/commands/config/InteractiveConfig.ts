/* eslint-disable import/no-named-as-default-member */
import { Table } from 'console-table-printer';
import { uuidV4, StoreSdk, fs } from '@api-client/core';
import inquirer from 'inquirer';
import { isAbsolute } from 'path';
import { stat } from 'fs/promises';
import { Config, IConfigEnvironment } from '../../lib/Config.js';

export class InteractiveConfig {
  async addEnvironment(rewrite = false): Promise<void> {
    const result = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: 'What is the data source?',
      choices: [
        {
          key: 'f',
          name: 'Local file',
          value: 'file',
        },
        {
          key: 's',
          name: 'API Client store',
          value: 'net-store',
        }
      ],
    });
    let env: IConfigEnvironment;
    if (result.type === 'file') {
      env = await this.createFileEnvironment();
    } else {
      env = await this.createStoreEnvironment();
    }
    const makeDefault = await this.shouldMakeDefaultEnvironment();
    const config = new Config();
    if (rewrite) {
      await config.reset();
    }
    await config.addEnvironment(env, {
      makeDefault,
    });
  }

  async createFileEnvironment(): Promise<IConfigEnvironment> {
    const result: IConfigEnvironment = {
      key: uuidV4(),
      source: 'file',
      name: '',
    };
    result.name = await this.getEnvironmentName();
    const useFileLocation = await this.shouldSetFileLocation();
    if (useFileLocation) {
      const file = await this.getProjectFileLocation();
      if (file) {
        result.location = file;
      }
    }
    return result;
  }

  async createStoreEnvironment(): Promise<IConfigEnvironment> {
    const result: IConfigEnvironment = {
      key: uuidV4(),
      source: 'net-store',
      name: '',
    };
    result.name = await this.getEnvironmentName();
    const url = await this.getStoreUrl();
    result.location = url;
    const sdk = new StoreSdk(url);
    const { token } = await sdk.auth.createSession();
    result.token = token;
    sdk.token = token;
    const info = await sdk.store.getInfo();
    if (info.mode === 'multi-user') {
      if (await this.shouldAuthenticateStore()) {
        try {
          await this.authenticateStore(sdk);
        } catch (e) {
          const err = e as Error;
          throw new Error(`Unable to authenticate: ${err.message}`);
        }
        result.authenticated = true;
      } else {
        result.authenticated = false;
      }
    } else {
      result.authenticated = true;
    }
    return result;
  }

  /**
   * Asks the user about the absolute file location
   */
  async getProjectFileLocation(): Promise<string | undefined> {
    const result = await inquirer.prompt({
      type: 'input',
      message: 'Enter the absolute path to the project file. Empty to skip.',
      name: 'path',
      validate: async (value: string): Promise<string | boolean> => {
        if (!value) {
          return true;
        }
        if (!isAbsolute(value)) {
          return 'Enter an absolute path.';
        }
        if (await fs.canRead(value) === false) {
          return 'Path does not exist.';
        }
        const info = await stat(value);
        if (info.isDirectory()) {
          return 'Selected path is a directory.'
        }
        return true;
      }
    });
    return result.path;
  }

  /**
   * Asks the user whether they want to set a default project location.
   */
  async shouldSetFileLocation(): Promise<boolean> {
    const result = await inquirer.prompt({
      type: 'confirm',
      message: 'Do you want to set a default location of the project file?',
      default: false,
      name: 'useLocation',
    });
    return result.useLocation;
  }

  /**
   * Asks the user about the location to the store.
   */
  async getStoreUrl(): Promise<string> {
    const result = await inquirer.prompt({
      type: 'input',
      message: 'Enter base URI to the store, for example http://localhost:8487/v1',
      name: 'url',
      validate: async (value: string): Promise<string | boolean> => {
        if (!value) {
          return `Please, enter the base URI to the store.`;
        }
        if (!value.startsWith('http:') && !value.startsWith('https:')) {
          return `Invalid scheme. Valid schemes are "http" or "https".`;
        }
        return true;
      }
    });
    return result.url;
  }

  /**
   * Asks the user about environment name.
   */
  async getEnvironmentName(): Promise<string> {
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
   * Asks the user whether they want to authenticate the store in the multi-user scenario
   */
  async shouldAuthenticateStore(): Promise<boolean> {
    const result = await inquirer.prompt({
      type: 'confirm',
      message: 'Would you like to authenticate with the store? You will be asked about that later when no.',
      default: true,
      name: 'authenticate',
    });
    return result.authenticate;
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
    const authEndpoint = sdk.getUrl(result.headers.location).toString();

    console.log(`Opening a web browser to log in to the store.`);
    console.log(`If nothing happened, open this URL: ${authEndpoint}`);

    await open.default(authEndpoint); // this has the state parameter.
    await sdk.auth.listenAuth(loginEndpoint);
    // there, authenticated.
  }

  /**
   * Asks the user whether they want to set a default project location.
   */
  async shouldMakeDefaultEnvironment(): Promise<boolean> {
    const result = await inquirer.prompt({
      type: 'confirm',
      message: 'Would you like to set this environment as default?',
      default: true,
      name: 'isDefault',
    });
    return result.isDefault;
  }

  async listEnvironments(config: Config): Promise<void> {
    const data = await config.read();
    if (!data.environments || !data.environments.length) {
      console.log('There are no environments in the current configuration.');
      return;
    }
    const table = new Table({
      title: 'Configuration environments',
      columns: [
        { name: 'key', title: 'Key', alignment: 'left', },
        { name: 'name', title: 'Name', alignment: 'left', },
        { name: 'source', title: 'Data source', alignment: 'left', },
        { name: 'location', title: 'Data location', alignment: 'left', },
        { name: 'default', title: 'Default', alignment: 'left', },
      ],
    });
    data.environments.forEach((item) => {
      table.addRow({
        key: item.key,
        name: item.name,
        source: item.source,
        location: item.location,
        default: item.key === data.loaded ? 'Yes' : 'No',
      });
    });
    table.printTable();
  }

  /**
   * Asks the user to select an environment.
   * @returns The key of selected environment.
   */
  async selectEnvironment(): Promise<string> {
    const config = new Config();
    const data = await config.read();
    if (!Array.isArray(data.environments) || !data.environments.length) {
      throw new Error(`You do not have any configured environments.`);
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
}
