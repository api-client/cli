import { IApplication } from '@api-client/core';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pkgFile = join(__dirname, '..', '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
const { version } = pkg;

const info: IApplication = {
  name: 'cli',
  code: 'aelT9J5W8G',
  version,
};

export default Object.freeze(info);
