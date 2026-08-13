const mongoose = require("mongoose");

const CATEGORIES = [
  "MADE",
  "신상",
  "BEST",
  "인기상품 재입고",
  "린넨",
  "니트",
  "OUTER",
  "TOPS",
  "BOTTOMS",
  "DRESS",
  "BAGS",
  "ACC.",
  // 기존 등록 상품 호환
  "아우터",
  "상의",
  "하의",
  "악세사리",
];
const MAX_PRODUCT_IMAGES = 6;

const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    // 대표 카테고리 (categories[0]과 동기화)
    category: {
      type: String,
      required: true,
      enum: CATEGORIES,
    },
    categories: {
      type: [String],
      default: undefined,
      validate: {
        validator(value) {
          if (!Array.isArray(value) || value.length < 1) return false;
          return value.every((item) => CATEGORIES.includes(item));
        },
        message: "카테고리는 1개 이상 선택해야 합니다.",
      },
    },
    // 대표 이미지 (목록/장바구니용) — images[0]과 동기화
    image: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: undefined,
      validate: {
        validator(value) {
          if (!Array.isArray(value)) return false;
          if (value.length < 1 || value.length > MAX_PRODUCT_IMAGES) return false;
          return value.every(
            (url) => typeof url === "string" && url.trim().length > 0
          );
        },
        message: `이미지는 1~${MAX_PRODUCT_IMAGES}장까지 등록할 수 있습니다.`,
      },
    },
    colors: {
      type: [String],
      default: [],
      validate: {
        validator(value) {
          if (!Array.isArray(value)) return false;
          return value.every(
            (color) => typeof color === "string" && color.trim().length > 0
          );
        },
        message: "색상은 문자열 배열이어야 합니다.",
      },
    },
    sizes: {
      type: [String],
      default: [],
      validate: {
        validator(value) {
          if (!Array.isArray(value)) return false;
          return value.every(
            (size) => typeof size === "string" && size.trim().length > 0
          );
        },
        message: "사이즈는 문자열 배열이어야 합니다.",
      },
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    id: false,
    collection: "product",
  }
);

productSchema.pre("validate", function syncImagesAndCategories() {
  let list = Array.isArray(this.images)
    ? this.images.map((url) => String(url).trim()).filter(Boolean)
    : [];

  if (!list.length && this.image) {
    list = [String(this.image).trim()];
  }

  list = [...new Set(list)].slice(0, MAX_PRODUCT_IMAGES);
  this.images = list;

  if (list.length) {
    this.image = list[0];
  }

  if (Array.isArray(this.colors)) {
    this.colors = [
      ...new Set(this.colors.map((color) => String(color).trim()).filter(Boolean)),
    ];
  }

  if (Array.isArray(this.sizes)) {
    this.sizes = [
      ...new Set(this.sizes.map((size) => String(size).trim()).filter(Boolean)),
    ];
  }

  let categories = Array.isArray(this.categories)
    ? this.categories.map((item) => String(item).trim()).filter(Boolean)
    : [];

  if (!categories.length && this.category) {
    categories = [String(this.category).trim()];
  }

  categories = [...new Set(categories)].filter((item) => CATEGORIES.includes(item));
  this.categories = categories;

  if (categories.length) {
    this.category = categories[0];
  }
});

const Product = mongoose.model("Product", productSchema);
Product.CATEGORIES = CATEGORIES;
Product.MAX_IMAGES = MAX_PRODUCT_IMAGES;

module.exports = Product;
