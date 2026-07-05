import { useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import { auth } from './api';
import { useCart } from './context/CartContext';
import { useToast } from './context/ToastContext';

export default function App() {
  const [user, setUser] = useState(auth.user());
  const { count } = useCart();
  const navigate = useNavigate();
  const toast = useToast();

  // token หมดอายุ/ถูกปฏิเสธระหว่างใช้งาน → แจ้งสาเหตุแล้วพาไป login
  useEffect(() => {
    const onExpired = (e) => {
      setUser(null);
      toast.error(`${e.detail} — กรุณาเข้าสู่ระบบใหม่อีกครั้ง`);
      navigate('/login');
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const handleLogout = () => {
    auth.logout();
    setUser(null);
    toast.success('ออกจากระบบแล้ว');
    navigate('/');
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="brand">
          🛍️ Yose Clothing
        </Link>
        <div className="nav-links">
          <Link to="/">หน้าร้าน</Link>
          <Link to="/cart" className="cart-link">
            ตะกร้า
            {count > 0 && <span className="cart-badge">{count}</span>}
          </Link>
          {user ? (
            <>
              <Link to="/orders">ออเดอร์ของฉัน</Link>
              {user.role === 'admin' && <Link to="/admin">หลังร้าน</Link>}
              <span className="hint nav-hint">สวัสดี, {user.name}</span>
              <button className="btn-link" onClick={handleLogout}>
                ออกจากระบบ
              </button>
            </>
          ) : (
            <>
              <Link to="/login">เข้าสู่ระบบ</Link>
              <Link to="/register">สมัครสมาชิก</Link>
            </>
          )}
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route
            path="/checkout"
            element={user ? <CheckoutPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/orders"
            element={user ? <OrdersPage /> : <Navigate to="/login" />}
          />
          <Route path="/login" element={<LoginPage onLogin={setUser} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/admin"
            element={user?.role === 'admin' ? <AdminPage /> : <Navigate to="/login" />}
          />
        </Routes>
      </main>
    </>
  );
}
