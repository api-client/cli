import { Router } from 'express';
import getRoute from './GetApi.js';
import postRoute from './PostApi.js';
import redirectRoute from './RedirectsApi.js';
import responsesRoute from './ResponsesApi.js';
import delayRoute from './DelayRoute.js';

const router = Router();
export default router;

router.use('/get', getRoute);
router.use('/post', postRoute);
router.use('/redirect', redirectRoute);
router.use('/response', responsesRoute);
router.use('/delay', delayRoute);
