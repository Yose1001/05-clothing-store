import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { CATEGORY_EMOJI, formatPrice } from '../utils';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { items, addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loadError, setLoadError] = useState('');
  const toast = useToast();

  useEffect(() => {
    api
      .getProduct(id)
      .then(setProduct)
      .catch((err) => setLoadError(err.message));
  }, [id]);

  if (loadError) return <p className="error">{loadError}</p>;
  if (!product) return <p className="hint center">กำลังโหลด...</p>;

  const handleAdd = () => {
    if (!size) {
      toast.warning('ยังไม่ได้เลือกไซซ์ — กรุณาเลือกไซซ์ก่อนเพิ่มลงตะกร้า');
      return;
    }

    // กันเพิ่มเกินสต็อกตั้งแต่ฝั่งหน้าเว็บ พร้อมบอกสาเหตุชัด ๆ
    const inCart = items
      .filter((i) => i.productId === product._id)
      .reduce((sum, i) => sum + i.quantity, 0);
    if (inCart + quantity > product.stock) {
      toast.warning(
        `เพิ่มไม่ได้ — สต็อกมี ${product.stock} ชิ้น แต่มีในตะกร้าแล้ว ${inCart} ชิ้น`
      );
      return;
    }

    addItem(product, size, quantity);
    toast.success(`เพิ่ม "${product.name}" ไซซ์ ${size} × ${quantity} ลงตะกร้าแล้ว`);
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
