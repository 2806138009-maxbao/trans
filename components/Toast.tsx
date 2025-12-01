import React from 'react';
import { THEME } from '../theme';
import type { ShortcutToast } from '../hooks/useKeyboardShortcuts';

interface ToastManagerProps {
  toasts: ShortcutToast[];
  onDismiss: (id: number) => void;
}

export const ToastManager: React.FC<ToastManagerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="px-4 py-2 rounded-lg text-sm font-medium pointer-events-auto shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all"
          style={{
            backgroundColor: toast.type === 'success'
              ? 'rgba(100, 255, 150, 0.12)'
              : toast.type === 'warning'
              ? 'rgba(255, 150, 100, 0.12)'
              : 'rgba(255, 199, 0, 0.12)',
            color: toast.type === 'success'
              ? '#64FF96'
              : toast.type === 'warning'
              ? '#FF9664'
              : THEME.colors.primary,
            border: `1px solid ${
              toast.type === 'success'
                ? 'rgba(100, 255, 150, 0.35)'
                : toast.type === 'warning'
                ? 'rgba(255, 150, 100, 0.35)'
                : 'rgba(255, 199, 0, 0.35)'
            }`,
            backdropFilter: 'blur(12px)',
            letterSpacing: '0.02em',
          }}
          onClick={() => onDismiss(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

