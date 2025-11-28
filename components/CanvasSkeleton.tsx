import React from 'react';

interface CanvasSkeletonProps {
  height?: string;
  className?: string;
}

export const CanvasSkeleton: React.FC<CanvasSkeletonProps> = ({
  height = 'h-[400px]',
  className = '',
}) => {
  return (
    <div className={`relative ${height} ${className} rounded-xl overflow-hidden`}>
      {/* Base Background */}
      <div className="absolute inset-0 bg-[#0B0C0E]" />
      
      {/* Shimmer Effect */}
      <div className="absolute inset-0 skeleton-canvas" />
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        {/* Animated Circles */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border border-white/10 animate-ping" 
               style={{ animationDuration: '2s' }} />
          <div className="absolute inset-2 rounded-full border border-white/10 animate-ping" 
               style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
          <div className="absolute inset-4 rounded-full border border-white/10 animate-ping" 
               style={{ animationDuration: '2s', animationDelay: '0.6s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#5E6AD2] animate-pulse" />
          </div>
        </div>
        
        {/* Loading Text */}
        <div className="flex items-center gap-2 text-[#8A8F98] text-sm">
          <div className="w-4 h-4 border-2 border-[#5E6AD2] border-t-transparent rounded-full animate-spin" />
          <span className="animate-pulse">Loading visualization...</span>
        </div>
      </div>
      
      {/* Grid Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
};

/**
 * 带加载状态的 Canvas 包装器
 */
interface CanvasWithLoadingProps {
  isLoading: boolean;
  height?: string;
  className?: string;
  children: React.ReactNode;
}

export const CanvasWithLoading: React.FC<CanvasWithLoadingProps> = ({
  isLoading,
  height = 'h-[400px]',
  className = '',
  children,
}) => {
  return (
    <div className={`relative ${height} ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10">
          <CanvasSkeleton height="h-full" />
        </div>
      )}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
    </div>
  );
};


