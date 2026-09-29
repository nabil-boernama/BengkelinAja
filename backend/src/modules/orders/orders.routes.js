const router = require('express').Router();
const controller = require('./orders.controller');
const {
  createOrderSchema,
  listOrdersQuerySchema,
  orderIdParamSchema,
  updateStatusSchema,
  recordServiceSchema,
} = require('./orders.validation');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const { ROLES } = require('../../constants');

router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(createOrderSchema),
  controller.create
);

router.get(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MEKANIK, ROLES.OWNER),
  validate(listOrdersQuerySchema, 'query'),
  controller.list
);

router.get(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MEKANIK, ROLES.OWNER),
  validate(orderIdParamSchema, 'params'),
  controller.detail
);

router.patch(
  '/:id/status',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MEKANIK),
  validate(orderIdParamSchema, 'params'),
  validate(updateStatusSchema),
  controller.updateStatus
);

router.put(
  '/:id/service',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(orderIdParamSchema, 'params'),
  validate(recordServiceSchema),
  controller.recordService
);

module.exports = router;
