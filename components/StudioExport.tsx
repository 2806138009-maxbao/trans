import React, { useCallback } from 'react';
import { Camera } from 'lucide-react';
import { THEME } from '../theme';

interface StudioExportProps {
  targetRef: React.RefObject<HTMLElement>;
  className?: string;
}

export const StudioExport: React.FC<StudioExportProps> = ({ targetRef, className = '' }) => {
  const handleExport = useCallback(async () => {
    if (!targetRef.current) return;
    
    try {
      // Dynamic import html-to-image
      const { toPng } = await import('html-to-image');
      
      const dataUrl = await toPng(targetRef.current, {
        backgroundColor: '#050505',
        pixelRatio: 2,
        style: {
          padding: '40px',
          background: 'linear-gradient(135deg, #1a0a2e 0%, #050505 100%)',
        },
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `smith-chart-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.warn('Export failed:', error);
      // Fallback: use canvas if available
      const canvas = targetRef.current.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = `smith-chart-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }
  }, [targetRef]);

  return (
    <button
      onClick={handleExport}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${className}`}
      style={{
        backgroundColor: 'rgba(255, 199, 0, 0.1)',
        border: '1px solid rgba(255, 199, 0, 0.2)',
        color: THEME.colors.primary,
      }}
      title="Export as PNG"
    >
      <Camera size={16} />
      <span className="text-xs font-medium">Export</span>
    </button>
  );
};

