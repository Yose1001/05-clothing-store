const express = require('express');
const upload = require('../middleware/upload.middleware');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/uploads — (admin) อัปโหลดรูป 1 ไฟล์ field ชื่อ "image"
// ตอบ URL กลับไปให้เอาไปใส่ imageUrl ของสินค้า
router.post('/', protect, adminOnly, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'ไม่พบไฟล์รูปภาพ' });
  }
  res.status(201).json({ url: `/api/uploads/${req.file.filename}` });
});

module.exports = router;
