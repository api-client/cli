import express, { Express } from 'express';
import http from 'http';
import https from 'https';
import path from 'path';
import net from 'net';
import { Duplex } from 'stream';
import { readFile } from 'fs/promises';
import { getPort, portNumbers } from '@api-client/core';
import apiRouter from './express-routes/index.js';

export class ExpressServer {
  httpServer?: http.Server;
  httpsServer?: https.Server;
  httpSockets: net.Socket[] = [];
  httpsSockets: Duplex[] = [];
  httpPort?: number;
  httpsPort?: number;
  app: Express;

  constructor() {
    const app = express();
    this.app = app;
    app.disable('etag');
    app.disable('x-powered-by');
    app.set('trust proxy', true);
    this.setupRoutes();
  }

  setupRoutes(): void {
    const { app } = this;
    app.use('/v1', apiRouter);
    app.get('/_ah/health', (req, res) => {
      res.status(200).send('ok');
    });
    // Basic 404 handler
    app.use((req, res) => {
      res.status(404).send('Not Found');
    });
  }

  async start(): Promise<void> {
    await this.startHttp();
    await this.startHttps();
  }

  async stop(): Promise<void> {
    await this.stopHttp();
    await this.stopHttps();
  }

  /**
   * @param port Optional port number to open. If not set a random port is selected.
   * @return The opened port number.
   */
  async startHttp(port?: number): Promise<number> {
    const assignedPort = port || await getPort({port: portNumbers(8000, 8100)});
    this.httpPort = assignedPort;
    return new Promise((resolve) => {
      this.httpServer = http.createServer(this.app);
      this.httpServer.listen(assignedPort, () => resolve(assignedPort));
      this.httpServer.on('connection', (socket) => {
        this.httpSockets.push(socket);
        socket.on('close', () => {
          const index = this.httpSockets.indexOf(socket);
          this.httpSockets.splice(index, 1);
        });
      });
    });
  }
  
  /**
   * @param {number=} port Optional port number to open. If not set a random port is selected.
   * @return {Promise<number>} The opened port number.
   */
  async startHttps(port?: number): Promise<number> {
    const assignedPort = port || await getPort({port: portNumbers(8000, 8100)});
    this.httpsPort = assignedPort;
    const key = await readFile(path.join('test', 'servers', 'certs', 'privkey.pem'));
    const cert = await readFile(path.join('test', 'servers', 'certs', 'fullchain.pem'));
    const options: https.ServerOptions = {
      key,
      cert,
    };
    return new Promise((resolve) => {
      this.httpsServer = https.createServer(options, this.app);
      this.httpsServer.listen(assignedPort, () => resolve(assignedPort));
      this.httpsServer.on('connection', (socket) => {
        this.httpsSockets.push(socket);
        socket.on('close', () => {
          const index = this.httpsSockets.indexOf(socket);
          this.httpsSockets.splice(index, 1);
        });
      });
    });
  }

  async stopHttp(): Promise<void> {
    return new Promise((resolve) => {
      const { httpSockets, httpServer } = this;
      if (httpSockets.length) {
        // console.warn(`There are ${httpSockets.length} connections when closing the server`);
        httpSockets.forEach((s) => s.destroy());
      }
      if (httpServer) {
        httpServer.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  async stopHttps(): Promise<void> {
    return new Promise((resolve) => {
      const { httpsSockets, httpsServer } = this;
      if (httpsSockets.length) {
        // console.warn(`There are ${httpsSockets.length} connections when closing the server`);
        httpsSockets.forEach((s) => s.destroy());
      }
      if (httpsServer) {
        httpsServer.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
