require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const connectDB = require('./config/db');
const seedIfEmpty = require('./seed');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();

app.use(cors());
app.use(express.json());

// เสิร์ฟรูปที่อัปโหลดแล้ว (GET) — POST จะไหลต่อไปที่ uploadRoutes เอง
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/uploads', uploadRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Clothing Store API is running' });
});

// จัดการ error จาก multer (ไฟล์ใหญ่เกิน / ไม่ใช่รูป) ให้ตอบเป็น JSON
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'ไฟล์ใหญ่เกิน 5MB' : err.message;
    return res.status(400).json({ message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedIfEmpty();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
