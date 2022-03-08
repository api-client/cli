import { join } from 'path';
import { pathExists, canRead, readJson, writeJson } from './Fs.js';

export const Kind = 'CLI#Config';

export class Config {
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
    return join('api-client-cli', 'user-config');
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
    return await pathExists(file);
  }

  /**
   * @returns The contents of the configuration file.
   */
  async read(): Promise<IConfig> {
    const file = this.configFilePath();
    const exists = await pathExists(file);
    if (!exists) {
      return this.default();
    }
    const readable = await canRead(file);
    if (!readable) {
      throw new Error(`[Access error]: The CLI configuration file cannot be read.`);
    }
    const contents = await readJson(file) as IConfig;
    if (!Array.isArray(contents.environments)) {
      contents.environments = [];
    }
    return contents;
  }

  /**
   * @param contents The configuration object to write to the configuration main file.
   */
  async store(contents: IConfig): Promise<void> {
    const file = this.configFilePath();
    await writeJson(file, contents);
  }

  async reset(): Promise<void> {
    await this.store(this.default())
  }

  /**
   * @returns The currently loaded configuration environment or undefined if none.
   */
  async getCurrentEnvironment(): Promise<IConfigEnvironment | undefined> {
    const data = await this.read();
    if (!data.loaded) {
      return undefined;
    }
    const env = data.environments.find(i => i.key === data.loaded);
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
      data.loaded = env.key;
    }
    await this.store(data);
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
    data.loaded = key;
    await this.store(data);
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
  loaded?: string;
  /**
   * The definition of configuration environments.
   */
  environments: IConfigEnvironment[];
}

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
  source: 'file' | 'net-store';
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
