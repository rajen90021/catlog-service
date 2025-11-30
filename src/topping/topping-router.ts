import express from 'express';
import fileUpload from 'express-fileupload';
import { asyncWrapper } from '../common/utils/wrapper';
import authenticate from '../common/middlewares/authenticate';
import { canAccess } from '../common/middlewares/canAccess';
import { Roles } from '../common/constants';

import createHttpError from 'http-errors';
import createToppingValidator from './create-topping-validator';
import { ToppingService } from './topping-service';
import { ToppingController } from './topping-controller';
import { CloudinaryStorage } from '../common/services/cloudnary';
import { createMessageProducerBroker } from '../common/factories/brokerFactory';

const router = express.Router();

const toppingService = new ToppingService();
const cloudinaryStorage = new CloudinaryStorage();
const broker = createMessageProducerBroker();

const toppingController = new ToppingController(cloudinaryStorage, toppingService, broker);

router.post(
  '/',
  authenticate,
  canAccess([Roles.ADMIN, Roles.MANAGER]),
  fileUpload({
    limits: { fileSize: 500 * 1024 }, // 500kb
    abortOnLimit: true,
    limitHandler: (req, res, next) => {
      const error = createHttpError(400, 'File size exceeds the limit');
      next(error);
    },
  }),
  createToppingValidator,
  asyncWrapper(toppingController.create)
);

router.get('/', asyncWrapper(toppingController.get));

export default router;
