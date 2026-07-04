import { useEffect, useState } from 'react';
import { api } from '../api';
import {
  CATEGORIES,
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
};

// ลำดับถัดไปของแต่ละสถานะ (ให้ admin กดได้เฉพาะที่ถูกต้อง)
const NEXT_STATUS = {
  pending: 'paid',
  paid: 'shipped',
  shipped: 'completed',
};

export default function AdminPage() {
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const loadOrders = () =>
    api.getAllOrders().then(setOrders).catch((e) => setError(e.message));
  const loadProducts = () =>
    api
      .getProducts({ page: 1 })
      .then((d) => setProducts(d.products))
      .catch((e) => setError(e.message));

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, []);

  // ---------- จัดการออเดอร์ ----------
  const advanceStatus = async (order) => {
    try {
      await api.updateOrderStatus(order._id, NEXT_STATUS[order.status]);
      await loadOrders();
    } catch (e) {
      setError(e.message);
    }
  };

  const cancelOrder = async (order) => {
    if (!confirm('ยกเลิกออเดอร์นี้และคืนสต็อก?')) return;
    try {
      await api.updateOrderStatus(order._id, 'cancelled');
      await Promise.all([loadOrders(), loadProducts()]);
    } catch (e) {
      setError(e.message);
    }
  };

  // ---------- จัดการสินค้า ----------
  const handleFormChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submitProduct = async (e) => {
    e.preventDefault();
    setError('');
    const body = { ...form, price: Number(form.price), stock: Number(form.stock) };
    try {
      if (editingId) {
        await api.updateProduct(editingId, body);
      } else {
        await api.createProduct(body);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      price: p.price,
      category: p.category,
      stock: p.stock,
      description: p.description,
    });
  };

  const deleteProduct = async (id) => {
    if (!confirm('ลบสินค้านี้ใช่ไหม?')) return;
    try {
      await api.deleteProduct(id);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="chips">
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

      {error && <p className="error">{error}</p>}

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
              <div className="row">
                <button type="submit">
                  {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setEditingId(null);
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
                      <td>{p.name}</td>
                      <td>{p.category}</td>
                      <td>{formatPrice(p.price)}</td>
                      <td className={p.stock === 0 ? 'out-of-stock' : ''}>{p.stock}</td>
                      <td>
                        <div className="action-col">
                          <button className="btn-small" onClick={() => startEdit(p)}>
                            แก้ไข
                          </button>
                          <button className="btn-cancel" onClick={() => deleteProduct(p._id)}>
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
