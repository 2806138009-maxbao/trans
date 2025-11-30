import React, { useRef, useState, useCallback } from 'react';
import { THEME } from '../theme';

// Camera Icon
const CameraIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 20, 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

interface StudioExportProps {
  /** Ref to the element to capture */
  targetRef: React.RefObject<HTMLElement>;
  /** Optional filename */
  filename?: string;
  /** Optional callback when export starts */
  onExportStart?: () => void;
  /** Optional callback when export completes */
  onExportComplete?: () => void;
  /** Button size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * StudioExport - "Studio Mode" button that generates marketing-ready images
 * Uses Canvas API for image generation with beautiful frame
 */
export const StudioExport: React.FC<StudioExportProps> = ({
  targetRef,
  filename = 'smith-chart-export',
  onExportStart,
  onExportComplete,
  size = 'md',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  /**
   * Generate a marketing-ready image with beautiful frame
   */
  const handleExport = useCallback(async () => {
    if (!targetRef.current || isExporting) return;

    setIsExporting(true);
    onExportStart?.();

    // Camera flash effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    try {
      // Get the target element's canvas or create one
      const targetElement = targetRef.current;
      const canvas = targetElement.querySelector('canvas');
      
      if (!canvas) {
        console.error('No canvas found in target element');
        setIsExporting(false);
        return;
      }

      // Create export canvas with frame
      const padding = 40;
      const footerHeight = 60;
      const exportCanvas = document.createElement('canvas');
      const ctx = exportCanvas.getContext('2d');
      
      if (!ctx) {
        setIsExporting(false);
        return;
      }

      // Set export canvas size
      exportCanvas.width = canvas.width + padding * 2;
      exportCanvas.height = canvas.height + padding * 2 + footerHeight;

      // Draw mesh gradient background (Deep Purple to Black)
      const gradient = ctx.createRadialGradient(
        exportCanvas.width / 2,
        exportCanvas.height / 3,
        0,
        exportCanvas.width / 2,
        exportCanvas.height / 2,
        exportCanvas.width
      );
      gradient.addColorStop(0, '#1a0a2e'); // Deep purple
      gradient.addColorStop(0.5, '#0d0d0d'); // Near black
      gradient.addColorStop(1, '#050505'); // Deep black

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Add subtle noise texture
      const imageData = ctx.getImageData(0, 0, exportCanvas.width, exportCanvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 10;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
      }
      ctx.putImageData(imageData, 0, 0);

      // Draw the Smith Chart canvas
      ctx.drawImage(canvas, padding, padding);

      // Add corner brackets (HUD style)
      const bracketSize = 20;
      const bracketColor = 'rgba(255, 215, 0, 0.4)';
      ctx.strokeStyle = bracketColor;
      ctx.lineWidth = 2;

      // Top-left bracket
      ctx.beginPath();
      ctx.moveTo(padding - 10, padding + bracketSize);
      ctx.lineTo(padding - 10, padding - 10);
      ctx.lineTo(padding + bracketSize, padding - 10);
      ctx.stroke();

      // Top-right bracket
      ctx.beginPath();
      ctx.moveTo(exportCanvas.width - padding + 10, padding + bracketSize);
      ctx.lineTo(exportCanvas.width - padding + 10, padding - 10);
      ctx.lineTo(exportCanvas.width - padding - bracketSize, padding - 10);
      ctx.stroke();

      // Bottom-left bracket
      ctx.beginPath();
      ctx.moveTo(padding - 10, padding + canvas.height - bracketSize);
      ctx.lineTo(padding - 10, padding + canvas.height + 10);
      ctx.lineTo(padding + bracketSize, padding + canvas.height + 10);
      ctx.stroke();

      // Bottom-right bracket
      ctx.beginPath();
      ctx.moveTo(exportCanvas.width - padding + 10, padding + canvas.height - bracketSize);
      ctx.lineTo(exportCanvas.width - padding + 10, padding + canvas.height + 10);
      ctx.lineTo(exportCanvas.width - padding - bracketSize, padding + canvas.height + 10);
      ctx.stroke();

      // Draw footer text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '14px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'LuminousZao Lab // Smith Chart',
        exportCanvas.width / 2,
        exportCanvas.height - 20
      );

      // Add timestamp
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = '10px "Space Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(
        new Date().toISOString().split('T')[0],
        exportCanvas.width - padding,
        exportCanvas.height - 20
      );

      // Convert to blob and download
      exportCanvas.toBlob((blob) => {
        if (!blob) {
          setIsExporting(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsExporting(false);
        onExportComplete?.();
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  }, [targetRef, isExporting, filename, onExportStart, onExportComplete]);

  return (
    <>
      {/* Camera Flash Overlay */}
      {showFlash && (
        <div 
          className="fixed inset-0 z-50 pointer-events-none"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            animation: 'flash 150ms ease-out',
          }}
        />
      )}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`
          ${sizeStyles[size]}
          rounded-lg flex items-center justify-center
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        style={{
          backgroundColor: isExporting ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${isExporting ? THEME.colors.primary : 'rgba(255, 255, 255, 0.1)'}`,
          color: isExporting ? THEME.colors.primary : 'rgba(255, 255, 255, 0.6)',
          transitionTimingFunction: THEME.animation.curve,
        }}
        title="Export as Image (Studio Mode)"
      >
        {isExporting ? (
          <div 
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          />
        ) : (
          <CameraIcon size={iconSizes[size]} />
        )}
      </button>

      {/* Inline keyframes for flash animation */}
      <style>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  );
};

export default StudioExport;

