const Product = require("../models/Product");

const MAX_IMAGES = Product.MAX_IMAGES || 6;

function normalizeImages({ image, images }) {
  let list = [];

  if (Array.isArray(images)) {
    list = images.map((url) => String(url || "").trim()).filter(Boolean);
  } else if (typeof images === "string" && images.trim()) {
    list = [images.trim()];
  }

  if (!list.length && image) {
    list = [String(image).trim()];
  }

  list = [...new Set(list)].slice(0, MAX_IMAGES);

  return {
    images: list,
    image: list[0] || "",
  };
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return [
      ...new Set(value.map((item) => String(item || "").trim()).filter(Boolean)),
    ];
  }

  if (typeof value === "string" && value.trim()) {
    return [
      ...new Set(
        value
          .split(/[,|/]/)
          .map((item) => item.trim())
          .filter(Boolean)
      ),
    ];
  }

  return [];
}

function normalizeColors(colors) {
  return normalizeStringList(colors);
}

function normalizeSizes(sizes) {
  return normalizeStringList(sizes);
}

function normalizeCategories({ category, categories }) {
  let list = [];

  if (Array.isArray(categories)) {
    list = categories.map((item) => String(item || "").trim()).filter(Boolean);
  } else if (typeof categories === "string" && categories.trim()) {
    list = categories
      .split(/[,|/]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (!list.length && category) {
    list = [String(category).trim()];
  }

  list = [...new Set(list)].filter((item) => Product.CATEGORIES.includes(item));

  return {
    categories: list,
    category: list[0] || "",
  };
}

const createProduct = async (req, res) => {
  try {
    const { id, name, originalPrice, salePrice, description } = req.body;
    const { image, images } = normalizeImages(req.body);
    const colors = normalizeColors(req.body.colors);
    const sizes = normalizeSizes(req.body.sizes);
    const { category, categories } = normalizeCategories(req.body);

    if (
      !id ||
      !name ||
      originalPrice === undefined ||
      salePrice === undefined ||
      !category ||
      !image
    ) {
      return res.status(400).json({
        message:
          "id, name, originalPrice, salePrice, category(또는 categories), image(또는 images)는 필수입니다.",
      });
    }

    if (!colors.length) {
      return res.status(400).json({
        message: "색상(colors)은 1개 이상 입력해 주세요.",
      });
    }

    if (!sizes.length) {
      return res.status(400).json({
        message: "사이즈(sizes)는 1개 이상 입력해 주세요.",
      });
    }

    const product = await Product.create({
      id,
      name,
      originalPrice,
      salePrice,
      category,
      categories,
      image,
      images,
      colors,
      sizes,
      description,
    });

    res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "이미 존재하는 상품 id입니다." });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const filter = {};

    if (req.query.category) {
      filter.$or = [
        { category: req.query.category },
        { categories: req.query.category },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });

    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const allowedFields = [
      "id",
      "name",
      "originalPrice",
      "salePrice",
      "description",
    ];
    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (req.body.category !== undefined || req.body.categories !== undefined) {
      const { category, categories } = normalizeCategories(req.body);
      if (!category) {
        return res.status(400).json({
          message: "카테고리는 1개 이상 선택해 주세요.",
        });
      }
      updateData.category = category;
      updateData.categories = categories;
    }

    if (req.body.image !== undefined || req.body.images !== undefined) {
      const { image, images } = normalizeImages(req.body);
      if (!image) {
        return res.status(400).json({
          message: `이미지는 1~${MAX_IMAGES}장까지 등록할 수 있습니다.`,
        });
      }
      updateData.image = image;
      updateData.images = images;
    }

    if (req.body.colors !== undefined) {
      const colors = normalizeColors(req.body.colors);
      if (!colors.length) {
        return res.status(400).json({
          message: "색상(colors)은 1개 이상 입력해 주세요.",
        });
      }
      updateData.colors = colors;
    }

    if (req.body.sizes !== undefined) {
      const sizes = normalizeSizes(req.body.sizes);
      if (!sizes.length) {
        return res.status(400).json({
          message: "사이즈(sizes)는 1개 이상 입력해 주세요.",
        });
      }
      updateData.sizes = sizes;
    }

    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    res.json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "이미 존재하는 상품 id입니다." });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ id: req.params.id });

    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    res.json({ message: "상품이 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
