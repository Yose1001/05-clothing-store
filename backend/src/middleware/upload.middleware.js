const multer = require('multer');
const path = require('path');
const fs = require('fs');

// เก็บรูปไว้ที่ /app/uploads — โฟลเดอร์นี้ mount เป็น Docker volume
// รูปจึงไม่หายตอน rebuild image
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // ตั้งชื่อใหม่กันชนกันและกันชื่อไฟล์แปลก ๆ จากผู้ใช้
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`);
  },
});

// รับเฉพาะไฟล์รูปภาพเท่านั้น
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('อัปโหลดได้เฉพาะไฟล์รูปภาพ (jpg, png, webp)'));
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // ไม่เกิน 5MB
});
