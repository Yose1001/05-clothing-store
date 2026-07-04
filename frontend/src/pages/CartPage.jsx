import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { auth } from '../api';
import { CATEGORY_EMOJI, formatPrice } from '../utils';

export default function CartPage() {
  const { items, updateQuantity, removeItem, total } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!auth.user()) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="card center-card">
        <p style={{ fontSize: '3rem' }}>🛒</p>
        <h2>ตะกร้าว่างเปล่า</h2>
        <p className="hint">ยังไม่มีสินค้าในตะกร้า ไปเลือกช้อปกันเลย</p>
        <Link to="/" className="btn-primary-link">
          ไปหน้าร้าน
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card">
        <h2>🛒 ตะกร้าสินค้า ({items.length} รายการ)</h2>
        {items.map((item) => (
          <div className="cart-item" key={`${item.productId}-${item.size}`}>
            <div className="cart-thumb">{CATEGORY_EMOJI[item.category]}</div>
            <div className="cart-detail">
              <span className="product-name">{item.name}</span>
              <span className="hint">
                ไซซ์ {item.size} · {formatPrice(item.price)}/ชิ้น
              </span>
            </div>
            <div className="qty-row">
              <button
                className="qty-btn"
                onClick={() =>
                  updateQuantity(item.productId, item.size, item.quantity - 1)
                }
              >
                −
              </button>
              <span className="qty-value">{item.quantity}</span>
              <button
                className="qty-btn"
                onClick={() =>
                  updateQuantity(item.productId, item.size, item.quantity + 1)
                }
              >
                +
              </button>
            </div>
            <span className="cart-line-total">
              {formatPrice(item.price * item.quantity)}
            </span>
            <button
              className="btn-cancel"
              onClick={() => removeItem(item.productId, item.size)}
            >
              ลบ
            </button>
          </div>
        ))}

        <div className="cart-summary">
          <span>ยอดรวมทั้งหมด</span>
          <span className="cart-total">{formatPrice(total)}</span>
        </div>
        <button type="submit" onClick={handleCheckout}>
          ดำเนินการสั่งซื้อ →
        </button>
      </div>
    </div>
  );
}
