import inquirer from 'inquirer';
import { IWorkspace, Workspace, HttpProject, IHttpProjectListItem } from '@api-client/core';
import { Config } from '../lib/Config.js';
import { ApiStore } from '../lib/ApiStore.js';
import { ProjectInteractions } from './ProjectInteractions.js';

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
      const name = await this.getSpaceName();
      const space = Workspace.fromName(name);
      return sdk.space.create(space);
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
      message: 'Select a space',
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

  static async selectProject(config: Config, api: ApiStore, env: string, space: string): Promise<string> {
    const environment = await config.readEnv(env);
    const sdk = api.getSdk(environment);
    await api.authEnv(sdk, environment);
    const result = await sdk.project.list(space, { limit: 100 });
    const data = result.data as IHttpProjectListItem[]
    if (!data.length) {
      const name = await ProjectInteractions.projectName();
      const project = HttpProject.fromName(name);
      return sdk.project.create(space, project);
    }

    const choices: any[] = [];
    data.forEach((project) => {
      choices.push({
        name: project.name || 'Unnamed project',
        value: project.key,
      });
    })
    choices.push(new inquirer.Separator());
    choices.push({
      name: 'Create a new project.',
      value: '',
    });
    const answer = await inquirer.prompt({
      type: 'list',
      name: 'project',
      message: 'Select a project',
      choices,
    });
    if (!answer.project) {
      const name = await ProjectInteractions.projectName();
      const project = HttpProject.fromName(name);
      return sdk.project.create(space, project);
    }
    return answer.project;
  }
}
