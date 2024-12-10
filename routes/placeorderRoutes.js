const express = require("express");
const router = express.Router();
const placeorderController = require("../controllers/placeorderController");
const Order = require("../models/Order");

router.post("/place-order", placeorderController.placeOrder);
router.post("/placeorder", placeorderController.placeOrder2);

module.exports = router;