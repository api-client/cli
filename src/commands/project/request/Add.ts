import { Command } from 'commander';
import fs from 'fs/promises';
import { ProjectRequest, Thing, ISafePayload, fs as coreFs } from '@api-client/core';
import { ProjectCommandBase, IProjectCommandOptions } from '../ProjectCommandBase.js';
import { ProjectCommand } from '../../ProjectCommand.js';
import { parseInteger } from '../../ValueParsers.js';
import { GeneralInteractions } from '../../../interactive/GeneralInteractions.js';
import { ProjectInteractions } from '../../../interactive/ProjectInteractions.js';
import { FileSourceInteractions } from '../../../interactive/FileSourceInteractions.js';
import { ConfigInteractions } from '../../../interactive/ConfigInteractions.js';
import { StoreInteractions } from '../../../interactive/StoreInteractions.js';
import { RequestInteractions } from '../../../interactive/RequestInteractions.js';

export interface ICommandOptions extends IProjectCommandOptions {
  name?: string;
  method?: string;
  parent?: string;
  header?: string[];
  data?: string[];
  addParent?: boolean;
  index?: number;
  interactive?: boolean;
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
      .argument('[URL]', 'The URL of the request. When not set it runs an interactive UI to create the request.')
      .description('Creates a new HTTP request in a project')
      .option('-N, --name [value]', 'Sets the name of the request. Default to the URL.')
      .option('-m, --method [value]', 'The HTTP method of the request. Default to GET.', 'GET')
      .option('-H, --header [header...]', 'The full value of a single header line to add.')
      .option('-d, --data [data...]', 'The payload to send with the request. If used more than once the data pieces will be concatenated with a separating &-symbol. When used with the @-symbol it reads the file from the filesystem. The data does not manipulate the content type header.')
      .option('-n, --index [position]', 'The 0-based position at which to add the request into the list.', parseInteger.bind(null, 'index'))
      .option('--add-parent', 'When set it creates a folder with the name of "--parent", if one doesn\'t exist.')
      .option('--interactive', 'Runs an interactive shell to add a request.')
      .action(async (url, options) => {
        const instance = new ProjectRequestAdd(cmd);
        if (!url || options.interactive) {
          await instance.interactive();
        } else {
          await instance.run(url, options);
        }
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
    const exists = await coreFs.pathExists(fileLocation);
    if (!exists) {
      throw new Error(`Request data input: No such file ${fileLocation}`);
    }
    const contents = await fs.readFile(fileLocation);
    return contents;
  }

  async interactive(): Promise<void> {
    GeneralInteractions.ttyOrThrow();
    // ask for the destination, depending on that a different flow is employed.
    const src = await GeneralInteractions.storeSource();
    if (src === 'file') {
      await this.interactiveFile();
    } else if (src === 'net-store') {
      await this.interactiveStore();
    }
  }

  /**
   * Creates a project file.
   */
  async interactiveFile(): Promise<void> {
    const file = await FileSourceInteractions.projectSourceFile();
    const project = await this.fileStore.readProject(file);

    const name = await RequestInteractions.requestName();
    const url = await RequestInteractions.requestUrl();
    const method = await RequestInteractions.httpOperation();
    
    const parent = await ProjectInteractions.chooseFolder(project, {
      allowCreate: true,
    });
    const location = await FileSourceInteractions.getProjectFileLocation(file);
    const options: ICommandOptions = {
      in: file,
      method,
      name,
    };
    if (file === location) {
      options.overwrite = true;
    } else {
      options.out = location;
    }
    if (parent) {
      options.parent = parent;
    }
    await this.run(url, options);
    this.printCommand(url, options);
  }

  async interactiveStore(): Promise<void> {
    const envId = await ConfigInteractions.selectEnvironment(this.config, this.apiStore);
    const spaceId = await StoreInteractions.selectSpace(this.config, this.apiStore, envId);
    const projectId = await StoreInteractions.selectProject(this.config, this.apiStore, envId, spaceId);
    const options: ICommandOptions = {
      configEnv: envId,
      space: spaceId,
      project: projectId,
    };
    const project = await this.readProject(options);
    options.name = await RequestInteractions.requestName();
    const url = await RequestInteractions.requestUrl();
    options.method = await RequestInteractions.httpOperation();
    const parent = await ProjectInteractions.chooseFolder(project, {
      allowCreate: true,
    });
    if (parent) {
      options.parent = parent;
    }
    await this.run(url, options);
    this.printCommand(url, options);
  }

  /**
   * @param url The request URL
   * @param options Collected options.
   */
  printCommand(url: string, options: ICommandOptions): void {
    const lines: string[] = [
      `api-client project folder add "${url}"`,
    ];
    if (options.name) {
      lines.push(`--name "${options.name}"`);
    }
    if (options.method) {
      lines.push(`--method "${options.method}"`);
    }
    if (options.parent) {
      lines.push(`--parent "${options.parent}"`);
    }
    if (options.out) {
      lines.push(`--out "${options.out}"`);
    }
    if (options.overwrite) {
      lines.push(`--overwrite`);
    }
    if (options.space) {
      lines.push(`--space "${options.space}"`);
    }
    if (options.project) {
      lines.push(`--project "${options.project}"`);
    }
    if (options.configEnv) {
      lines.push(`--config-env "${options.configEnv}"`);
    }
    this.printCommandExample(lines);
  }
}
