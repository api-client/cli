import { Command } from 'commander';
import fs from 'fs/promises';
import { ProjectRequest, Thing, ISafePayload } from '@advanced-rest-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { pathExists } from '../../../lib/Fs.js';

export interface ICommandOptions extends IProjectCommandOptions {
  name?: string;
  method?: string;
  folder?: string;
  header?: string[];
  data?: string[];
  addFolder?: boolean;
}

/**
 * A command that adds a request to a project.
 */
export default class ProjectRequestAdd extends ProjectCommandBase {
  /**
   * The command, e.g. `project request add`
   */
  static get command(): Command {
    const createProject = new Command('add');
    createProject
      .argument('<URL>', 'The URL of the request')
      .description('Creates a new HTTP request in a project')
      .option('-n, --name [value]', 'Sets the name of the request. Default to the URL.')
      .option('-m, --method [value]', 'The HTTP method of the request. Default to GET.', 'GET')
      .option('-f, --folder [name or key]', 'The name or the key of the folder to put the request into. Default to put the request directly into the project.')
      .option('--add-folder', 'When set it creates a folder with the name of "--folder", if one doesn\'t exist.')
      .option('-H, --header [header...]', 'The full value of a single header line to add.')
      .option('-d, --data [data...]', 'The payload to send with the request. If used more than once the data pieces will be concatenated with a separating &-symbol. When used with the @-symbol it reads the file from the filesystem. The data does not manipulate the content type header.')
      .action(async (url, options) => {
        const instance = new ProjectRequestAdd();
        await instance.run(url, options);
      });
    ProjectCommandBase.defaultOptions(createProject);
    return createProject;
  }

  async run(url: string, options: ICommandOptions): Promise<void> {
    const project = await this.readProject(options.in);
    const request = ProjectRequest.fromUrl(url, project);
    this.appendName(request, options);
    this.appendMethod(request, options);
    this.appendHeaders(request, options);
    await this.appendData(request, options);

    if (options.folder) {
      const existingFolder = project.findFolder(options.folder);
      if (!existingFolder && options.addFolder) {
        project.addFolder(options.folder);
      } else if (!existingFolder && !options.addFolder) {
        throw new Error(`Unable to locate the "${options.folder}" folder in the project. Use the "--add-folder" option to create a new folder.`)
      }
    }
    
    project.addRequest(request, { parent: options.folder });
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
      const buffer = await this.readFileContents(input.substr(1));
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
