const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  prepareOrder,
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController");

const router = express.Router();

router.use(authMiddleware);

router.post("/prepare", prepareOrder);
router.post("/", createOrder);
router.get("/mine", getMyOrders);
router.get("/", getAllOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);
router.post("/:id/cancel", cancelOrder);

module.exports = router;
