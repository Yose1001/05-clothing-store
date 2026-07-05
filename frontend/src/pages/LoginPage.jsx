import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, auth } from '../api';
import { useToast } from '../context/ToastContext';

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.login(form);
      auth.save(data);
      onLogin(data.user);
      toast.success(`เข้าสู่ระบบสำเร็จ — ยินดีต้อนรับ ${data.user.name}`);
      navigate('/');
    } catch (err) {
      toast.error(`เข้าสู่ระบบไม่สำเร็จ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card">
      <h2>เข้าสู่ระบบ</h2>
      <form onSubmit={handleSubmit}>
        <label>
          อีเมล
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          รหัสผ่าน
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
      <p className="hint">
        ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link>
      </p>
    </div>
  );
}
