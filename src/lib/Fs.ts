import { writeFile, mkdir, rm, readdir, stat, access, readFile, copyFile as fsCopyFile } from 'fs/promises';
import { constants } from 'fs';
import { join, dirname } from 'path';

export interface JsonReadOptions {
  /**
   * Whether it should throw an error when a reading error occurs.
   */
  throws?: boolean;
}

// function statPromise(filePath: string): Promise<fsSync.Stats> {
//   return new Promise((resolve, reject) => {
//     fsSync.stat(filePath, (err, stats) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(stats);
//       }
//     });
//   });
// }

/**
 * Checks whether a file exists in the location.
 */
export async function pathExists(filePath: string): Promise<boolean> {
  // return new Promise((resolve) => {
  //   fsSync.stat(filePath, (err, stats) => {
  //     if (err) {
  //       resolve(false);
  //     } else {
  //       resolve(true);
  //     }
  //   });
  // });
  try {
    await stat(filePath);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Tests a user's permissions for the file or directory specified by filePath.
 * @param filePath The path to test
 * @returns True when the path can be read by the current user.  
 */
export async function canRead(filePath: string): Promise<boolean> {
  const exists = await pathExists(filePath);
  if (!exists) {
    return false;
  }
  
  // return new Promise((resolve) => {
  //   fsSync.access(filePath, constants.R_OK, (err) => {
  //     if (err) {
  //       resolve(false);
  //     } else {
  //       resolve(true);
  //     }
  //   });
  // });
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Tests a user's permissions for the file or directory specified by filePath.
 * @param filePath The path to test
 * @returns True when the path can be written to by the current user.  
 */
export async function canWrite(filePath: string): Promise<boolean> {
  const exists = await pathExists(filePath);
  if (!exists) {
    return false;
  }
  // return new Promise((resolve) => {
  //   fsSync.access(filePath, constants.W_OK, (err) => {
  //     if (err) {
  //       resolve(false);
  //     } else {
  //       resolve(true);
  //     }
  //   });
  // });
  try {
    await access(filePath, constants.W_OK);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Reads the contents of a JSON file.
 * 
 * @param filePath The path to the JSON file to read.
 * @returns The contents of the file. When `throws` options is not set and error occurs then it returns an empty file.
 */
export async function readJson(filePath: string, opts: JsonReadOptions={}): Promise<unknown> {
  const readable = await canRead(filePath);
  if (!readable) {
    if (opts.throws) {
      throw new Error(`Unable to read file: ${filePath}. Access is denied.`);
    }
    return {};
  }
  // return new Promise((resolve, reject) => {
  //   fsSync.readFile(filePath, 'utf8', (err, contents) => {
  //     if (err) {
  //       reject(err);
  //     } else {
  //       let data = {};
  //       try {
  //         data = JSON.parse(contents);
  //       } catch (e) {
  //         if (opts.throws) {
  //           const err = new Error(`Invalid JSON contents for file: ${filePath}.`);
  //           reject(err);
  //           return;
  //         }
  //       }
  //       resolve(data);
  //     }
  //   });
  // });
  const contents = await readFile(filePath, 'utf8');
  let data = {};
  try {
    data = JSON.parse(contents);
  } catch (e) {
    if (opts.throws) {
      throw new Error(`Invalid JSON contents for file: ${filePath}.`);
    }
  }
  return data;
}

/**
 * Writes the contents to the file.
 * 
 * @param filePath The file to write to. It replaces the contents.
 * @param contents The contents to write.
 */
export async function writeJson(filePath: string, contents: string|any): Promise<void> {
  const destParent = dirname(filePath);
  const parentWritable = await canWrite(destParent);
  if (!parentWritable) {
    throw new Error(`Unable to write to location: ${parentWritable}. Access is denied.`);
  }
  const data = typeof contents === 'string' ? contents : JSON.stringify(contents);
  await writeFile(filePath, data);
}

/**
 * Ensures the directory exists.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  const readable = await canRead(dirPath);
  if (readable) {
    return;
  }
  await mkdir(dirPath, { recursive: true });
}

/**
 * Removes contents of the directory, leaving the directory in the filesystem.
 */
export async function emptyDir(dirPath: string): Promise<void> {
  const exists = await pathExists(dirPath);
  if (!exists) {
    return;
  }
  const writeable = await canWrite(dirPath);
  if (!writeable) {
    throw new Error(`Unable to clear directory: ${dirPath}. Access is denied.`);
  }
  const items = await readdir(dirPath, 'utf8');
  for (const item of items) {
    const file = join(dirPath, item);
    await rm(file, { recursive: true });
  }
}

/**
 * Copies a file
 */
async function copyFile(source: string, dest: string): Promise<void> {
  const destParent = dirname(dest);
  await ensureDir(destParent);
  await fsCopyFile(source, dest);
}

// /**
//  * Copies a file
//  * @param {string} source 
//  * @param {string} dest 
//  * @returns {Promise<void>}
//  */
// async function copyFile(source, dest) {
//   const destParent = dirname(dest);
//   await ensureDir(destParent);
//   return new Promise((resolve, reject) => {
//     fsSync.copyFile(source, dest, (err) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve();
//       }
//     });
//   });
// }

/**
 * Copies a directory and its contents.
 */
async function copyDirectory(source: string, dest: string): Promise<void> {
  await ensureDir(dest);
  // const entries = fsSync.readdirSync(source, { withFileTypes: true, encoding: 'utf8' });
  const entries = await readdir(source, { withFileTypes: true, encoding: 'utf8' });
  for (const entry of entries) {
    const srcFile = join(source, entry.name);
    const destFile = join(dest, entry.name);
    const srcStat = await stat(srcFile);
    if (srcStat.isDirectory()) {
      await copyDirectory(srcFile, destFile);
    } else {
      await copyFile(srcFile, destFile);
    }
  }
}

/**
 * Copies a file or a directory to the destination location.
 * It creates the destination folder when missing.
 * 
 * @param source The source file or folder.
 * @param dest The destination file or folder.
 */
export async function copy(source: string, dest: string): Promise<void> {
  const existing = await pathExists(source);
  if (!existing) {
    throw new Error(`Specified path does not exist: ${source}`);
  }
  const srcStat = await stat(source);
  if (srcStat.isDirectory()) {
    await copyDirectory(source, dest);
  } else {
    await copyFile(source, dest);
  }
}
