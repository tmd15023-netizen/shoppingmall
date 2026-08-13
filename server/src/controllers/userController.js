const User = require("../models/User");

const createUser = async (req, res) => {
  try {
    const { email, name, password, level, address, phone } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({
        message: "email, name, password는 필수입니다.",
      });
    }

    const user = await User.create({
      email,
      name,
      password,
      level,
      address,
      phone,
    });

    const userData = user.toObject();
    delete userData.password;

    res.status(201).json(userData);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "이미 존재하는 이메일입니다." });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }

    res.json(user);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "유효하지 않은 유저 ID입니다." });
    }
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const allowedFields = ["email", "name", "password", "level", "address", "phone"];
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    }

    await user.save();

    const userData = user.toObject();
    delete userData.password;

    res.json(userData);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "이미 존재하는 이메일입니다." });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ message: "유효하지 않은 유저 ID입니다." });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }

    res.json({ message: "유저가 삭제되었습니다." });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "유효하지 않은 유저 ID입니다." });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
