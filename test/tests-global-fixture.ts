/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-named-as-default-member */

import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { DummyLogger, getPort } from '@api-client/core';
import { Server, IServerConfiguration } from '@api-client/net-store';
import { OAuth2Server, MutableResponse } from 'oauth2-mock-server';
import { DataMock } from '@pawel-up/data-mock';
import { ExpressServer } from './servers/ExpressServer.js';
import { SetupConfig } from './helpers/getSetup.js';
import { TestsHttpRoute } from './helpers/TestsHttpRoute.js';
import { TestStore } from './helpers/TestStore.js';

const playgroundPath = join('test', 'playground');
const lockFile = join('test', 'express.lock');
const server = new ExpressServer();
const logger = new DummyLogger();
const noAuthStore = new TestStore(logger, join(playgroundPath, 'no-auth'));
const oidcAuthStore = new TestStore(logger, 'test/data/oidc-auth');
let noAuthServer: Server;
let oidcAuthServer: Server;
const oauthServer = new OAuth2Server(
  join('test', 'certs', 'server_key.key'),
  join('test', 'certs', 'server_cert.crt')
);

const mock = new DataMock();

function beforeUserinfo(userInfoResponse: MutableResponse): void {
  const fName = mock.person.firstName();
  const sName = mock.person.lastName();
  const picture = mock.internet.avatar();
  const email = mock.internet.email();
  userInfoResponse.body = {
    sub: mock.types.uuid(),
    given_name: fName,
    family_name: sName,
    name: `${fName} ${sName}`,
    picture,
    email,
    email_verified: mock.types.boolean(),
    locale: mock.random.pickOne(['pl', 'en', 'pt', 'de', 'ja']),
  };
}
oauthServer.service.on('beforeUserinfo', beforeUserinfo);

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
  const multiUserPort = await getPort();
  const oauthPort = await getPort();
  const singleUserBaseUri = `http://localhost:${singleUserPort}${prefix}`;
  const multiUserBaseUri = `http://localhost:${multiUserPort}${prefix}`;
  const singleUserWsBaseUri = `ws://localhost:${singleUserPort}${prefix}`;
  const multiUserWsBaseUri = `ws://localhost:${multiUserPort}${prefix}`;
  
  // OpenId server
  await oauthServer.issuer.keys.generate('RS256');
  await oauthServer.start(oauthPort);

  const singleUserConfig: IServerConfiguration = {
    router: { prefix },
    session: {
      secret: 'EOX0Xu6aSb',
    },
    logger,
  };
  const multiUserConfig: IServerConfiguration = {
    router: { prefix },
    session: {
      secret: 'EOX0Xu6aSb',
    },
    mode: 'multi-user',
    authentication: {
      type: 'oidc',
      config: {
        issuerUri: oauthServer.issuer.url as string,
        clientId: 'abcd',
        clientSecret: 'abcdefg',
        redirectBaseUri: multiUserBaseUri,
        ignoreCertErrors: true,
      }
    },
    logger,
  };

  noAuthServer = new Server(noAuthStore, singleUserConfig);
  oidcAuthServer = new Server(oidcAuthStore, multiUserConfig);

  // stores
  await noAuthStore.initialize();
  await oidcAuthStore.initialize();
  
  // No auth test server
  await noAuthServer.initialize(TestsHttpRoute);
  await noAuthServer.startHttp(singleUserPort);
  // OpenID Connect test server
  await oidcAuthServer.initialize(TestsHttpRoute);
  await oidcAuthServer.startHttp(multiUserPort);

  await server.start();
  const info: SetupConfig = {
    singleUserBaseUri,
    multiUserBaseUri,
    singleUserPort,
    multiUserPort,
    oauthPort,
    prefix,
    singleUserWsBaseUri,
    multiUserWsBaseUri,
    httpPort: server.httpPort as number,
    httpsPort: server.httpsPort as number,
  };
  await writeFile(lockFile, JSON.stringify(info));
};

export const mochaGlobalTeardown = async () => {
  await oauthServer.stop();
  await noAuthServer.stopHttp();
  await noAuthServer.cleanup();
  await oidcAuthServer.stopHttp();
  await oidcAuthServer.cleanup();
  await noAuthStore.cleanup();
  await oidcAuthStore.cleanup();
  await server.stop();
  await rm(lockFile, { force: true });
  await deletePlayground();
};
