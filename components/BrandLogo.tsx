import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

/**
 * Luminous Harmonics Brand Logo
 * Custom SVG logo with cyberpunk/luminous aesthetic
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = '', 
  size = 36 
}) => {
  // Calculate width based on original aspect ratio (2304:1856 ≈ 1.24:1)
  const aspectRatio = 2304 / 1856;
  const width = size * aspectRatio;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 2304 1856"
      width={width}
      height={size}
      className={`brand-logo ${className}`}
      aria-label="Luminous Harmonics Logo"
    >
      {/* Main shape - uses currentColor for theming */}
      <path 
        fill="currentColor" 
        opacity="0.15"
        d="M1336 1858H2V2.2h2303.7V1858zm15-610.5c-.4 0-.8.2-2 .9-1 1-2 2-4.2 3.5l-.8 2-1.1.3q-.6.9-.9 1.9s0-.2-.9.2c-.3.6-.7 1.1-2.4 1.8l-17.4 14.4q11.9-4.5 22.9-10c2.3-1 5-2.2 6.6-4q14-17 27.6-34.1a87 87 0 0 0-23.3 19.4l-1.1 2.1h-1.3q-.5.9-.7 2.1z"
      />
      
      {/* Detail layers */}
      <g fill="currentColor" opacity="0.4">
        <path d="M1140 356c14.8 1.4 29.6 2.7 45.9 4.4 3.6 0 5.8-.1 8-.3 1 .1 2 .2 4 .8l9.5 3.2c5.7 2.3 11.5 3.6 17.4 1q1-.6 2-.4c11.2 1.9 22.4 3.8 33.3 7.6h-4.5c-2.6-.2-5.5-1.3-7.9-.6q-16 4.3-32.4.8c-2.2-.5-6.3 1.3-7.4 3.3-2.5 4.4 2 6.6 4.2 10q-5.5-3.2-11.2-6.1-8.5-4.5-14.9.7c-4.2 3.5-3.8 7.3.8 10.5 4.6 3.1 8.7 7.3 13.7 9.5 6.3 2.7 13.2 4 20 5.6q10.1 2.4 20.5 3.7c7.2.7 14.5.5 21.8.7 5 .1 10.1-.5 15 .5 8 1.7 16 3.8 24.5 2.3 3.9-.7 6.2 1.8 7.8 5 2.2 4.5 6 6.9 10.7 8.1 13 3.3 25.7 7 38.6 10.2 3.4.9 7.3 1.6 10.7 1 6.8-1.2 12.5.6 18.2 3.8 9 4.9 18.2 9.5 24.8 18.5-6.8-2.8-13.4-6-20.3-8.3-19.4-6.5-38.9-13.2-58.5-19q-24-6.7-48.3-11.8c-16.6-3.5-33.3-6.2-50-9.3q-20-4-40-7.4c-8-1.3-16.4-1.8-24.6-2.7q-3.9-.4-7.9-.6-12.8-.7-25.7-1.2-21.3-1.1-42.7-1.6c-7.2 0-14.5 1.4-21.7 1.7q-10.3.3-20.6-1.3c4.8-4.8 10-6 16.3-4.5a82 82 0 0 0 15.8 1.8c19.3.5 38.6 1.2 57.9.9a39 39 0 0 0 29.5-12.2c3-3.2 6.4-6 9.2-9.2 5.2-6 3.5-11.2-4.3-13.1-4.1-1-8.5-1.2-12.8-1.6-7.6-.7-15.2-1.3-23.6-2.6-.8-1-.8-1.4-.8-1.8"/>
      </g>

      <g fill="currentColor" opacity="0.6">
        <path d="M482.3 621.8q6.8 31.5 14 62.8 4.1 18.5 9 36.8c1.2 4.4 3 8.7 4.6 13 1.8 4.7 2.2 9-1.2 13.1s-7.8 3.8-12 2.8A26 26 0 0 1 480 740c-7.7-11.5-15-23-19.7-36.6q-8.3-24.6-13.8-49.6c-3.4-14.5-5.2-29.4-7.6-44-.2-1.3 0-2.6.2-4.9a29 29 0 0 1 9.1 25.6c-2.2 17.7 3.7 34.2 8.4 50.8 1.1 4 5.3 7.2 9 12l3 20.7c1.5 8.5 6.1 15.4 12 21.5 5.6 5.7 11.5 5 15.4-2 3.6-6.8 7-13.8 3.7-21.9-1.1-2.7-1.2-5.9-2-8.7-1.5-5.2-3.2-10.3-8.7-12.7a8.4 8.4 0 0 1-5-10.8c5.9-18.6-1-36.1-4-54 0-.7 0-1.3.5-2.7 1-.8 1.3-.8 1.7-.9"/>
      </g>

      {/* Core details - brightest */}
      <g fill="currentColor" opacity="0.85">
        <path d="M1647.2 1450.8c-4.6-3.1-5.7-6.5-.6-8.4 9.8-3.9 20-7 30-10.2 1.5-.5 3.3-.1 5 0 4.2.5 7.9 2 8.3 6.9q.6 6.9-5.9 9.3a56 56 0 0 1-36.8 2.4M1623 1456.8c-2.7-.8-4.6-1.6-7.6-2.7a26 26 0 0 1 17.2-6.5c2 0 5.2 2 5.8 3.9 1.2 3.2-2 4.5-4.7 4.9q-4.6.4-10.6.4M569.7 1484.1a17 17 0 0 1-3.2-7.4c2.5-1.5 4.5-3 6.6-3.2s4 .7 6 1.2c-.5 2.3-.3 5.2-1.7 6.7-1.6 1.7-4.6 2-7.7 2.7"/>
      </g>
    </svg>
  );
};

/**
 * Simplified geometric logo variant for small sizes
 * Better for favicon and very small displays
 */
export const BrandLogoSimple: React.FC<BrandLogoProps> = ({ 
  className = '', 
  size = 36 
}) => {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`brand-logo ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Luminous Harmonics Logo"
    >
      {/* Outer ring */}
      <circle
        cx="24"
        cy="24"
        r="22"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
      
      {/* Middle ring */}
      <circle
        cx="24"
        cy="24"
        r="16"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.6"
      />
      
      {/* Inner ring */}
      <circle
        cx="24"
        cy="24"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.8"
      />
      
      {/* Central dot */}
      <circle
        cx="24"
        cy="24"
        r="3"
        fill="currentColor"
      />
      
      {/* Sine wave */}
      <path
        d="M4 24 Q12 16, 20 24 T36 24 T44 24"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Cardinal points */}
      <circle cx="24" cy="8" r="2" fill="currentColor" opacity="0.7" />
      <circle cx="24" cy="40" r="2" fill="currentColor" opacity="0.7" />
      <circle cx="8" cy="24" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="40" cy="24" r="2" fill="currentColor" opacity="0.5" />
    </svg>
  );
};
