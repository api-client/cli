import { Command } from 'commander';
import { Environment } from '@advanced-rest-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from './ProjectCommandBase.js';
import { ProjectCommand } from '../ProjectCommand.js';
import { ObjectTable } from '../../lib/ObjectTable.js';

export interface ICommandOptions extends IProjectCommandOptions {
}

interface ProjectDescription {
  key: string;
  name: string;
  environments?: string;
  folders?: string;
  requests?: string;
  schemas?: string;
  license?: string;
  provider?: string;
}

/**
 * A command that prints information about an HTTP project.
 */
export default class ProjectInfo extends ProjectCommandBase {
  static get command(): Command {
    const cmd = new Command('info');
    ProjectCommand.globalOptions(cmd);
    
    cmd
      .description('Prints information about a project.')
      .action(async (options) => {
        const instance = new ProjectInfo();
        await instance.run(options);
      });
    return cmd;
  }

  /**
   * Runs the command to clone an HTTP project.
   * @param options Command options.
   */
  async run(options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const folders = project.listFolders();
    const requests = project.listRequests();
    const { environments, license, provider, definitions } = project;
    
    const info: ProjectDescription = {
      key: project.key,
      name: project.info.name || '',
    };

    const maxWidth = process.stdout.columns || 80;
    const maxValueWidth = maxWidth - 17;

    if (Array.isArray(environments) && environments.length) {
      const envs: Environment[] = [];
      environments.forEach((key) => {
        const env = definitions.environments.find(i => i.key === key);
        if (env) {
          envs.push(env);
        }
      });
      info.environments = envs.map(e => e.info.name || '').join(', ');
      if (info.environments.length > maxValueWidth) {
        info.environments = `${info.environments.substring(0, maxValueWidth)}... (${envs.length})`;
      }
    } else {
      info.environments = '(none)';
    }
  
    if (Array.isArray(folders) && folders.length) {
      info.folders = folders.map(e => e.info.name || '').join(', ');
      if (info.folders.length > maxValueWidth) {
        info.folders = `${info.folders.substring(0, maxValueWidth)}... (${folders.length})`;
      }
    } else {
      info.folders = '(none)';
    }
  
    if (Array.isArray(requests) && requests.length) {
      info.requests = requests.map(e => e.info.name || '').join(', ');
      if (info.requests.length > maxValueWidth) {
        info.requests = `${info.requests.substring(0, maxValueWidth)}... (${requests.length})`;
      }
    } else {
      info.requests = '(none)';
    }

    if (Array.isArray(definitions.schemas) && definitions.schemas.length) {
      info.schemas = definitions.schemas.map(e => e.name || '').join(', ');
      if (info.schemas.length > maxValueWidth) {
        info.schemas = `${info.schemas.substring(0, maxValueWidth)}... (${definitions.schemas.length})`;
      }
    } else {
      info.schemas = '(none)';
    }

    if (license && license.name) {
      info.license = license.name;
    }
    if (provider) {
      const { name, email, url } = provider;
      let data = '';
      if (name) {
        data += `${name} `;
      }
      if (email) {
        data += email;
      } else if (url) {
        data += url;
      }
      info.provider = data;
    }
    const table = new ObjectTable(info);
    table.print();
  }
}
