import { useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import AdminDashboard from './AdminDashboard';
import {
  CATEGORIES,
  CATEGORY_EMOJI,
  ORDER_STATUS,
  formatDateTime,
  formatPrice,
} from '../utils';

const EMPTY_FORM = {
  name: '',
  price: '',
  category: CATEGORIES[0],
  stock: '',
  description: '',
  imageUrl: '',
};

// ลำดับถัดไปของแต่ละสถานะ (ให้ admin กดได้เฉพาะที่ถูกต้อง)
const NEXT_STATUS = {
  pending: 'paid',
  paid: 'shipped',
  shipped: 'completed',
};

export default function AdminPage() {
  const [tab, setTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const loadOrders = () =>
    api
      .getAllOrders()
      .then(setOrders)
      .catch((e) => toast.error(`โหลดออเดอร์ไม่สำเร็จ: ${e.message}`));
  const loadProducts = () =>
    api
      .getProducts({ page: 1 })
      .then((d) => setProducts(d.products))
      .catch((e) => toast.error(`โหลดสินค้าไม่สำเร็จ: ${e.message}`));

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, []);

  // ---------- จัดการออเดอร์ ----------
  const advanceStatus = async (order) => {
    const next = NEXT_STATUS[order.status];
    try {
      await api.updateOrderStatus(order._id, next);
      toast.success(`อัปเดตออเดอร์เป็น "${ORDER_STATUS[next].label}" แล้ว`);
      await loadOrders();
    } catch (e) {
      // เช่น "เปลี่ยนสถานะจาก paid เป็น completed ไม่ได้"
      toast.error(`เปลี่ยนสถานะไม่สำเร็จ: ${e.message}`);
    }
  };

  const cancelOrder = async (order) => {
    if (!confirm('ยกเลิกออเดอร์นี้และคืนสต็อก?')) return;
    try {
      await api.updateOrderStatus(order._id, 'cancelled');
      toast.success('ยกเลิกออเดอร์และคืนสต็อกแล้ว');
      await Promise.all([loadOrders(), loadProducts()]);
    } catch (e) {
      toast.error(`ยกเลิกไม่สำเร็จ: ${e.message}`);
    }
  };

  // ---------- จัดการสินค้า ----------
  const handleFormChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // เช็คไฟล์รูปทันทีที่เลือก — ไม่ต้องรอกดบันทึกแล้วค่อยรู้ว่าผิด
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImageFile(null);
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error(
        `ไฟล์ "${file.name}" ไม่ใช่รูปภาพที่รองรับ — ใช้ได้เฉพาะ jpg, png, webp`
      );
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        `ไฟล์ใหญ่ ${(file.size / 1024 / 1024).toFixed(1)}MB — เกินกำหนด 5MB`
      );
      e.target.value = '';
      return;
    }
    setImageFile(file);
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // ถ้าเลือกรูปใหม่ อัปโหลดก่อน แล้วเอา URL ที่ได้ใส่ในตัวสินค้า
      let imageUrl = form.imageUrl;
      if (imageFile) {
        const uploaded = await api.uploadImage(imageFile);
        imageUrl = uploaded.url;
      }

      const body = {
        ...form,
        imageUrl,
        price: Number(form.price),
        stock: Number(form.stock),
      };
      if (editingId) {
        await api.updateProduct(editingId, body);
        toast.success(`แก้ไขสินค้า "${form.name}" สำเร็จ`);
      } else {
        await api.createProduct(body);
        toast.success(`เพิ่มสินค้า "${form.name}" สำเร็จ`);
      }
      setForm(EMPTY_FORM);
      setImageFile(null);
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      toast.error(`บันทึกสินค้าไม่สำเร็จ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p) => {
    setEditingId(p._id);
    setImageFile(null);
    setForm({
      name: p.name,
      price: p.price,
      category: p.category,
      stock: p.stock,
      description: p.description,
      imageUrl: p.imageUrl || '',
    });
  };

  const deleteProduct = async (p) => {
    if (!confirm(`ลบสินค้า "${p.name}" ใช่ไหม?`)) return;
    try {
      await api.deleteProduct(p._id);
      toast.success(`ลบสินค้า "${p.name}" แล้ว`);
      await loadProducts();
    } catch (err) {
      toast.error(`ลบสินค้าไม่สำเร็จ: ${err.message}`);
    }
  };

  return (
    <div className="page">
      <div className="chips">
        <button
          className={`chip ${tab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`chip ${tab === 'orders' ? 'active' : ''}`}
          onClick={() => setTab('orders')}
        >
          📋 ออเดอร์ ({orders.length})
        </button>
        <button
          className={`chip ${tab === 'products' ? 'active' : ''}`}
          onClick={() => setTab('products')}
        >
          👕 สินค้า ({products.length})
        </button>
      </div>

      {tab === 'dashboard' && <AdminDashboard />}

      {tab === 'orders' && (
        <div className="card">
          <h2>ออเดอร์ทั้งหมด</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ผู้สั่ง</th>
                  <th>รายการ</th>
                  <th>ยอด</th>
                  <th>เมื่อ</th>
                  <th>สถานะ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td>
                      {o.user?.name}
                      <div className="hint">{o.user?.email}</div>
                    </td>
                    <td>
                      {o.items.map((i, idx) => (
                        <div key={idx} className="hint">
                          {i.name} ({i.size}) × {i.quantity}
                        </div>
                      ))}
                    </td>
                    <td>{formatPrice(o.totalAmount)}</td>
                    <td className="hint">{formatDateTime(o.createdAt)}</td>
                    <td>
                      <span className={`badge ${ORDER_STATUS[o.status].className}`}>
                        {ORDER_STATUS[o.status].label}
                      </span>
                    </td>
                    <td>
                      <div className="action-col">
                        {NEXT_STATUS[o.status] && (
                          <button className="btn-small" onClick={() => advanceStatus(o)}>
                            → {ORDER_STATUS[NEXT_STATUS[o.status]].label}
                          </button>
                        )}
                        {['pending', 'paid'].includes(o.status) && (
                          <button className="btn-cancel" onClick={() => cancelOrder(o)}>
                            ยกเลิก
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <>
          <div className="card">
            <h2>{editingId ? '✏️ แก้ไขสินค้า' : '➕ เพิ่มสินค้าใหม่'}</h2>
            <form onSubmit={submitProduct}>
              <label>
                ชื่อสินค้า
                <input name="name" value={form.name} onChange={handleFormChange} required />
              </label>
              <div className="row">
                <label>
                  ราคา (บาท)
                  <input
                    name="price"
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={handleFormChange}
                    required
                  />
                </label>
                <label>
                  สต็อก (ชิ้น)
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={handleFormChange}
                    required
                  />
                </label>
                <label>
                  หมวดหมู่
                  <select name="category" value={form.category} onChange={handleFormChange}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                คำอธิบาย
                <input
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                />
              </label>
              <label>
                รูปสินค้า (jpg / png / webp ไม่เกิน 5MB)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                />
              </label>
              {(imageFile || form.imageUrl) && (
                <img
                  className="img-preview"
                  src={imageFile ? URL.createObjectURL(imageFile) : form.imageUrl}
                  alt="ตัวอย่างรูปสินค้า"
                />
              )}
              <div className="row">
                <button type="submit" disabled={saving}>
                  {saving
                    ? 'กำลังบันทึก...'
                    : editingId
                      ? 'บันทึกการแก้ไข'
                      : 'เพิ่มสินค้า'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setEditingId(null);
                      setImageFile(null);
                      setForm(EMPTY_FORM);
                    }}
                  >
                    ยกเลิกการแก้ไข
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card">
            <h2>สินค้าในระบบ</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ชื่อ</th>
                    <th>หมวดหมู่</th>
                    <th>ราคา</th>
                    <th>สต็อก</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="admin-prod-cell">
                          {p.imageUrl ? (
                            <img className="admin-thumb" src={p.imageUrl} alt={p.name} />
                          ) : (
                            <span className="admin-thumb admin-thumb-emoji">
                              {CATEGORY_EMOJI[p.category]}
                            </span>
                          )}
                          {p.name}
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td>{formatPrice(p.price)}</td>
                      <td className={p.stock === 0 ? 'out-of-stock' : ''}>{p.stock}</td>
                      <td>
                        <div className="action-col">
                          <button className="btn-small" onClick={() => startEdit(p)}>
                            แก้ไข
                          </button>
                          <button className="btn-cancel" onClick={() => deleteProduct(p)}>
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
