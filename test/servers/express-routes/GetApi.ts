import { Router, Request, Response } from 'express';
import cors from 'cors';
import { BaseApi } from './BaseApi.js';

const router = Router();
export default router;

class GetApiRoute extends BaseApi {
  async echoGet(req: Request, res: Response): Promise<void> {
    const { headers, query, originalUrl, baseUrl, cookies, hostname, method, params, path, ip, protocol, url } = req;
    const start = Date.now();
    await this.aTimeout(120);
    res.send({
      headers,
      query,
      originalUrl,
      baseUrl,
      cookies,
      hostname,
      method,
      params,
      path,
      ip,
      protocol,
      url,
      delay: Date.now() - start,
    });
  }

  async echoPost(req: Request, res: Response): Promise<void> {
    req.setEncoding('utf8');
    const { headers, query, originalUrl, baseUrl, cookies, hostname, method, params, path, ip, protocol, url } = req;
    const data = await this.readRequestBuffer(req);
    const start = Date.now();
    await this.aTimeout(120);
    res.send({
      headers,
      query,
      originalUrl,
      baseUrl,
      cookies,
      hostname,
      method,
      params,
      path,
      ip,
      protocol,
      url,
      delay: Date.now() - start,
      body: data.toString('utf8'),
    });
  }
}
const api = new GetApiRoute();
api.setCors(router);
const checkCorsFn = api._processCors;
router.get('/', cors(checkCorsFn), api.echoGet.bind(api));
router.post('/', cors(checkCorsFn), api.echoPost.bind(api));
