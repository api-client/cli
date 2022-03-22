/* eslint-disable import/no-named-as-default-member */
// import inquirer from 'inquirer';
import { HttpProject } from '@api-client/core';
import enquirer from 'enquirer';

export interface IFindFolderOptions {
  /**
   * The folder name where to start.
   */
  parent?: string;
  /**
   * Whether to allow to create a new folder.
   */
  allowCreate?: boolean;
}

export class ProjectInteractions {
  /**
   * Asks the user about the project name.
   */
  static async projectName(): Promise<string> {
    const prompt = await enquirer.prompt({
      type: 'input',
      message: 'What is the name of the project?',
      name: 'name',
    }) as any;
    return prompt.name;
    // const result = await inquirer.prompt({
    //   type: 'input',
    //   name: 'name',
    //   message: 'What is the name of the project?',
    // });
    // return result.name;
  }

  /**
   * Asks the user about the folder name.
   */
  static async folderName(): Promise<string> {
    const prompt = await enquirer.prompt({
      type: 'input',
      message: 'What is the name of the folder?',
      name: 'name',
    }) as any;
    return prompt.name;
    
    // const result = await inquirer.prompt({
    //   type: 'input',
    //   name: 'name',
    //   message: 'What is the name of the folder?',
    // });
    // return result.name;
  }

  /**
   * Asks the user about the project name.
   */
  static async projectVersion(): Promise<string> {
    const prompt = await enquirer.prompt({
      type: 'input',
      message: 'What is the the project version? (optional)',
      name: 'name',
      initial: '',
    }) as any;
    return prompt.name;

    // const result = await inquirer.prompt({
    //   type: 'input',
    //   name: 'name',
    //   message: 'What is the the project version? (optional)',
    //   default: '',
    // });
    // return result.name;
  }

  /**
   * Asks the user about the folder's position on the list.
   */
  static async folderIndex(): Promise<number | undefined> {
    const prompt = await enquirer.prompt({
      type: 'number',
      message: 'What is the folder index? (optional)',
      name: 'index',
      initial: -1,
    }) as any;
    if (prompt.index === -1) {
      return undefined;
    }
    return prompt.index;

    // const result = await inquirer.prompt({
    //   type: 'number',
    //   name: 'index',
    //   message: 'What is the folder index? (optional)',
    //   default: -1,
    // });
    // if (result.index === -1) {
    //   return undefined;
    // }
    // return result.index;
  }

  /**
   * Asks the user to select a folder.
   * It also allow to create a new folder.
   */
  static async chooseFolder(project: HttpProject, opts: IFindFolderOptions = {}): Promise<string | undefined> {
    const { parent } = opts;
    const root = parent ? project.findFolder(parent) : project;
    if (!root) {
      throw new Error('The parent item is unknown.');
    }

    const projectChoice = {
      name: 'Project root',
      value: 'root',
    };
    const choices: any[] = [projectChoice];
    const parents: Record<string, any> = {};
    for (const f of project.folderIterator({ parent, recursive: true })) {
      const adjustedIndent = f.indent + 1;
      const item: any = {
        name: f.folder.info.name || 'Unnamed folder',
        value: f.folder.key,
        indent: new Array(adjustedIndent).fill(' ').join(''),
        level: adjustedIndent,
        parent: f.parent ? parents[f.parent] : projectChoice,
      };
      parents[f.folder.key] = item;
      choices.push(item);
    }
    const prompt = await enquirer.prompt({
      type: 'select',
      choices: choices,
      message: 'Select the parent folder or the project.',
      name: 'parent',
      result(name) {
        // @ts-ignore
        const item = this.find(name);
        if (!item) {
          return;
        }
        const { value } = item;
        if (value === 'root') {
          return undefined;
        }
        return value;
      }
    }) as any;
    return prompt.parent as string | undefined;
  }
}
