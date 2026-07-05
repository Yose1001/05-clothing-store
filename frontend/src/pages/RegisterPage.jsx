import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.warning(
        `รหัสผ่านสั้นเกินไป (${form.password.length} ตัวอักษร) — ต้องยาวอย่างน้อย 6 ตัวอักษร`
      );
      return;
    }
    setLoading(true);
    try {
      await api.register(form);
      toast.success('สมัครสมาชิกสำเร็จ! เข้าสู่ระบบได้เลย');
      navigate('/login');
    } catch (err) {
      toast.error(`สมัครสมาชิกไม่สำเร็จ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card">
      <h2>สมัครสมาชิก</h2>
      <form onSubmit={handleSubmit}>
        <label>
          ชื่อ
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
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
          รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
        </button>
      </form>
      <p className="hint">
        มีบัญชีแล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
      </p>
    </div>
  );
}
