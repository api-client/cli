import { join } from 'path';
import { fs } from '@api-client/core';

export const Kind = 'CLI#Config';

export class Config {
  /**
   * The currently stored in-memory configuration.
   */
  current?: IConfig;

  /**
   * The expected result is:
   * - OS X - '/Users/user/Library/Preferences'
   * - Windows >= 8 - 'C:\Users\user\AppData\Roaming'
   * - Windows XP - 'C:\Documents and Settings\user\Application Data'
   * - Linux - '/home/user/.local/share'
   * 
   * @returns The path to the user config directory depending on the system.
   */
  configPath(): string {
    return process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
  }

  /**
   * @returns The path to the user configuration folder relative to the system's config path.
   */
  appPath(): string {
    return join('api-client', 'user-config');
  }

  /**
   * @returns Absolute path to the application user configuration folder.
   */
  configRoot(): string {
    return join(this.configPath(), this.appPath());
  }

  /**
   * @returns The absolute location of the main configuration file.
   */
  configFilePath(): string {
    return join(this.configRoot(), 'cli.json');
  }

  /**
   * @returns The default configuration for the CLI.
   */
  default(): IConfig {
    return {
      environments: [],
      kind: Kind,
      version: 1,
    };
  }

  /**
   * @returns True when the config file exists.
   */
  async hasConfig(): Promise<boolean> {
    const file = this.configFilePath();
    return fs.pathExists(file);
  }

  /**
   * @returns The contents of the configuration file.
   */
  async read(): Promise<IConfig> {
    if (this.current) {
      return this.current;
    }
    const file = this.configFilePath();
    const exists = await fs.pathExists(file);
    if (!exists) {
      return this.default();
    }
    const readable = await fs.canRead(file);
    if (!readable) {
      throw new Error(`[Access error]: The CLI configuration file cannot be read.`);
    }
    const contents = await fs.readJson(file) as IConfig;
    if (!Array.isArray(contents.environments)) {
      contents.environments = [];
    }
    this.current = contents;
    return contents;
  }

  /**
   * @param contents The configuration object to write to the configuration main file.
   */
  async write(contents: IConfig): Promise<void> {
    const file = this.configFilePath();
    await fs.writeJson(file, contents);
  }

  async reset(): Promise<void> {
    this.current = this.default();
    await this.write(this.current);
  }

  /**
   * @returns The currently loaded configuration environment or undefined if none.
   */
  async getCurrentEnvironment(): Promise<IConfigEnvironment | undefined> {
    const data = await this.read();
    if (!data.current) {
      return undefined;
    }
    const env = data.environments.find(i => i.key === data.current);
    if (!env) {
      console.warn(`Invalid configuration. The loaded environment does not exist.`);
      return undefined;
    }
    return env;
  }

  /**
   * Adds an environment to the configuration
   * @param env The environment definition.
   * @param options Add options.
   */
  async addEnvironment(env: IConfigEnvironment, options: IEnvironmentAddOptions = {}): Promise<void> {
    const data = await this.read();
    data.environments.push(env);
    if (options.makeDefault) {
      data.current = env.key;
    }
    await this.write(data);
  }

  /**
   * @param key the configuration environment to use.
   */
  async setDefault(key: string): Promise<void> {
    const data = await this.read();
    const env = data.environments.find(i => i.key === key);
    if (!env) {
      throw new Error(`Configuration environment ${key} does not exist.`);
    }
    data.current = key;
    await this.write(data);
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
    const id = key || data.current;
    if (!id) {
      throw new Error('The configuration has no default environment.');
    }
    const result = data.environments.find(i => i.key === id || i.name === id);
    if (!result) {
      throw new Error('The configuration environment not found.');
    }
    return result;
  }

  async readEnv(key?: string): Promise<IConfigEnvironment> {
    const data = await this.read();
    return this.getEnv(data, key);
  }

  /**
   * Finds an environment by the name or the key or returns the default environment.
   * 
   * @param data The list of environments configured in the application.
   * @param key Optional key or the name of the environment. When not set it reads the default environment.
   * @returns The environment configuration or throws when not found.
   */
  getEnvIndex(data: IConfig, key?: string): number {
    if (!Array.isArray(data.environments) || !data.environments.length) {
      throw new Error('The configuration has no environments.');
    }
    const id = key || data.current;
    if (!id) {
      throw new Error('The configuration has no default environment.');
    }
    return data.environments.findIndex(i => i.key === id || i.name === id);
  }

  /**
   * Updates the definition of an environment.
   * @param env The environment to update.
   */
  async updateEnvironment(env: IConfigEnvironment): Promise<void> {
    const data = await this.read();
    const index = this.getEnvIndex(data, env.key);
    if (index === -1) {
      throw new Error(`Updating an environment that does not exist.`);
    }
    data.environments[index] = env;
    this.write(data);
  }
}

/**
 * The CLI configuration schema.
 */
export interface IConfig {
  kind: typeof Kind;
  /**
   * The version of this configuration.
   */
  version: 1;
  /**
   * The name of the loaded environment.
   * When not set it returns to defaults and the cli expect configuration options read from the suer input.
   */
  current?: string;
  /**
   * The definition of configuration environments.
   */
  environments: IConfigEnvironment[];
}

export type DataSourceType = 'file' | 'net-store';

/**
 * The definition of the configuration environment.
 */
export interface IConfigEnvironment {
  /**
   * The key of the environment.
   */
  key: string;
  /**
   * The source of the data.
   * When file it expects the `in` parameter to be set and the CLI operates on a single project file.
   * When `net-store` is selected then it requires store configuration with the URL to the store.
   */
  source: DataSourceType;
  /**
   * The name for the environment
   */
  name: string;
  /**
   * The location of either the file (optional) or the full base URL to the `net-store` (required).
   */
  location?: string;
  /**
   * The auth token to use with the store APIs.
   */
  token?: string;
  /**
   * The access token expiration time. 
   * May not be set if the store's tokens do not expire.
   */
  tokenExpires?: number;
  /**
   * A flag indicating whether the token was authenticated with the user.
   */
  authenticated?: boolean;
}

export interface IEnvironmentAddOptions {
  /**
   * Whether to make this environment default.
   */
  makeDefault?: boolean;
}
