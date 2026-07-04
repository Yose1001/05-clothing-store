const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');

// สินค้าเริ่มต้นสำหรับ demo — จะถูกเพิ่มเฉพาะตอนที่ฐานข้อมูลยังว่าง
const PRODUCTS = [
  { name: 'เสื้อยืดคอกลม Basic สีขาว', price: 259, category: 'เสื้อยืด', stock: 50, description: 'ผ้าคอตตอน 100% นุ่ม ใส่สบาย ทรงตรงใส่ได้ทุกวัน' },
  { name: 'เสื้อยืด Oversize สีดำ', price: 320, category: 'เสื้อยืด', stock: 40, description: 'ทรงหลวมสไตล์สตรีท ผ้าหนานุ่ม ไม่ย้วยง่าย' },
  { name: 'เสื้อยืดลายทาง Navy', price: 290, category: 'เสื้อยืด', stock: 35, description: 'ลายทางขาว-กรม สไตล์มินิมอล เข้ากับกางเกงได้ทุกแบบ' },
  { name: 'เสื้อเชิ้ต Oxford สีฟ้า', price: 590, category: 'เสื้อเชิ้ต', stock: 25, description: 'ผ้า Oxford เนื้อดี ใส่ทำงานหรือลำลองก็ได้' },
  { name: 'เสื้อเชิ้ตลินินสีขาว', price: 690, category: 'เสื้อเชิ้ต', stock: 20, description: 'ผ้าลินินระบายอากาศดี เหมาะกับอากาศร้อน' },
  { name: 'เสื้อเชิ้ตลายสก็อต', price: 550, category: 'เสื้อเชิ้ต', stock: 30, description: 'ลายสก็อตแดง-ดำคลาสสิก ใส่เดี่ยวหรือคลุมก็เท่' },
  { name: 'กางเกงยีนส์ทรงกระบอก', price: 890, category: 'กางเกง', stock: 30, description: 'ยีนส์ฟอกสีเข้ม ทรงกระบอกเล็ก ยืดหยุ่นใส่สบาย' },
  { name: 'กางเกงชิโน่สีกากี', price: 650, category: 'กางเกง', stock: 28, description: 'ทรงเรียบร้อย ใส่ทำงานได้ ผ้าไม่ยับง่าย' },
  { name: 'กางเกงขาสั้นลำลอง', price: 390, category: 'กางเกง', stock: 45, description: 'ผ้าคอตตอนทวิล มีกระเป๋าข้าง เหมาะกับวันสบาย ๆ' },
  { name: 'เดรสยาวลายดอก', price: 790, category: 'เดรส', stock: 18, description: 'เดรสยาวผ้าชีฟอง ลายดอกไม้ พร้อมซับใน' },
  { name: 'เดรสเชิ้ตสีครีม', price: 720, category: 'เดรส', stock: 22, description: 'เดรสทรงเชิ้ตมีเข็มขัด ใส่ทำงานหรือเที่ยวก็ได้' },
  { name: 'แจ็คเก็ตยีนส์คลาสสิก', price: 990, category: 'แจ็คเก็ต', stock: 15, description: 'แจ็คเก็ตยีนส์ทรงมาตรฐาน ยิ่งใส่ยิ่งเข้ารูป' },
  { name: 'แจ็คเก็ตบอมเบอร์สีดำ', price: 1090, category: 'แจ็คเก็ต', stock: 12, description: 'ทรงบอมเบอร์คลาสสิก ซิปหน้า ผ้าโพลีเนื้อแน่น' },
];

// เพิ่มข้อมูลเริ่มต้นให้อัตโนมัติถ้าฐานข้อมูลยังว่าง (สะดวกตอน demo)
module.exports = async function seedIfEmpty() {
  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    await Product.insertMany(PRODUCTS);
    console.log(`Seeded ${PRODUCTS.length} products`);
  }

  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    await User.create({
      name: 'Admin',
      email: 'admin@shop.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
    });
    console.log('Seeded admin account: admin@shop.com / admin123');
  }
};
