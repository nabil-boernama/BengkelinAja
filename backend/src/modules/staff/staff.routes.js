const router = require('express').Router();
const controller = require('./staff.controller');
const { objectIdParamSchema, createStaffSchema, updateStaffSchema } = require('./staff.validation');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const { ROLES } = require('../../constants');

// Manajemen akun staf: Owner saja
router.use(authenticate, authorize(ROLES.OWNER));

router.get('/', controller.list);

router.post('/', validate(createStaffSchema), controller.create);

router.put(
  '/:id',
  validate(objectIdParamSchema, 'params'),
  validate(updateStaffSchema),
  controller.update
);

router.patch(
  '/:id/toggle-aktif',
  validate(objectIdParamSchema, 'params'),
  controller.toggleAktif
);

module.exports = router;
