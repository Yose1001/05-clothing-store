import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { api } from '../api';
import { ORDER_STATUS, formatPrice } from '../utils';

// สร้างแกนวันที่ 7 วันล่าสุด แล้วเติมยอดจาก backend (วันไหนไม่มีขาย = 0)
function buildDailyData(daily) {
  const byDate = Object.fromEntries(daily.map((d) => [d._id, d]));
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toLocaleDateString('en-CA'); // YYYY-MM-DD ตามเวลาเครื่อง
    days.push({
      label: date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
      revenue: byDate[key]?.revenue || 0,
      orders: byDate[key]?.orders || 0,
    });
  }
  return days;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getOrderStats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p className="hint center">กำลังโหลดสถิติ...</p>;

  const dailyData = buildDailyData(stats.daily);
  const maxQty = Math.max(1, ...stats.topProducts.map((p) => p.quantity));
  const statusMap = Object.fromEntries(
    stats.statusCounts.map((s) => [s._id, s.count])
  );

  return (
    <div className="page">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">ยอดขายรวม</span>
          <span className="stat-value">{formatPrice(stats.totalRevenue)}</span>
          <span className="hint">เฉพาะออเดอร์ที่ชำระแล้ว</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">ออเดอร์ที่ขายได้</span>
          <span className="stat-value">{stats.totalOrders}</span>
          <span className="hint">ชำระแล้ว / จัดส่ง / สำเร็จ</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">รอชำระเงิน</span>
          <span className="stat-value">{statusMap.pending || 0}</span>
          <span className="hint">ยังไม่นับเป็นยอดขาย</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">ยกเลิก</span>
          <span className="stat-value">{statusMap.cancelled || 0}</span>
          <span className="hint">คืนสต็อกแล้ว</span>
        </div>
      </div>

      <div className="card">
        <h2>📈 ยอดขาย 7 วันล่าสุด</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dailyData} margin={{ top: 8, right: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v.toLocaleString('th-TH')}
            />
            <Tooltip
              formatter={(value, name) =>
                name === 'revenue'
                  ? [formatPrice(value), 'ยอดขาย']
                  : [value, 'ออเดอร์']
              }
              labelStyle={{ fontWeight: 700 }}
            />
            <Bar dataKey="revenue" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={46} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2>🏆 สินค้าขายดี Top 5</h2>
        {stats.topProducts.length === 0 ? (
          <p className="hint">ยังไม่มียอดขาย</p>
        ) : (
          <div className="top-products">
            {stats.topProducts.map((p, idx) => (
              <div className="top-row" key={p._id}>
                <span className="top-rank">{idx + 1}</span>
                <div className="top-info">
                  <div className="top-head">
                    <span className="top-name">{p._id}</span>
                    <span className="hint">
                      {p.quantity} ชิ้น · {formatPrice(p.revenue)}
                    </span>
                  </div>
                  <div className="top-bar-track">
                    <div
                      className="top-bar"
                      style={{ width: `${(p.quantity / maxQty) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>📦 ออเดอร์แยกตามสถานะ</h2>
        <div className="chips">
          {Object.entries(ORDER_STATUS).map(([key, s]) => (
            <span key={key} className={`badge ${s.className}`}>
              {s.label}: {statusMap[key] || 0}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
