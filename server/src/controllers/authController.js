const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email과 password는 필수입니다.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    const token = generateToken(user);

    res.json({
      message: "로그인 성공",
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        level: user.level,
        address: user.address,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  login,
  getMe,
};
