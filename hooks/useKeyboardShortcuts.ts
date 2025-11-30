import { useEffect, useCallback, useState } from 'react';
import { audio } from '../utils/audioEngine';

// ============================================================
// KEYBOARD SHORTCUTS HOOK
// 
// Pro-workflow keyboard shortcuts for the Smith Chart
// 
// Shortcuts:
// - s: Add Series Component
// - p: Add Shunt (Parallel) Component
// - z / Cmd+z: Undo last action
// - Backspace: Remove last component
// - r: Reset to match point
// - a: Toggle admittance view
// - v: Toggle VSWR circles
// - m: Toggle control mode (slider/mouse)
// ============================================================

export type ShortcutAction = 
  | 'addSeries'
  | 'addShunt'
  | 'undo'
  | 'removeLast'
  | 'reset'
  | 'toggleAdmittance'
  | 'toggleVSWR'
  | 'toggleMode';

interface ShortcutConfig {
  key: string;
  action: ShortcutAction;
  label: string;
  requiresMeta?: boolean;
}

const SHORTCUTS: ShortcutConfig[] = [
  { key: 's', action: 'addSeries', label: 'Series Component' },
  { key: 'p', action: 'addShunt', label: 'Shunt Component' },
  { key: 'z', action: 'undo', label: 'Undo', requiresMeta: true },
  { key: 'Backspace', action: 'removeLast', label: 'Remove Last' },
  { key: 'r', action: 'reset', label: 'Reset to Match' },
  { key: 'a', action: 'toggleAdmittance', label: 'Toggle Admittance' },
  { key: 'v', action: 'toggleVSWR', label: 'Toggle VSWR' },
  { key: 'm', action: 'toggleMode', label: 'Toggle Control Mode' },
];

interface UseKeyboardShortcutsOptions {
  onAction: (action: ShortcutAction) => void;
  enabled?: boolean;
}

interface ToastNotification {
  id: string;
  message: string;
}

export function useKeyboardShortcuts({ 
  onAction, 
  enabled = true 
}: UseKeyboardShortcutsOptions) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = useCallback((message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const shortcut = SHORTCUTS.find(s => {
        const keyMatches = s.key.toLowerCase() === e.key.toLowerCase();
        const metaMatches = s.requiresMeta ? (e.metaKey || e.ctrlKey) : true;
        return keyMatches && metaMatches;
      });

      if (shortcut) {
        e.preventDefault();
        
        // Play appropriate sound
        switch (shortcut.action) {
          case 'addSeries':
          case 'addShunt':
            audio.playClick();
            break;
          case 'undo':
          case 'removeLast':
            audio.playUndo();
            break;
          case 'reset':
            audio.playSnap();
            break;
          default:
            audio.playTick();
        }
        
        // Show toast
        showToast(shortcut.label);
        
        // Trigger action
        onAction(shortcut.action);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onAction, showToast]);

  return { toasts, dismissToast };
}

// Export shortcuts for help display
export const KEYBOARD_SHORTCUTS = SHORTCUTS;

