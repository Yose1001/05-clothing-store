import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createOrder({
        items: items.map((i) => ({
          productId: i.productId,
          size: i.size,
          quantity: i.quantity,
        })),
        shippingAddress: form,
      });
      clearCart();
      toast.success('สั่งซื้อสำเร็จ! ติดตามสถานะได้ที่หน้าออเดอร์ของฉัน');
      navigate('/orders');
    } catch (err) {
      // backend บอกสาเหตุมาให้แล้ว เช่น "สินค้า X มีไม่พอ (เหลือ 3 ชิ้น)"
      toast.error(`สั่งซื้อไม่สำเร็จ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/');
    return null;
  }

  return (
    <div className="page">
      <div className="card">
        <h2>📦 ยืนยันการสั่งซื้อ</h2>

        <div className="checkout-summary">
          {items.map((i) => (
            <div className="checkout-line" key={`${i.productId}-${i.size}`}>
              <span>
                {i.name} (ไซซ์ {i.size}) × {i.quantity}
              </span>
              <span>{formatPrice(i.price * i.quantity)}</span>
            </div>
          ))}
          <div className="checkout-line total-line">
            <span>ยอดรวม</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            ชื่อผู้รับ
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            เบอร์โทรศัพท์
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            ที่อยู่จัดส่ง
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'กำลังสั่งซื้อ...' : `ยืนยันสั่งซื้อ ${formatPrice(total)}`}
          </button>
        </form>
      </div>
    </div>
  );
}
