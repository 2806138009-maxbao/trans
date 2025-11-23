
import React, { useEffect, useRef, useState } from 'react';
import { WaveType } from '../types';

// Declare KaTeX on window object since we are loading via CDN
declare global {
  interface Window {
    katex: any;
  }
}

interface FormulaDisplayProps {
  n: number;
  waveType: WaveType;
}

export const FormulaDisplay: React.FC<FormulaDisplayProps> = ({ n, waveType }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [katexLoaded, setKatexLoaded] = useState(false);

  // 1. DYNAMIC SCRIPT + CSS INJECTION (Robust loading)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Inject KaTeX CSS (prevents the fallback MathML line from showing)
    const cssHref = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css";
    let katexCss = document.querySelector(`link[href="${cssHref}"]`) as HTMLLinkElement;
    if (!katexCss) {
      katexCss = document.createElement('link');
      katexCss.rel = 'stylesheet';
      katexCss.href = cssHref;
      katexCss.crossOrigin = 'anonymous';
      document.head.appendChild(katexCss);
    }

    // Inject a high-quality math font to improve aesthetics
    const fontHref = "https://fonts.googleapis.com/css2?family=STIX+Two+Math&display=swap";
    let fontLink = document.querySelector(`link[href="${fontHref}"]`) as HTMLLinkElement;
    if (!fontLink) {
      fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = fontHref;
      document.head.appendChild(fontLink);
    }

    // Inject KaTeX JS
    if (window.katex) {
      setKatexLoaded(true);
      return;
    }

    const src = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js";
    let script = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
    }

    const handleLoad = () => setKatexLoaded(true);
    script.addEventListener('load', handleLoad);

    const interval = setInterval(() => {
      if (window.katex) {
        setKatexLoaded(true);
        clearInterval(interval);
      }
    }, 100);

    return () => {
      script.removeEventListener('load', handleLoad);
      clearInterval(interval);
    };
  }, []);

  // 2. Render Formula
  useEffect(() => {
    if (!containerRef.current || !katexLoaded || !window.katex) return;

    let latex = "";

    // Generate LaTeX string
    if (waveType === 'square') {
        latex = `f(t) \\approx \\frac{4}{\\pi} \\sum_{k=1}^{${n}} \\frac{\\sin((2k-1)t)}{2k-1}`;
    } else if (waveType === 'sawtooth') {
        latex = `f(t) \\approx \\frac{2}{\\pi} \\sum_{k=1}^{${n}} (-1)^{k+1} \\frac{\\sin(kt)}{k}`;
    } else if (waveType === 'triangle') {
        latex = `f(t) \\approx \\frac{8}{\\pi^2} \\sum_{k=1}^{${n}} (-1)^{k} \\frac{\\sin((2k-1)t)}{(2k-1)^2}`;
    }

    try {
        const html = window.katex.renderToString(latex, {
            throwOnError: false,
            displayMode: true,
            output: 'html',
            strict: false
        });

        // NUCLEAR OPTION: Parse HTML and remove the offending element before injection
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Remove MathML block
        const mathml = tempDiv.querySelector('.katex-mathml');
        if (mathml) {
            mathml.remove();
        }
        
        // Remove any other potential duplicates (just in case)
        const annotations = tempDiv.querySelectorAll('annotation');
        annotations.forEach(el => el.remove());

        containerRef.current.innerHTML = tempDiv.innerHTML;

    } catch (e) {
        console.error("KaTeX render error:", e);
    }

  }, [n, waveType, katexLoaded]);

  return (
    // Positioning: Center Horizontal
    <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-40 select-none pointer-events-none w-auto max-w-[95vw]">
        {/* Style Overrides */}
        <style>{`
            .katex {
                font-family: 'STIX Two Math', 'Times New Roman', serif !important;
                font-size: 1.6em !important;
                text-shadow: 0 0 16px rgba(255, 255, 255, 0.25);
            }
            .katex, .katex .mathnormal, .katex .mord, .katex .mbin, .katex .mrel, .katex .mopen, .katex .mclose, .katex .mpunct, .katex .mop {
                color: #FFFFFF !important;
            }
            .katex-display {
                margin: 0 !important;
            }
            /* 
               CRITICAL FIX: 
               Force hide the MathML block. 
               This removes the ugly duplicate text below the formula.
            */
            .katex-mathml, .katex .katex-mathml {
                display: none !important;
                position: absolute !important;
                clip: rect(1px, 1px, 1px, 1px) !important;
                padding: 0 !important;
                border: 0 !important;
                height: 1px !important;
                width: 1px !important;
                overflow: hidden !important;
            }
        `}</style>

        {/* Container */}
        <div className="relative p-6 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-[20px] shadow-[0_0_40px_rgba(0,0,0,0.3)] overflow-hidden min-w-[320px] flex flex-col items-center">
            
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

            <div className="relative flex flex-col gap-2 w-full">
                {/* Header */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 bg-[#5E6AD2] rounded-full animate-pulse shadow-[0_0_8px_#5E6AD2]" />
                    <span className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase bg-gradient-to-r from-[#5E6AD2] to-[#479CFF] bg-clip-text text-transparent">
                        APPROXIMATION
                    </span>
                </div>

                {/* Formula Area */}
                <div ref={containerRef} className="min-h-[50px] flex items-center justify-center px-4 py-2">
                   {!katexLoaded && (
                       <span className="text-xs font-mono text-white/40 animate-pulse">
                           [ INITIALIZING KERNEL ]
                       </span>
                   )}
                </div>
            </div>
        </div>
    </div>
  );
};
