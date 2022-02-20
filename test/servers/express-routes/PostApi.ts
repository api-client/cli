import { Router, Request, Response } from 'express';
import cors from 'cors';
import { BaseApi } from './BaseApi.js';

const router = Router();
export default router;

class PostApiRoute extends BaseApi {
  async echoProperties(req: Request, res: Response): Promise<void> {
    const { headers, query } = req;
    const body = await this.readRequestBuffer(req);
    res.send({ headers, query, body: body.toString('utf8') });
  }
}
const api = new PostApiRoute();
api.setCors(router);
const checkCorsFn = api._processCors;
router.post('/', cors(checkCorsFn), api.echoProperties.bind(api));
