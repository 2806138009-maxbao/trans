import React, { useState } from 'react';
import { TiltCard } from './TiltCard';
import { SmithConceptVisualizer, SmithConcept } from './SmithConceptVisualizer';
import { THEME } from '../theme';

interface InteractiveRecapProps {
  bullets: string[];
  conceptMap?: SmithConcept[];
  disableTilt?: boolean;
}

// Default Map for Recap Section
const DEFAULT_CONCEPT_MAP: SmithConcept[] = [
  'none',         // 0
  'center',       // 1
  'edge',         // 2
  'inductive',    // 3
  'seriesL',      // 4
  'symmetry',     // 5
  'transmission', // 6
  'power'         // 7
];

export const InteractiveRecap: React.FC<InteractiveRecapProps> = ({ 
  bullets,
  conceptMap = DEFAULT_CONCEPT_MAP,
  disableTilt = false
}) => {
  const [activeConcept, setActiveConcept] = useState<SmithConcept>('none');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleMouseEnter = (index: number) => {
    setActiveIndex(index);
    const map = conceptMap;
    // Special handling for index 3 in default map
    if (map === DEFAULT_CONCEPT_MAP && index === 3) {
        setActiveConcept('inductive'); 
    } else {
        setActiveConcept(map[index] || 'none');
    }
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
    setActiveConcept('none');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left: Grid of Concept Cards */}
      <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {bullets.map((text, idx) => (
          <div
            key={idx}
            onMouseEnter={() => handleMouseEnter(idx)}
            onMouseLeave={handleMouseLeave}
            className="cursor-default"
          >
            <TiltCard 
                disabled={disableTilt}
                glowColor={activeIndex === idx ? THEME.colors.primary : 'rgba(255,255,255,0.1)'}
                className={`h-full transition-all duration-300 ${activeIndex === idx ? 'scale-[1.02]' : ''}`}
            >
              <div className="p-5 flex gap-4 h-full items-start">
                <span 
                    className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center transition-colors duration-300 ${
                        activeIndex === idx 
                            ? 'bg-[#FFC700] text-black' 
                            : 'bg-[#FFC700]/10 text-[#FFC700]'
                    }`}
                >
                  {idx + 1}
                </span>
                <span className={`text-sm leading-7 transition-colors duration-300 ${
                    activeIndex === idx ? 'text-white' : 'text-[#D0D6E0]'
                }`}>
                  {text}
                </span>
              </div>
            </TiltCard>
          </div>
        ))}
      </div>

      {/* Right: Sticky Visualizer - Void Style */}
      <div className="lg:col-span-5 hidden lg:block sticky top-24">
        <div className="pl-6 py-6 relative flex flex-col items-center justify-center aspect-square">
            {/* Left accent line */}
            <div 
              className="absolute top-0 bottom-0 left-0 w-0.5"
              style={{ backgroundColor: 'rgba(255, 199, 0, 0.3)' }}
            />
            
            <SmithConceptVisualizer concept={activeConcept} size={280} />
            
            <div className="mt-6 text-center min-h-[3rem]">
                <p className="text-[#FFC700] font-mono text-xs uppercase tracking-widest">
                    {activeConcept === 'none' ? 'HOVER TO VISUALIZE' : activeConcept.replace(/([A-Z])/g, ' $1').toUpperCase()}
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};




import { SmithConceptVisualizer, SmithConcept } from './SmithConceptVisualizer';
import { THEME } from '../theme';

interface InteractiveRecapProps {
  bullets: string[];
  conceptMap?: SmithConcept[];
  disableTilt?: boolean;
}

// Default Map for Recap Section
const DEFAULT_CONCEPT_MAP: SmithConcept[] = [
  'none',         // 0
  'center',       // 1
  'edge',         // 2
  'inductive',    // 3
  'seriesL',      // 4
  'symmetry',     // 5
  'transmission', // 6
  'power'         // 7
];

export const InteractiveRecap: React.FC<InteractiveRecapProps> = ({ 
  bullets,
  conceptMap = DEFAULT_CONCEPT_MAP,
  disableTilt = false
}) => {
  const [activeConcept, setActiveConcept] = useState<SmithConcept>('none');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleMouseEnter = (index: number) => {
    setActiveIndex(index);
    const map = conceptMap;
    // Special handling for index 3 in default map
    if (map === DEFAULT_CONCEPT_MAP && index === 3) {
        setActiveConcept('inductive'); 
    } else {
        setActiveConcept(map[index] || 'none');
    }
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
    setActiveConcept('none');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left: Grid of Concept Cards */}
      <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {bullets.map((text, idx) => (
          <div
            key={idx}
            onMouseEnter={() => handleMouseEnter(idx)}
            onMouseLeave={handleMouseLeave}
            className="cursor-default"
          >
            <TiltCard 
                disabled={disableTilt}
                glowColor={activeIndex === idx ? THEME.colors.primary : 'rgba(255,255,255,0.1)'}
                className={`h-full transition-all duration-300 ${activeIndex === idx ? 'scale-[1.02]' : ''}`}
            >
              <div className="p-5 flex gap-4 h-full items-start">
                <span 
                    className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center transition-colors duration-300 ${
                        activeIndex === idx 
                            ? 'bg-[#FFC700] text-black' 
                            : 'bg-[#FFC700]/10 text-[#FFC700]'
                    }`}
                >
                  {idx + 1}
                </span>
                <span className={`text-sm leading-7 transition-colors duration-300 ${
                    activeIndex === idx ? 'text-white' : 'text-[#D0D6E0]'
                }`}>
                  {text}
                </span>
              </div>
            </TiltCard>
          </div>
        ))}
      </div>

      {/* Right: Sticky Visualizer - Void Style */}
      <div className="lg:col-span-5 hidden lg:block sticky top-24">
        <div className="pl-6 py-6 relative flex flex-col items-center justify-center aspect-square">
            {/* Left accent line */}
            <div 
              className="absolute top-0 bottom-0 left-0 w-0.5"
              style={{ backgroundColor: 'rgba(255, 199, 0, 0.3)' }}
            />
            
            <SmithConceptVisualizer concept={activeConcept} size={280} />
            
            <div className="mt-6 text-center min-h-[3rem]">
                <p className="text-[#FFC700] font-mono text-xs uppercase tracking-widest">
                    {activeConcept === 'none' ? 'HOVER TO VISUALIZE' : activeConcept.replace(/([A-Z])/g, ' $1').toUpperCase()}
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
