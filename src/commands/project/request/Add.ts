import { Command } from 'commander';
import fs from 'fs/promises';
import { ProjectRequest, Thing, ISafePayload } from '@api-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { pathExists } from '../../../lib/Fs.js';
import { ProjectCommand } from '../../ProjectCommand.js';
import { parseInteger } from '../../ValueParsers.js';

export interface ICommandOptions extends IProjectCommandOptions {
  name?: string;
  method?: string;
  parent?: string;
  header?: string[];
  data?: string[];
  addParent?: boolean;
  index?: number;
}

/**
 * A command that adds a request to a project.
 */
export default class ProjectRequestAdd extends ProjectCommandBase {
  /**
   * The command, e.g. `project request add`
   */
  static get command(): Command {
    const cmd = new Command('add');
    ProjectCommand.globalOptions(cmd);
    ProjectCommand.parentSearchOptions(cmd);
    ProjectCommand.outputOptions(cmd);
    cmd
      .argument('<URL>', 'The URL of the request')
      .description('Creates a new HTTP request in a project')
      .option('-N, --name [value]', 'Sets the name of the request. Default to the URL.')
      .option('-m, --method [value]', 'The HTTP method of the request. Default to GET.', 'GET')
      .option('-H, --header [header...]', 'The full value of a single header line to add.')
      .option('-d, --data [data...]', 'The payload to send with the request. If used more than once the data pieces will be concatenated with a separating &-symbol. When used with the @-symbol it reads the file from the filesystem. The data does not manipulate the content type header.')
      .option('-n, --index [position]', 'The 0-based position at which to add the request into the list.', parseInteger.bind(null, 'index'))
      .option('--add-parent', 'When set it creates a folder with the name of "--parent", if one doesn\'t exist.')
      .action(async (url, options) => {
        const instance = new ProjectRequestAdd(cmd);
        await instance.run(url, options);
      });
    
    return cmd;
  }

  async run(url: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options);
    const request = ProjectRequest.fromUrl(url, project);
    this.appendName(request, options);
    this.appendMethod(request, options);
    this.appendHeaders(request, options);
    await this.appendData(request, options);

    if (options.parent) {
      const existingFolder = project.findFolder(options.parent);
      if (!existingFolder && options.addParent) {
        project.addFolder(options.parent);
      } else if (!existingFolder && !options.addParent) {
        throw new Error(`Unable to locate the "${options.parent}" folder in the project. Use the "--add-folder" option to create a new folder.`)
      }
    }
    
    project.addRequest(request, { 
      parent: options.parent,
      index: options.index,
    });
    await this.finishProject(project, options);
  }

  appendName(request: ProjectRequest, options: ICommandOptions): void {
    if (options.name) {
      request.info = Thing.fromName(options.name);
    }
  }

  appendMethod(request: ProjectRequest, options: ICommandOptions): void {
    if (options.method) {
      const expects = request.getExpects();
      expects.method = options.method;
    }
  }

  appendHeaders(request: ProjectRequest, options: ICommandOptions): void {
    if (Array.isArray(options.header) && options.header.length) {
      const value = options.header.join('\n');
      const expects = request.getExpects();
      expects.headers = value;
    }
  }

  async appendData(request: ProjectRequest, options: ICommandOptions): Promise<void> {
    const { data } = options;
    if (!Array.isArray(data)) {
      return;
    }
    const expects = request.getExpects();
    if (data.length > 1) {
      const value = data.join('&');
      expects.payload = value;
      return;
    }
    const [input] = data;
    if (input.startsWith('@')) {
      const buffer = await this.readFileContents(input.substring(1));
      await expects.writePayload(buffer);
    } else {
      expects.payload = input;
    }
  }

  async readTransformedFile(fileLocation: string): Promise<ISafePayload> {
    const buffer = await this.readFileContents(fileLocation);
    const info: ISafePayload = {
      type: 'buffer',
      data: [...buffer],
    };
    return info;
  }

  async readFileContents(fileLocation: string): Promise<Buffer> {
    const exists = await pathExists(fileLocation);
    if (!exists) {
      throw new Error(`Request data input: No such file ${fileLocation}`);
    }
    const contents = await fs.readFile(fileLocation);
    return contents;
  }
}
