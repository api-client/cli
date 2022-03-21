import { isAbsolute, dirname } from 'path';
import { stat, writeFile } from 'fs/promises';
import { fs, HttpProject } from '@api-client/core';
import { IProjectCommandOptions } from '../commands/project/ProjectCommandBase.js';

export interface IFileValidatorOptions {
  allowNotExisting?: boolean;
}

/**
 * A class with the logic to handle API projects stored in a file.
 */
export class FileStore {
  static async validateFileLocation(value: string, opts: IFileValidatorOptions = {}): Promise<string | undefined> {
    if (!value) {
      return undefined;
    }
    if (!isAbsolute(value)) {
      return 'Enter an absolute path';
    }
    if (opts.allowNotExisting) {
      return undefined;
    }
    if (await fs.canRead(value) === false) {
      return 'Path does not exist';
    }
    const info = await stat(value);
    if (info.isDirectory()) {
      return 'Selected path is a directory';
    }
    return undefined;
  }

  /**
   * Writes the project contents to the file.
   * 
   * @param result The project to write to the file.
   * @param out The file location.
   * @param options Write options.
   */
  async writeProject(result: HttpProject, out: string, options: IProjectCommandOptions = {}): Promise<void> {
    const contents = JSON.stringify(result, null, options.prettyPrint ? 2 : 0);
    const dir = dirname(out);
    await fs.ensureDir(dir);
    await writeFile(out, contents, 'utf8');
  }

  /**
   * Reads project contents from a file.
   */
  async readProject(location: string): Promise<HttpProject> {
    const exists = await fs.pathExists(location);
    if (!exists) {
      throw new Error(`No such file ${location}`);
    }
    let contents: any; 
    try {
      contents = await fs.readJson(location, { throws: true });
    } catch (e) {
      throw new Error(`Invalid Http Project contents in file ${location}`);
    }
    return new HttpProject(contents);
  }
}
