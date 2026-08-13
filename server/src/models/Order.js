const mongoose = require("mongoose");

const ORDER_STATUS = [
  "pending",
  "preparing",
  "shipping",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUS = ["waiting", "paid", "refunded"];
const PAYMENT_METHODS = ["card", "bank", "npay", "payco", "mobile", "escrow"];

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    originalPrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, required: true, min: 0 },
    color: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ORDER_STATUS,
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS,
      default: "waiting",
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "주문 상품이 필요합니다.",
      },
    },
    itemsAmount: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    shipping: {
      receiverName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      memo: { type: String, trim: true, default: "" },
    },
    payment: {
      method: {
        type: String,
        enum: PAYMENT_METHODS,
        required: true,
      },
      impUid: {
        type: String,
        trim: true,
        default: "",
      },
      merchantUid: {
        type: String,
        trim: true,
        default: "",
      },
      paidAt: {
        type: Date,
        default: null,
      },
    },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  }
);

orderSchema.statics.ORDER_STATUS = ORDER_STATUS;
orderSchema.statics.PAYMENT_STATUS = PAYMENT_STATUS;
orderSchema.statics.PAYMENT_METHODS = PAYMENT_METHODS;

// 동일 결제번호로 주문이 두 번 생성되지 않도록 방지
orderSchema.index(
  { "payment.merchantUid": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "payment.merchantUid": { $type: "string", $gt: "" },
    },
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
