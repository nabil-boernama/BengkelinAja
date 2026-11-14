const router = require('express').Router();
const controller = require('./orders.controller');
const {
  createOrderSchema,
  listOrdersQuerySchema,
  orderIdParamSchema,
  updateStatusSchema,
  recordServiceSchema,
  updateOrderSchema,
  cancelOrderSchema,
  revertOrderSchema,
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

// Ubah detail order (plat, keluhan, mekanik): Admin saja
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(orderIdParamSchema, 'params'),
  validate(updateOrderSchema),
  controller.updateDetails
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

// Batalkan order (Antre atau Diperiksa): Admin saja
router.post(
  '/:id/cancel',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(orderIdParamSchema, 'params'),
  validate(cancelOrderSchema),
  controller.cancel
);

// Kembalikan order Selesai ke Dikerjakan: Admin saja
router.post(
  '/:id/revert',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(orderIdParamSchema, 'params'),
  validate(revertOrderSchema),
  controller.revert
);

module.exports = router;