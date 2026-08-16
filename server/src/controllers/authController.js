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

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }

    const { name, phone, address, currentPassword, newPassword } = req.body;

    if (name !== undefined) {
      const nextName = String(name).trim();
      if (!nextName) {
        return res.status(400).json({ message: "이름은 비워둘 수 없습니다." });
      }
      user.name = nextName;
    }

    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }

    if (address !== undefined) {
      user.address = String(address).trim();
    }

    const wantsPasswordChange =
      newPassword !== undefined && String(newPassword).length > 0;

    if (wantsPasswordChange) {
      if (!currentPassword) {
        return res.status(400).json({
          message: "비밀번호를 변경하려면 현재 비밀번호를 입력해 주세요.",
        });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          message: "현재 비밀번호가 올바르지 않습니다.",
        });
      }

      if (!PASSWORD_RULE.test(String(newPassword))) {
        return res.status(400).json({
          message:
            "새 비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.",
        });
      }

      user.password = String(newPassword);
    }

    await user.save();

    const userData = user.toObject();
    delete userData.password;

    res.json({
      message: wantsPasswordChange
        ? "회원정보와 비밀번호가 수정되었습니다."
        : "회원정보가 수정되었습니다.",
      user: userData,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  login,
  getMe,
  updateMe,
};
