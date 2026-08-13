const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");
const {
  createPaymentId,
  getApiSecret,
  verifyPortonePayment,
} = require("../services/portoneService");

const CANCELLABLE_STATUSES = ["pending", "preparing"];

const createOrderNumber = async () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const prefix = `ORD-${y}${m}${d}`;

  const count = await Order.countDocuments({
    orderNumber: new RegExp(`^${prefix}`),
  });

  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
};

const canCancelOrder = (order) => CANCELLABLE_STATUSES.includes(order.status);

async function buildOrderDraft(userId, { shippingFee = 0, discountAmount = 0 }) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0) {
    const error = new Error("장바구니가 비어 있습니다.");
    error.status = 400;
    throw error;
  }

  const items = cart.items.map((item) => {
    const quantity = item.quantity;
    const salePrice = item.salePrice;
    return {
      productId: item.productId,
      name: item.name,
      image: item.image,
      originalPrice: item.originalPrice,
      salePrice,
      color: item.color,
      size: item.size || "FREE",
      quantity,
      lineTotal: salePrice * quantity,
    };
  });

  const itemsAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const fee = Math.max(0, Number(shippingFee) || 0);
  const discount = Math.max(0, Number(discountAmount) || 0);
  const totalAmount = Math.max(0, itemsAmount + fee - discount);
  const orderName =
    items.length === 1
      ? items[0].name
      : `${items[0].name} 외 ${items.length - 1}건`;

  return { cart, items, itemsAmount, fee, discount, totalAmount, orderName };
}

async function findDuplicateOrder(merchantUid) {
  if (!merchantUid) return null;
  return Order.findOne({ "payment.merchantUid": merchantUid });
}

/**
 * 결제 전 주문 초안/결제번호 발급 + 진행 중 중복 주문 여부 확인
 */
const prepareOrder = async (req, res) => {
  try {
    const { shippingFee = 0, discountAmount = 0 } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }

    // 같은 사용자의 최근 미처리 중복 주문 방지 (60초 이내 pending)
    const recentDuplicate = await Order.findOne({
      user: user._id,
      status: { $in: ["pending", "preparing"] },
      paymentStatus: { $in: ["waiting", "paid"] },
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
    }).sort({ createdAt: -1 });

    if (recentDuplicate) {
      return res.status(409).json({
        message:
          "잠시 전에 생성된 주문이 있습니다. 주문내역을 확인한 뒤 다시 시도해 주세요.",
        orderId: recentDuplicate._id,
        orderNumber: recentDuplicate.orderNumber,
      });
    }

    const draft = await buildOrderDraft(user._id, {
      shippingFee,
      discountAmount,
    });

    const paymentId = createPaymentId();

    res.json({
      paymentId,
      orderName: draft.orderName,
      itemsAmount: draft.itemsAmount,
      shippingFee: draft.fee,
      discountAmount: draft.discount,
      totalAmount: draft.totalAmount,
      itemCount: draft.items.length,
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const {
      receiverName,
      phone,
      address,
      memo = "",
      paymentMethod = "card",
      shippingFee = 0,
      discountAmount = 0,
      impUid = "",
      merchantUid = "",
      paymentId = "",
    } = req.body;

    if (!receiverName || !phone || !address) {
      return res.status(400).json({
        message: "receiverName, phone, address는 필수입니다.",
      });
    }

    if (!Order.PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: "유효하지 않은 결제수단입니다." });
    }

    const resolvedPaymentId = String(paymentId || merchantUid || "").trim();
    if (!resolvedPaymentId) {
      return res.status(400).json({
        message: "결제번호(paymentId)가 없습니다. 결제 후 다시 시도해 주세요.",
      });
    }

    // 1) 동일 결제번호로 이미 생성된 주문인지 중복 체크
    const duplicated = await findDuplicateOrder(resolvedPaymentId);
    if (duplicated) {
      return res.status(409).json({
        message: "이미 처리된 결제입니다. 주문내역을 확인해 주세요.",
        orderId: duplicated._id,
        orderNumber: duplicated.orderNumber,
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }

    const draft = await buildOrderDraft(user._id, {
      shippingFee,
      discountAmount,
    });

    // 2) 포트원 결제 검증 (금액/상태)
    let verified = null;
    if (getApiSecret()) {
      try {
        verified = await verifyPortonePayment({
          paymentId: resolvedPaymentId,
          expectedAmount: draft.totalAmount,
          paymentMethod,
        });
      } catch (verifyError) {
        return res.status(400).json({
          message: verifyError.message || "결제 검증에 실패했습니다.",
          code: verifyError.code || "PAYMENT_VERIFY_FAILED",
        });
      }
    } else {
      console.warn(
        "[order] PORTONE_API_SECRET 미설정: 결제 API 검증을 건너뜁니다. (중복 체크만 수행)"
      );
    }

    const markPaid =
      paymentMethod === "bank"
        ? verified?.status === "PAID"
        : true;

    const orderNumber = await createOrderNumber();

    const order = await Order.create({
      orderNumber,
      user: user._id,
      status: "pending",
      paymentStatus: markPaid
        ? "paid"
        : paymentMethod === "bank"
          ? "waiting"
          : "paid",
      items: draft.items,
      itemsAmount: draft.itemsAmount,
      shippingFee: draft.fee,
      discountAmount: draft.discount,
      totalAmount: draft.totalAmount,
      shipping: {
        receiverName: receiverName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        memo: String(memo || "").trim(),
      },
      payment: {
        method: paymentMethod,
        impUid: String(impUid || verified?.txId || "").trim(),
        merchantUid: resolvedPaymentId,
        paidAt: markPaid ? new Date() : null,
      },
      customerName: user.name,
      customerEmail: user.email,
    });

    draft.cart.items = [];
    await draft.cart.save();

    res.status(201).json(order);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "이미 처리된 결제/주문입니다. 주문내역을 확인해 주세요.",
      });
    }
    res.status(500).json({ message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    }

    const isOwner = String(order.user) === String(req.user.id);
    const isAdmin = req.user.level === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "접근 권한이 없습니다." });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    if (req.user.level !== "admin") {
      return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
    }

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    if (req.user.level !== "admin") {
      return res.status(403).json({ message: "관리자만 접근할 수 있습니다." });
    }

    const { status, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    }

    if (status) {
      if (!Order.ORDER_STATUS.includes(status)) {
        return res.status(400).json({ message: "유효하지 않은 주문상태입니다." });
      }

      if (status === "cancelled" && !canCancelOrder(order)) {
        return res.status(400).json({
          message: "배송이 시작된 주문은 취소할 수 없습니다.",
        });
      }

      order.status = status;

      if (status === "cancelled" && order.paymentStatus === "paid") {
        order.paymentStatus = "refunded";
      }
    }

    if (paymentStatus) {
      if (!Order.PAYMENT_STATUS.includes(paymentStatus)) {
        return res.status(400).json({ message: "유효하지 않은 결제상태입니다." });
      }
      order.paymentStatus = paymentStatus;
      if (paymentStatus === "paid" && !order.payment.paidAt) {
        order.payment.paidAt = new Date();
      }
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    }

    const isOwner = String(order.user) === String(req.user.id);
    const isAdmin = req.user.level === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "본인 주문만 취소할 수 있습니다." });
    }

    if (!canCancelOrder(order)) {
      return res.status(400).json({
        message: "배송이 시작된 주문은 취소할 수 없습니다. (주문접수/상품준비중만 가능)",
      });
    }

    order.status = "cancelled";
    if (order.paymentStatus === "paid") {
      order.paymentStatus = "refunded";
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  prepareOrder,
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
};
