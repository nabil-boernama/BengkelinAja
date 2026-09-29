const router = require("express").Router();

router.use("/auth", require("../modules/auth/auth.routes"));
router.use("/customers", require("../modules/customers/customers.routes"));
router.use("/mechanics", require("../modules/orders/mechanics.routes"));
router.use("/orders", require("../modules/orders/orders.routes"));
router.use("/orders", require("../modules/orders/notify.routes"));
router.use("/orders", require("../modules/receipts/receipts.routes"));
router.use("/parts", require("../modules/parts/parts.routes"));
router.use("/reports", require("../modules/reports/reports.routes"));
router.use("/track", require("../modules/tracking/tracking.routes"));

module.exports = router;
