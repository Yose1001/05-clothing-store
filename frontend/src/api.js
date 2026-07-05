// ตัวกลางเรียก API ทั้งหมด — แนบ JWT token ให้อัตโนมัติถ้ามี
const BASE_URL = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
  }
  return data;
}

export const api = {
  // auth
  register: (body) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  // products
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v)
    ).toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (body) =>
    request('/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // อัปโหลดรูป — ใช้ FormData จึงไม่ผ่าน request() ที่ตั้ง Content-Type เป็น JSON
  // (browser จะตั้ง multipart/form-data พร้อม boundary ให้เอง)
  uploadImage: async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${BASE_URL}/uploads`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'อัปโหลดรูปไม่สำเร็จ');
    }
    return data; // { url }
  },

  // orders
  createOrder: (body) =>
    request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  getMyOrders: () => request('/orders/me'),
  getAllOrders: () => request('/orders'),
  getOrderStats: () => request('/orders/stats'),
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  cancelMyOrder: (id) => request(`/orders/${id}/cancel`, { method: 'PATCH' }),
};

// จัดการ session ของผู้ใช้ใน localStorage
export const auth = {
  save({ token, user }) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  user() {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
