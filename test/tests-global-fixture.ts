/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-named-as-default-member */

import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { DummyLogger, getPort } from '@api-client/core';
import { Server, IServerConfiguration } from '@api-client/net-store';
import { ExpressServer } from './servers/ExpressServer.js';
import { SetupConfig } from './helpers/interfaces.js';
import { TestsHttpRoute } from './helpers/TestsHttpRoute.js';
import { TestStore } from './helpers/TestStore.js';

const playgroundPath = join('test', 'playground');
const lockFile = join('test', 'express.lock');
const server = new ExpressServer();
const logger = new DummyLogger();
const noAuthStore = new TestStore(logger, join(playgroundPath, 'no-auth'));
let noAuthServer: Server;

async function createPlayground(): Promise<void> {
  await mkdir(playgroundPath, { recursive: true });
}

async function deletePlayground(): Promise<void> {
  await rm(playgroundPath, { recursive: true, force: true });
}

export const mochaGlobalSetup = async () => {
  await createPlayground();
  
  const prefix = '/v1';
  const singleUserPort = await getPort();
  const singleUserBaseUri = `http://localhost:${singleUserPort}${prefix}`;
  const singleUserConfig: IServerConfiguration = {
    router: { prefix },
    session: {
      secret: 'EOX0Xu6aSb',
    },
    logger,
  };

  noAuthServer = new Server(noAuthStore, singleUserConfig);
  await noAuthStore.initialize();
  await noAuthServer.initialize(TestsHttpRoute);
  await noAuthServer.startHttp(singleUserPort);

  await server.start();
  const info: SetupConfig = {
    singleUserBaseUri,
    singleUserPort,
    prefix,
    httpPort: server.httpPort as number,
    httpsPort: server.httpsPort as number,
  };
  await writeFile(lockFile, JSON.stringify(info));
};

export const mochaGlobalTeardown = async () => {
  await noAuthServer.stopHttp();
  await noAuthServer.cleanup();
  await noAuthStore.cleanup();

  await server.stop();
  await rm(lockFile, { force: true });
  await deletePlayground();
};
