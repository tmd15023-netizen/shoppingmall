const Cart = require("../models/Cart");
const Product = require("../models/Product");

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
};

const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, color, size, quantity = 1 } = req.body;

    if (!productId || !color || !size) {
      return res.status(400).json({
        message: "productId, color, size는 필수입니다.",
      });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: "수량은 1 이상이어야 합니다." });
    }

    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    const cart = await getOrCreateCart(req.user.id);
    const existing = cart.items.find(
      (item) =>
        item.productId === productId &&
        item.color === color &&
        item.size === size
    );

    if (existing) {
      existing.quantity += qty;
    } else {
      cart.items.push({
        productId: product.id,
        name: product.name,
        image: product.image,
        originalPrice: product.originalPrice,
        salePrice: product.salePrice,
        color,
        size,
        quantity: qty,
      });
    }

    await cart.save();
    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: "수량은 1 이상이어야 합니다." });
    }

    const cart = await getOrCreateCart(req.user.id);
    const item = cart.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({ message: "장바구니 상품을 찾을 수 없습니다." });
    }

    item.quantity = qty;
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    const item = cart.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({ message: "장바구니 상품을 찾을 수 없습니다." });
    }

    item.deleteOne();
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    cart.items = [];
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
