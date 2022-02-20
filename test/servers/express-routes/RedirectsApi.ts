import { Router, Request, Response } from 'express';
import cors from 'cors';
import { URLSearchParams } from 'url';
import { BaseApi } from './BaseApi.js';

const router = Router();
export default router;

class RedirectsApiRoute extends BaseApi {

  /**
   * Reads query params from the request and returns them as a string.
   */
  readQueryParams(req: Request): string {
    const { query } = req;
    const params = new URLSearchParams();
    Object.keys(query).forEach(key => {
      const value = query[key];
      params.append(key, value as string)
    });
    return params.toString();
  }

  /**
   * Redirects absolute URLs
   */
  async absolute(req: Request, res: Response): Promise<void> {
    const { params } = req;
    const size = Number(params.n) - 1;
    let next: string;
    if (Number.isNaN(size) || size === 0) {
      next = `${req.protocol}://${req.headers.host}/v1/get`;
    } else {
      next = `${req.protocol}://${req.headers.host}/v1/redirect/absolute/${size}`;
    }
    const qp = this.readQueryParams(req);
    if (qp) {
      next += `?${qp}`;
    }
    res.setHeader('location', next);
    res.setHeader('connection', 'close');
    res.status(302);
    res.send({
      location: next,
      headers: req.headers,
    });
  }

  /**
   * Redirects relative URLs
   */
  async relative(req: Request, res: Response): Promise<void> {
    const { params } = req;
    const size = Number(params.n) - 1;
    let next: string;
    if (Number.isNaN(size) || size === 0) {
      next = `/v1/get`;
    } else {
      next = `/v1/redirect/relative/${size}`;
    }
    const qp = this.readQueryParams(req);
    if (qp) {
      next += `?${qp}`;
    }
    res.setHeader('location', next);
    res.setHeader('connection', 'close');
    res.status(302);
    res.send({
      location: next,
      headers: req.headers,
    });
  }

  /**
   * Redirects relative URLs
   */
  async relativePath(req: Request, res: Response): Promise<void> {
    const { params } = req;
    const size = Number(params.n) - 1;
    let next: string;
    if (Number.isNaN(size) || size === 0) {
      next = `/v1/get`;
    } else {
      next = `../relative/${size}`;
    }
    const qp = this.readQueryParams(req);
    if (qp) {
      next += `?${qp}`;
    }
    res.setHeader('location', next);
    res.setHeader('connection', 'close');
    res.status(302);
    res.send({
      location: next,
      headers: req.headers,
    });
  }
}
const api = new RedirectsApiRoute();
api.setCors(router);
const checkCorsFn = api._processCors;
router.get('/absolute/:n', cors(checkCorsFn), api.absolute.bind(api));
router.get('/relative/:n', cors(checkCorsFn), api.relativePath.bind(api));
router.get('/relative-root/:n', cors(checkCorsFn), api.relative.bind(api));
