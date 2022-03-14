/* eslint-disable import/no-named-as-default-member */
import fs from 'fs/promises';
import path from 'path';

const lockFile = path.join('test', 'express.lock');

export interface SetupConfig {
  httpPort: number;
  httpsPort: number;
  singleUserPort: number;
  multiUserPort: number;
  oauthPort: number;
  singleUserBaseUri: string;
  multiUserBaseUri: string;
  singleUserWsBaseUri: string;
  multiUserWsBaseUri: string;
  prefix: string;
}


export default async function getConfig(): Promise<SetupConfig> {
  const contents = await fs.readFile(lockFile, 'utf8');
  const data: SetupConfig = JSON.parse(contents);
  return data;
}
