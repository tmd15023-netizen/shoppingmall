const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "인증 토큰이 필요합니다." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "토큰이 만료되었습니다. 다시 로그인해 주세요.",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      message: "유효하지 않은 토큰입니다.",
      code: "TOKEN_INVALID",
    });
  }
};

module.exports = authMiddleware;
