// ของใช้ร่วมกันหลายหน้า

export const CATEGORY_EMOJI = {
  'เสื้อยืด': '👕',
  'เสื้อเชิ้ต': '👔',
  'กางเกง': '👖',
  'เดรส': '👗',
  'แจ็คเก็ต': '🧥',
};

export const CATEGORIES = Object.keys(CATEGORY_EMOJI);

export const ORDER_STATUS = {
  pending: { label: 'รอชำระเงิน', className: 'pending' },
  paid: { label: 'ชำระแล้ว', className: 'paid' },
  shipped: { label: 'กำลังจัดส่ง', className: 'shipped' },
  completed: { label: 'สำเร็จ', className: 'completed' },
  cancelled: { label: 'ยกเลิก', className: 'cancelled' },
};

export function formatPrice(value) {
  return value.toLocaleString('th-TH') + ' ฿';
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
