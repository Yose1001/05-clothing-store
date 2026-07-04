import { useEffect, useState } from 'react';
import { api } from '../api';
import { ORDER_STATUS, formatDateTime, formatPrice } from '../utils';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const load = () =>
    api.getMyOrders().then(setOrders).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (id) => {
    if (!confirm('ต้องการยกเลิกออเดอร์นี้ใช่ไหม?')) return;
    try {
      await api.cancelMyOrder(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <h2 className="page-title">📋 ออเดอร์ของฉัน ({orders.length})</h2>
      {error && <p className="error">{error}</p>}
      {orders.length === 0 && <p className="hint center">ยังไม่มีคำสั่งซื้อ</p>}

      {orders.map((order) => (
        <div className="card order-card" key={order._id}>
          <div className="order-head">
            <div>
              <span className="hint">สั่งเมื่อ {formatDateTime(order.createdAt)}</span>
              <div className="order-total">{formatPrice(order.totalAmount)}</div>
            </div>
            <span className={`badge ${ORDER_STATUS[order.status].className}`}>
              {ORDER_STATUS[order.status].label}
            </span>
          </div>
          <div className="order-items">
            {order.items.map((item, idx) => (
              <div className="checkout-line" key={idx}>
                <span>
                  {item.name} (ไซซ์ {item.size}) × {item.quantity}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <p className="hint">
            จัดส่ง: {order.shippingAddress.name} · {order.shippingAddress.phone} ·{' '}
            {order.shippingAddress.address}
          </p>
          {order.status === 'pending' && (
            <button className="btn-cancel" onClick={() => handleCancel(order._id)}>
              ยกเลิกออเดอร์
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
