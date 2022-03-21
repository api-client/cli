import inquirer from 'inquirer';
import { IWorkspace, Workspace } from '@api-client/core';
import { Config } from '../lib/Config.js';
import { ApiStore } from '../lib/ApiStore.js';

export class StoreInteractions {
  /**
   * Lists the available user spaces.
   * 
   * @param config CLI config
   * @param api Store sdk
   * @param env The environment to use.
   */
  static async selectSpace(config: Config, api: ApiStore, env: string): Promise<string> {
    const environment = await config.readEnv(env);
    const sdk = api.getSdk(environment);
    await api.authEnv(sdk, environment);
    const result = await sdk.space.list();
    const data = result.data as IWorkspace[]
    if (!data.length) {
      throw new Error(`You do not have any spaces.`);
    }
    const choices: any[] = [];
    data.forEach((space) => {
      choices.push({
        name: space.info.name || 'Unnamed space',
        value: space.key,
      });
    })
    choices.push(new inquirer.Separator());
    choices.push({
      name: 'Create a new space.',
      value: '',
    });
    const answer = await inquirer.prompt({
      type: 'list',
      name: 'space',
      message: 'Select the space',
      choices,
    });
    if (!answer.space) {
      const name = await this.getSpaceName();
      const space = Workspace.fromName(name);
      return sdk.space.create(space);
    }
    return answer.space;
  }

  /**
   * Asks the user about the space name.
   */
  static async getSpaceName(): Promise<string> {
    const result = await inquirer.prompt({
      type: 'input',
      message: 'Enter the space name',
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
}
