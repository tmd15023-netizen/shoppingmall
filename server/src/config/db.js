const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error(
      "MONGODB_URI 환경변수가 없습니다. server/.env 에 MONGODB_URI를 설정해 주세요."
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("연결성공!");
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
