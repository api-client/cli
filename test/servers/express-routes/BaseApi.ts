/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import cors, { CorsOptions } from 'cors';
import { Request, Response, Router } from 'express';
import path from 'path';

/**
 * A base class for API routes
 */
export class BaseApi {
  constructor() {
    this._processCors = this._processCors.bind(this);
  }

  getResourcePath(name: string): string {
    return path.join('test', 'servers', 'resources', name);
  }

  /**
   * Sets CORS on all routes for `OPTIONS` HTTP method.
   * @param router Express app.
   */
  setCors(router: Router): void {
    router.options('*', cors(this._processCors));
  }

  /**
   * Shorthand function to register a route on this class.
   * @param router Express app.
   * @param routes List of routes. Each route is an array
   * where:
   * - index `0` is the API route, eg, `/api/models/:modelId`
   * - index `1` is the function name to call
   * - index `2` is optional and describes HTTP method. Defaults to 'get'.
   * It must be lowercase.
   */
  wrapApi(router: Router, routes: string[][]): void {
    for (let i = 0, len = routes.length; i < len; i++) {
      const route = routes[i];
      const method = route[2] || 'get';
      const fnName = route[1];
      // @ts-ignore
      const clb = this[fnName].bind(this);
      // @ts-ignore
      router[method](route[0], cors(this._processCors), clb);
    }
  }

  /**
   * Sends error to the client in a standardized way.
   * @param res HTTP response object
   * @param message Error message to send.
   * @param status HTTP status code, default to 400.
   */
  sendError(res: Response, message: string, status = 400): void {
    res.status(status).send({
      error: true,
      message,
    });
  }

  /**
   * Processes CORS request.
   */
  _processCors(req: Request, callback: (error: Error | null, opts: CorsOptions) => void): void {
    const whitelist = ['https://ci.advancedrestclient.com'];
    const origin = req.header('Origin');
    let corsOptions: CorsOptions;
    if (!origin) {
      corsOptions = { origin: false };
    } else if (
      origin.indexOf('http://localhost:') === 0 ||
      origin.indexOf('http://127.0.0.1:') === 0
    ) {
      corsOptions = { origin: true };
    } else if (whitelist.indexOf(origin) !== -1) {
      corsOptions = { origin: true };
    }
    // @ts-ignore
    if (corsOptions) {
      corsOptions.credentials = true;
      corsOptions.allowedHeaders = ['Content-Type', 'Authorization'];
      corsOptions.origin = origin;
    }
    // @ts-ignore
    callback(null, corsOptions);
  }

  /**
   * Awaits a timeout.
   */
  async aTimeout(timeout = 0): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), timeout);
    });
  }

  async readRequestBuffer(request: Request): Promise<Buffer> {
    return new Promise((resolve) => {
      const parts: Buffer[] = [];
      request.on('data', (chunk) => {
        if (typeof chunk === 'string') {
          parts.push(Buffer.from(chunk));
        } else {
          parts.push(chunk);
        }
      });
      request.on('end', () => {
        resolve(Buffer.concat(parts));
      });
    });
  }
}
