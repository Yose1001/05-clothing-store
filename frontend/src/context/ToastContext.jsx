import { createContext, useCallback, useContext, useState } from 'react';

// ระบบแจ้งเตือนกลางของทั้งเว็บ — ทุกหน้าเรียก useToast() แล้วใช้
// toast.success / toast.error / toast.warning ได้เลย
const ToastContext = createContext(null);

const ICONS = { success: '✓', error: '✕', warning: '!' };

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const notify = useCallback((type, message) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => dismiss(id), 5000); // หายเองใน 5 วินาที
  }, []);

  const toast = {
    success: (msg) => notify('success', msg),
    error: (msg) => notify('error', msg),
    warning: (msg) => notify('warning', msg),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            onClick={() => dismiss(t.id)}
            title="คลิกเพื่อปิด"
          >
            <span className="toast-icon">{ICONS[t.type]}</span>
            <span className="toast-msg">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
