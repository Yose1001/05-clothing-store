const Product = require('../models/Product');

// GET /api/products?search=&category=&sort=&page=
// รองรับค้นหา กรองหมวดหมู่ เรียงราคา และแบ่งหน้า
exports.getProducts = async (req, res) => {
  try {
    const { search, category, sort, page = 1 } = req.query;
    const limit = 12;

    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }

    const sortOption =
      sort === 'price_asc'
        ? { price: 1 }
        : sort === 'price_desc'
          ? { price: -1 }
          : { createdAt: -1 }; // ค่าเริ่มต้น: สินค้าใหม่ก่อน

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'ไม่พบสินค้านี้' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/products — (admin) เพิ่มสินค้า
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, sizes, stock, imageUrl } = req.body;
    if (!name || price == null || !category) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อ ราคา และหมวดหมู่' });
    }
    const product = await Product.create({
      name,
      description,
      price,
      category,
      sizes,
      stock,
      imageUrl,
    });
    res.status(201).json({ message: 'เพิ่มสินค้าสำเร็จ', product });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/products/:id — (admin) แก้ไขสินค้า
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ message: 'ไม่พบสินค้านี้' });
    }
    res.json({ message: 'แก้ไขสินค้าสำเร็จ', product });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/products/:id — (admin) ลบสินค้า
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'ไม่พบสินค้านี้' });
    }
    res.json({ message: 'ลบสินค้าแล้ว' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
