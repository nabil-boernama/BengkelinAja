const router = require('express').Router();
const controller = require('./customers.controller');
const { searchQuerySchema, objectIdParamSchema } = require('./customers.validation');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const { ROLES } = require('../../constants');

router.get(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MEKANIK, ROLES.OWNER),
  validate(searchQuerySchema, 'query'),
  controller.search
);

router.get(
  '/:id/orders',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.MEKANIK, ROLES.OWNER),
  validate(objectIdParamSchema, 'params'),
  controller.orders
);

module.exports = router;
