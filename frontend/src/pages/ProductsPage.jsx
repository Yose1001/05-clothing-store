import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { CATEGORIES, CATEGORY_EMOJI, formatPrice } from '../utils';

export default function ProductsPage() {
  const [data, setData] = useState({ products: [], total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    // debounce การค้นหา: รอหยุดพิมพ์ 300ms ค่อยยิง API
    const timer = setTimeout(() => {
      api
        .getProducts({ search, category, sort, page })
        .then(setData)
        .catch((err) => setError(err.message));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, sort, page]);

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1); // เปลี่ยนตัวกรองเมื่อไหร่ กลับไปหน้าแรกเสมอ
  };

  return (
    <div className="page">
      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="🔍 ค้นหาสินค้า..."
          value={search}
          onChange={(e) => changeFilter(setSearch)(e.target.value)}
        />
        <select value={sort} onChange={(e) => changeFilter(setSort)(e.target.value)}>
          <option value="">ใหม่ล่าสุด</option>
          <option value="price_asc">ราคา: ต่ำ → สูง</option>
          <option value="price_desc">ราคา: สูง → ต่ำ</option>
        </select>
      </div>

      <div className="chips">
        <button
          className={`chip ${category === '' ? 'active' : ''}`}
          onClick={() => changeFilter(setCategory)('')}
        >
          ทั้งหมด
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`chip ${category === c ? 'active' : ''}`}
            onClick={() => changeFilter(setCategory)(c)}
          >
            {CATEGORY_EMOJI[c]} {c}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      <div className="product-grid">
        {data.products.map((p) => (
          <Link to={`/products/${p._id}`} key={p._id} className="product-card">
            <div className="product-thumb">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} />
              ) : (
                CATEGORY_EMOJI[p.category]
              )}
            </div>
            <div className="product-info">
              <span className="product-name">{p.name}</span>
              <span className="product-price">{formatPrice(p.price)}</span>
              <span className={`hint ${p.stock === 0 ? 'out-of-stock' : ''}`}>
                {p.stock === 0 ? 'สินค้าหมด' : `เหลือ ${p.stock} ชิ้น`}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {data.products.length === 0 && !error && (
        <p className="hint center">ไม่พบสินค้าที่ค้นหา</p>
      )}

      {data.pages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← ก่อนหน้า
          </button>
          <span>
            หน้า {data.page} / {data.pages}
          </span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
            ถัดไป →
          </button>
        </div>
      )}
    </div>
  );
}
