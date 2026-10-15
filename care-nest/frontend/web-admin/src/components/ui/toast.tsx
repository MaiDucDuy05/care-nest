'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

let toastListeners: ((toasts: ToastItem[]) => void)[] = [];
let toasts: ToastItem[] = [];

function emitChange() {
  toastListeners.forEach((l) => l([...toasts]));
}

export function toast(type: ToastType, message: string) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, type, message }];
  emitChange();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emitChange();
  }, 4000);
}

const typeStyles: Record<ToastType, React.CSSProperties> = {
  success: { background: 'var(--success)', color: '#fff' },
  error: { background: 'var(--danger)', color: '#fff' },
  warning: { background: 'var(--accent)', color: '#fff' },
  info: { background: 'var(--primary)', color: '#fff' },
};

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>([]);

  useEffect(() => {
    toastListeners.push(setList);
    return () => { toastListeners = toastListeners.filter((l) => l !== setList); };
  }, []);

  if (list.length === 0) return null;

  return createPortal(
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {list.map((t) => (
        <div key={t.id} style={{ ...typeStyles[t.type], padding: '12px 20px', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)', fontSize: '14px', fontWeight: 500, minWidth: '280px', maxWidth: '400px', animation: 'slideIn 0.2s ease' }}>
          {t.message}
        </div>
      ))}
    </div>,
    document.body,
  );
}
