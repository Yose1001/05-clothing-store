const Order = require('../models/Order');
const Product = require('../models/Product');

// ลำดับสถานะที่อนุญาตให้เปลี่ยนได้ (state machine อย่างง่าย)
const ALLOWED_TRANSITIONS = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
};

// POST /api/orders — สร้างออเดอร์ + ตัดสต็อกแบบ atomic (กันสั่งเกินสต็อก)
exports.createOrder = async (req, res) => {
  const decremented = []; // เก็บรายการที่ตัดสต็อกไปแล้ว เผื่อต้อง rollback

  try {
    const { items, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'ตะกร้าสินค้าว่างเปล่า' });
    }
    const { name, phone, address } = shippingAddress || {};
    if (!name || !phone || !address) {
      return res.status(400).json({ message: 'กรุณากรอกที่อยู่จัดส่งให้ครบถ้วน' });
    }

    const orderItems = [];

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw Object.assign(new Error('จำนวนสินค้าไม่ถูกต้อง'), { status: 400 });
      }

      // จุดสำคัญ: findOneAndUpdate เงื่อนไข stock >= quantity เป็น atomic operation
      // ถ้าสองคนกดซื้อชิ้นสุดท้ายพร้อมกัน จะมีแค่คนเดียวที่ตัดสต็อกสำเร็จ
      const product = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );

      if (!product) {
        const p = await Product.findById(item.productId);
        const reason = p
          ? `สินค้า "${p.name}" มีไม่พอ (เหลือ ${p.stock} ชิ้น)`
          : 'ไม่พบสินค้าในระบบ';
        throw Object.assign(new Error(reason), { status: 409 });
      }

      decremented.push({ id: product._id, quantity });

      if (!product.sizes.includes(item.size)) {
        throw Object.assign(
          new Error(`สินค้า "${product.name}" ไม่มีไซซ์ ${item.size}`),
          { status: 400 }
        );
      }

      // ใช้ราคาจากฐานข้อมูลเสมอ — ไม่เชื่อราคาที่ client ส่งมา
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        size: item.size,
        quantity,
      });
    }

    const totalAmount = orderItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      shippingAddress: { name, phone, address },
    });

    res.status(201).json({ message: 'สั่งซื้อสำเร็จ', order });
  } catch (error) {
    // rollback: คืนสต็อกที่ตัดไปแล้วทั้งหมด
    for (const d of decremented) {
      await Product.updateOne({ _id: d.id }, { $inc: { stock: d.quantity } });
    }
    res.status(error.status || 500).json({ message: error.message });
  }
};

// สถานะที่นับเป็น "ยอดขาย" — pending ยังไม่จ่ายเงิน / cancelled คืนของแล้ว
const REVENUE_STATUSES = ['paid', 'shipped', 'completed'];

// GET /api/orders/stats — (admin) สรุปยอดขายด้วย MongoDB Aggregation
exports.getStats = async (req, res) => {
  try {
    // ย้อนหลัง 7 วัน (รวมวันนี้) เริ่มนับตั้งแต่เที่ยงคืน
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // ยอดรวมทั้งร้าน
    const [totals] = await Order.aggregate([
      { $match: { status: { $in: REVENUE_STATUSES } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
    ]);

    // ยอดขายรายวัน 7 วันล่าสุด (จัดกลุ่มตามวันที่เวลาไทย)
    const daily = await Order.aggregate([
      {
        $match: {
          status: { $in: REVENUE_STATUSES },
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: 'Asia/Bangkok',
            },
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // สินค้าขายดี Top 5 — แตก items ออกมานับทีละชิ้น
    const topProducts = await Order.aggregate([
      { $match: { status: { $in: REVENUE_STATUSES } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: {
            $sum: { $multiply: ['$items.price', '$items.quantity'] },
          },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]);

    // นับออเดอร์แยกตามสถานะ (รวมทุกสถานะ)
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      totalRevenue: totals?.revenue || 0,
      totalOrders: totals?.orders || 0,
      daily,
      topProducts,
      statusCounts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/me — ออเดอร์ของตัวเอง
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders — (admin) ออเดอร์ทั้งหมด
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/orders/:id/status — (admin) เปลี่ยนสถานะตาม state machine
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'ไม่พบออเดอร์นี้' });
    }

    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `เปลี่ยนสถานะจาก "${order.status}" เป็น "${status}" ไม่ได้`,
      });
    }

    // ถ้ายกเลิก ให้คืนสต็อกทุกชิ้นในออเดอร์
    if (status === 'cancelled') {
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } }
        );
      }
    }

    order.status = status;
    await order.save();
    res.json({ message: 'อัปเดตสถานะแล้ว', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/orders/:id/cancel — ผู้ซื้อยกเลิกเองได้เฉพาะตอนยังไม่ชำระ
exports.cancelMyOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'ไม่พบออเดอร์นี้' });
    }
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ยกเลิกออเดอร์นี้' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({
        message: 'ยกเลิกได้เฉพาะออเดอร์ที่ยังไม่ชำระเงิน',
      });
    }

    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } }
      );
    }

    order.status = 'cancelled';
    await order.save();
    res.json({ message: 'ยกเลิกออเดอร์แล้ว', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
