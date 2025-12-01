import { useEffect, useCallback, useState } from 'react';

export type ShortcutAction = 
  | 'addSeriesL'
  | 'addSeriesC'
  | 'addShuntL'
  | 'addShuntC'
  | 'undo'
  | 'reset'
  | 'toggleAdmittance'
  | 'toggleVSWR'
  | 'toggleMode';

interface UseKeyboardShortcutsOptions {
  onAction: (action: ShortcutAction) => void;
  enabled?: boolean;
}

export interface ShortcutToast {
  id: number;
  message: string;
  type?: 'info' | 'success' | 'warning';
}

const ACTION_MESSAGES: Partial<Record<ShortcutAction, string>> = {
  addSeriesL: 'Series component added',
  addSeriesC: 'Series capacitor added',
  addShuntL: 'Shunt inductor added',
  addShuntC: 'Shunt capacitor added',
  undo: 'Undid last action',
  reset: 'Last component removed',
  toggleAdmittance: 'Admittance view toggled',
  toggleVSWR: 'VSWR rings toggled',
  toggleMode: 'Input mode switched',
};

export const useKeyboardShortcuts = ({ onAction, enabled = true }: UseKeyboardShortcutsOptions) => {
  const [toasts, setToasts] = useState<ShortcutToast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((action: ShortcutAction) => {
    const message = ACTION_MESSAGES[action];
    if (!message) return;
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type: 'info' }]);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => dismissToast(id), 2200);
    }
  }, [dismissToast]);

  const triggerAction = useCallback((action: ShortcutAction) => {
    onAction(action);
    pushToast(action);
  }, [onAction, pushToast]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.getAttribute('contenteditable') === 'true')) {
      return;
    }

    const key = e.key.toLowerCase();
    const isCmd = e.metaKey || e.ctrlKey;

    if (isCmd && key === 'z') {
      e.preventDefault();
      triggerAction('undo');
      return;
    }

    if (key === 'backspace' || key === 'delete') {
      e.preventDefault();
      triggerAction('reset');
      return;
    }

    if (key === 'y') {
      e.preventDefault();
      triggerAction('toggleAdmittance');
      return;
    }

    if (key === 'v') {
      e.preventDefault();
      triggerAction('toggleVSWR');
      return;
    }

    if (key === 'm') {
      e.preventDefault();
      triggerAction('toggleMode');
      return;
    }

    if (key === 's') {
      e.preventDefault();
      triggerAction('addSeriesL');
      return;
    }

    if (key === 'p') {
      e.preventDefault();
      triggerAction('addShuntC');
      return;
    }

    if (key === 'l') {
      e.preventDefault();
      triggerAction('addSeriesL');
      return;
    }

    if (key === 'c') {
      e.preventDefault();
      triggerAction('addSeriesC');
      return;
    }
  }, [enabled, triggerAction]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { toasts, dismissToast };
};

