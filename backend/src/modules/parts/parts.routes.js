const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth');
const controller = require('./parts.controller');
const validate = require('../../middleware/validate');
const { createPartSchema, updatePartSchema, objectIdParamSchema } = require('./parts.validation');

router.get('/', authenticate, authorize('Admin', 'Owner'), controller.list);
router.post('/', authenticate, authorize('Admin'), validate(createPartSchema), controller.create);
router.patch('/:id', authenticate, authorize('Admin'), validate(objectIdParamSchema, 'params'), validate(updatePartSchema), controller.update);

module.exports = router;
