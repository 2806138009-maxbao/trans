import React, { useEffect, useState } from 'react';

// ============================================================
// TOAST NOTIFICATION
// 
// Minimal, non-intrusive notification for keyboard shortcuts
// Appears at bottom center, auto-dismisses
// ============================================================

interface ToastProps {
  message: string;
  duration?: number;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  duration = 2000, 
  onDismiss 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Enter animation
    requestAnimationFrame(() => setIsVisible(true));
    
    // Exit after duration
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 200);
    
    // Dismiss after exit animation
    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration, onDismiss]);

  return (
    <div 
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
      style={{
        transform: `translateX(-50%) translateY(${isVisible && !isExiting ? '0' : '20px'})`,
        opacity: isVisible && !isExiting ? 1 : 0,
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div 
        className="px-5 py-3 rounded-xl flex items-center gap-3"
        style={{
          backgroundColor: 'rgba(10, 10, 10, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.1)',
        }}
      >
        {/* Icon */}
        <div 
          className="w-5 h-5 rounded-md flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255, 215, 0, 0.15)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path 
              d="M10 3L4.5 8.5L2 6" 
              stroke="#FFD700" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
        
        {/* Message */}
        <span 
          className="text-sm font-medium"
          style={{ color: '#EAEAEA' }}
        >
          {message}
        </span>
        
        {/* Keyboard hint */}
        <div 
          className="px-2 py-0.5 rounded text-[10px] font-mono"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          ⌘
        </div>
      </div>
    </div>
  );
};

// ============================================================
// TOAST MANAGER (for multiple toasts)
// ============================================================

interface ToastItem {
  id: string;
  message: string;
}

interface ToastManagerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastManager: React.FC<ToastManagerProps> = ({ toasts, onDismiss }) => {
  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            position: 'fixed',
            bottom: `${32 + index * 60}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999 - index,
          }}
        >
          <Toast 
            message={toast.message} 
            onDismiss={() => onDismiss(toast.id)} 
          />
        </div>
      ))}
    </>
  );
};

