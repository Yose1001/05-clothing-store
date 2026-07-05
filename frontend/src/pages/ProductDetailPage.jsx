import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';
import { CATEGORY_EMOJI, formatPrice } from '../utils';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api.getProduct(id).then(setProduct).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!product) return <p className="hint center">กำลังโหลด...</p>;

  const handleAdd = () => {
    if (!size) {
      setError('กรุณาเลือกไซซ์ก่อน');
      return;
    }
    setError('');
    addItem(product, size, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← กลับหน้าร้าน
      </Link>
      <div className="card detail-card">
        <div className="detail-thumb">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            CATEGORY_EMOJI[product.category]
          )}
        </div>
        <div className="detail-info">
          <span className="chip">{product.category}</span>
          <h2>{product.name}</h2>
          <p className="hint">{product.description}</p>
          <p className="detail-price">{formatPrice(product.price)}</p>
          <p className={`hint ${product.stock === 0 ? 'out-of-stock' : ''}`}>
            {product.stock === 0 ? 'สินค้าหมด' : `คงเหลือ ${product.stock} ชิ้น`}
          </p>

          <div className="size-row">
            {product.sizes.map((s) => (
              <button
                key={s}
                className={`size-btn ${size === s ? 'active' : ''}`}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="qty-row">
            <button
              className="qty-btn"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              −
            </button>
            <span className="qty-value">{quantity}</span>
            <button
              className="qty-btn"
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
            >
              +
            </button>
          </div>

          {error && <p className="error">{error}</p>}
          {added && <p className="success">เพิ่มลงตะกร้าแล้ว ✓</p>}

          <button
            type="submit"
            disabled={product.stock === 0}
            onClick={handleAdd}
          >
            {product.stock === 0 ? 'สินค้าหมด' : '🛒 เพิ่มลงตะกร้า'}
          </button>
        </div>
      </div>
    </div>
  );
}
