'use client';

import { useState } from 'react';
import { useTypewriter } from '@/hooks/useTypewriter';

interface AnimatedTextProps {
  /** Text to animate */
  text: string;
  /** Speed in ms per word (default: 50) */
  speed?: number;
  /** Delay before starting in ms (default: 0) */
  delay?: number;
  /** CSS class for container */
  className?: string;
  /** Show skip button */
  showSkip?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Skip animation (show full text immediately) */
  skip?: boolean;
  /** Show cursor while typing */
  showCursor?: boolean;
}

export function AnimatedText({
  text,
  speed = 50,
  delay = 0,
  className = '',
  showSkip = false,
  onComplete,
  skip = false,
  showCursor = true,
}: AnimatedTextProps) {
  const { displayText, isTyping, skipToEnd } = useTypewriter(text, {
    speed,
    delay,
    onComplete,
    skip,
  });

  return (
    <div className={className}>
      <span className="whitespace-pre-wrap">
        {displayText}
        {isTyping && showCursor && (
          <span className="animate-pulse text-yellow-400 ml-0.5">|</span>
        )}
      </span>

      {showSkip && isTyping && (
        <button
          onClick={skipToEnd}
          className="ml-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          (Skip)
        </button>
      )}
    </div>
  );
}

// Multi-section animated report component
interface AnimatedReportSection {
  label: string;
  text: string;
  icon?: React.ReactNode;
}

interface AnimatedReportProps {
  sections: AnimatedReportSection[];
  speed?: number;
  onComplete?: () => void;
}

export function AnimatedReport({ sections, speed = 40, onComplete }: AnimatedReportProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<number[]>([]);

  const handleSectionComplete = () => {
    setCompletedSections(prev => [...prev, currentSection]);
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1);
    } else {
      onComplete?.();
    }
  };

  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        const isCompleted = completedSections.includes(index);
        const isCurrent = currentSection === index;
        const shouldShow = isCompleted || isCurrent;

        if (!shouldShow) return null;

        return (
          <div key={index} className="space-y-1">
            {section.label && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                {section.icon}
                <span>{section.label}</span>
              </div>
            )}
            <AnimatedText
              text={section.text}
              speed={speed}
              skip={isCompleted}
              onComplete={isCurrent ? handleSectionComplete : undefined}
              className="text-gray-300 leading-relaxed"
              showCursor={isCurrent}
            />
          </div>
        );
      })}
    </div>
  );
}
