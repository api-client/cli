/* eslint-disable import/no-named-as-default-member */
import fs from 'fs/promises';
import path from 'path';
import { SetupConfig } from './interfaces.js';

const lockFile = path.join('test', 'express.lock');

export default async function getConfig(): Promise<SetupConfig> {
  const contents = await fs.readFile(lockFile, 'utf8');
  const data: SetupConfig = JSON.parse(contents);
  return data;
}
