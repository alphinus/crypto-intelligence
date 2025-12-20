'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, GraduationCap, Briefcase } from 'lucide-react';
import { useHelp, HelpLevel } from './HelpProvider';
import { TOUR_STEPS, TourStep } from './tourSteps';

export function OnboardingTour() {
  const { showTour, endTour, level, setLevel } = useHelp();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[currentStep];
  const isLevelSelect = step?.id === 'level-select';
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  // Find and highlight target element
  const updateTargetRect = useCallback(() => {
    if (!step?.target) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);

      // Scroll into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setTargetRect(null);
    }
  }, [step?.target]);

  useEffect(() => {
    if (showTour) {
      updateTargetRect();
      window.addEventListener('resize', updateTargetRect);
      window.addEventListener('scroll', updateTargetRect);
    }

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect);
    };
  }, [showTour, currentStep, updateTargetRect]);

  // Reset step when tour starts
  useEffect(() => {
    if (showTour) {
      setCurrentStep(0);
    }
  }, [showTour]);

  const handleNext = () => {
    if (isLastStep) {
      endTour();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    endTour();
  };

  const handleLevelSelect = (selectedLevel: HelpLevel) => {
    setLevel(selectedLevel);
    handleNext();
  };

  if (!showTour || !step) return null;

  // Calculate popup position - always visible in viewport
  const getPopupStyle = (): React.CSSProperties => {
    const popupWidth = 340;
    const popupHeight = 280; // Estimated max height
    const padding = 20;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

    // Center position for steps without target
    if (!targetRect || step.position === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    // Calculate ideal position based on step.position
    let top: number;
    let left: number;

    switch (step.position) {
      case 'top':
        top = targetRect.top - popupHeight - padding;
        left = targetRect.left + targetRect.width / 2 - popupWidth / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - popupWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - popupHeight / 2;
        left = targetRect.left - popupWidth - padding;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - popupHeight / 2;
        left = targetRect.right + padding;
        break;
      default:
        top = viewportHeight / 2 - popupHeight / 2;
        left = viewportWidth / 2 - popupWidth / 2;
    }

    // CLAMP: Ensure popup stays within viewport bounds
    // Bottom boundary (leave space for avatar at bottom)
    const maxTop = viewportHeight - popupHeight - 100; // 100px buffer for avatar
    const minTop = padding;
    top = Math.max(minTop, Math.min(top, maxTop));

    // Horizontal boundaries
    const maxLeft = viewportWidth - popupWidth - padding;
    const minLeft = padding;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    return {
      position: 'fixed',
      top,
      left,
    };
  };

  return (
    <AnimatePresence>
      {showTour && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
          >
            {/* Dark overlay with spotlight cutout */}
            <div
              ref={spotlightRef}
              className="absolute inset-0 bg-black/70"
              style={
                targetRect
                  ? {
                      clipPath: `polygon(
                        0% 0%,
                        0% 100%,
                        ${targetRect.left - 8}px 100%,
                        ${targetRect.left - 8}px ${targetRect.top - 8}px,
                        ${targetRect.right + 8}px ${targetRect.top - 8}px,
                        ${targetRect.right + 8}px ${targetRect.bottom + 8}px,
                        ${targetRect.left - 8}px ${targetRect.bottom + 8}px,
                        ${targetRect.left - 8}px 100%,
                        100% 100%,
                        100% 0%
                      )`,
                    }
                  : undefined
              }
            />

            {/* Spotlight border */}
            {targetRect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute border-2 border-blue-400 rounded-lg pointer-events-none"
                style={{
                  left: targetRect.left - 8,
                  top: targetRect.top - 8,
                  width: targetRect.width + 16,
                  height: targetRect.height + 16,
                  boxShadow: '0 0 20px rgba(96, 165, 250, 0.5)',
                }}
              />
            )}
          </motion.div>

          {/* Popup */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed z-[101] w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
            style={getPopupStyle()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900/50 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <span className="font-medium text-white">{step.title}</span>
              </div>
              <button
                onClick={handleSkip}
                className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="Tour überspringen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {isLevelSelect ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-300 mb-4">{step.content}</p>
                  <button
                    onClick={() => handleLevelSelect('beginner')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      level === 'beginner'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <GraduationCap className="w-5 h-5 text-green-400" />
                    <div className="text-left">
                      <div className="font-medium text-white">Anfänger</div>
                      <div className="text-xs text-gray-400">Ich erkläre dir auch die Crypto-Basics</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleLevelSelect('pro')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      level === 'pro'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <Briefcase className="w-5 h-5 text-blue-400" />
                    <div className="text-left">
                      <div className="font-medium text-white">Profi</div>
                      <div className="text-xs text-gray-400">Nur App-Bedienung, keine Basics</div>
                    </div>
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-300">{step.content}</p>
                  {level === 'beginner' && step.beginnerContent && (
                    <p className="mt-3 text-xs text-blue-400 bg-blue-500/10 rounded-lg p-3">
                      📚 {step.beginnerContent}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!isLevelSelect && (
              <div className="flex items-center justify-between px-4 py-3 bg-gray-900/30 border-t border-gray-700">
                <div className="flex items-center gap-1">
                  {TOUR_STEPS.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentStep ? 'bg-blue-400' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {!isFirstStep && (
                    <button
                      onClick={handlePrev}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Zurück
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1 px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    {isLastStep ? 'Fertig!' : 'Weiter'}
                    {!isLastStep && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
