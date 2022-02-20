import { Router, Request, Response } from 'express';
import cors from 'cors';
import { BaseApi } from './BaseApi.js';

const router = Router();
export default router;

/**
 * Some tests API route
 */
class DelayRoute extends BaseApi {
  /**
   * List tests
   */
  async delay(req: Request, res: Response): Promise<void> {
    const { params } = req;
    let duration = Number(params.ms);
    if (Number.isNaN(duration)) {
      duration = 10;
    }
    await this.aTimeout(duration);
    res.send({ body: `Delayed for ${duration}ms.` });
  }
}
const api = new DelayRoute();
api.setCors(router);
const checkCorsFn = api._processCors;
router.get('/:ms', cors(checkCorsFn), api.delay.bind(api));
