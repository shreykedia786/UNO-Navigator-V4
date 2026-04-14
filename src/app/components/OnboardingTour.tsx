import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles, ChevronRight } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string; // CSS selector to find the element
  position: 'top' | 'bottom' | 'left' | 'right';
  highlightPadding?: number;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Unlock Smarter Pricing Insights',
    description: 'We\'ve introduced powerful new tools to help you stay competitive and maintain rate consistency across channels.',
    targetSelector: '', // Centered modal
    position: 'bottom',
    highlightPadding: 0
  },
  {
    id: 'find-it',
    title: 'Open a rate plan',
    description: 'Click the chevron beside a plan name.',
    targetSelector: '[data-tour="rate-plan-chevron"]',
    position: 'right',
    highlightPadding: 8
  },
  {
    id: 'competitor-graph',
    title: 'Competitor Rate Analysis at a Glance',
    description: 'Each column shows min–max competitor pricing and where your rate sits for that day.',
    targetSelector: '[data-tour="rate-chart"]',
    position: 'right',
    highlightPadding: 8
  },
  {
    id: 'parity-colors',
    title: 'Parity Status Indicators',
    description: 'Background colors show how your rates compare with OTA channels.',
    targetSelector: '[data-tour="rate-chart"]',
    position: 'right',
    highlightPadding: 8
  },
  {
    id: 'drawer-preview',
    title: 'View Detailed Analysis',
    description: 'Click "View Details" to explore:',
    targetSelector: '[data-tour="view-details-button"]',
    position: 'right',
    highlightPadding: 8
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
  onStepChange?: (stepIndex: number) => void;
}

export function OnboardingTour({ onComplete, onStepChange }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState({ top: 0 });
  const [highlightRect, setHighlightRect] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const step = ONBOARDING_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isCenterModal = !step.targetSelector; // Check if this should be a centered modal

  const getTooltipWidth = (stepIndex: number) => {
    if (stepIndex === 2) return 332; // Competitor chart — same grid width as parity
    if (stepIndex === 3) return 332;
    return 360;
  };

  const getTooltipHeight = () => {
    if (currentStep === 0) return 280;
    if (currentStep === 1) return 300;
    if (currentStep === 2) return 300; // Horizontal 3-col — shorter for small viewports / CTAs
    if (currentStep === 3) return 340;
    return 260;
  };

  // Find target element and calculate position
  useEffect(() => {
    // Notify parent about step change
    onStepChange?.(currentStep);

    // If it's a center modal (no target selector), show immediately
    if (isCenterModal) {
      setTargetElement(null);
      setIsVisible(true);
      return;
    }

    const findTarget = () => {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      if (element) {
        setTargetElement(element);
        calculatePosition(element);
        setIsVisible(true);
      } else {
        // Retry after a short delay if element not found
        setTimeout(findTarget, 100);
      }
    };

    findTarget();

    // Recalculate on scroll or resize
    const handleUpdate = () => {
      if (targetElement) {
        calculatePosition(targetElement);
      }
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [currentStep, step.targetSelector, targetElement, isCenterModal]);

  const calculatePosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = getTooltipWidth(currentStep);
    const tooltipHeight = getTooltipHeight();
    const padding = 20;

    // Update highlight rect here
    const currentHighlightRect = element.getBoundingClientRect();
    setHighlightRect(currentHighlightRect);

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'bottom':
        top = currentHighlightRect.bottom + padding;
        left = currentHighlightRect.left + currentHighlightRect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = currentHighlightRect.top - tooltipHeight - padding;
        left = currentHighlightRect.left + currentHighlightRect.width / 2 - tooltipWidth / 2;
        break;
      case 'right':
        // Check if tooltip would overflow on the right
        const rightPosition = currentHighlightRect.right + padding;
        if (rightPosition + tooltipWidth > window.innerWidth - 20) {
          // Position on the left instead
          left = currentHighlightRect.left - tooltipWidth - padding;
        } else {
          left = rightPosition;
        }

        // Calculate ideal position - center the arrow on the highlighted element
        // Arrow will be at position 95px from tooltip top (to stay on white background)
        // So we need: top + 95 = highlightCenter
        const highlightCenter = currentHighlightRect.top + currentHighlightRect.height / 2;
        let idealTop = highlightCenter - 95;

        // Chart + parity share `rate-chart` — keep the same high placement so Next/CTAs stay in view on short viewports.
        // Do not push parity down; adjust the arrow only for parity (see arrowTop below).
        if (currentStep === 2 || currentStep === 3) {
          idealTop = Math.min(idealTop, 330);
        }

        if (currentStep === 4) {
          idealTop = idealTop - 100;
        }

        // Apply the ideal position with bounds checking
        top = idealTop;

        // Ensure it doesn't go off screen
        if (top + tooltipHeight > window.innerHeight - 20) {
          top = window.innerHeight - tooltipHeight - 20;
        }
        if (top < 40) {
          top = 40;
        }
        break;
      case 'left':
        left = currentHighlightRect.left - tooltipWidth - padding;

        // Calculate ideal position - center the arrow on the highlighted element
        const highlightCenterLeft = currentHighlightRect.top + currentHighlightRect.height / 2;
        const idealTopLeft = highlightCenterLeft - 95;

        // Apply the ideal position with bounds checking
        top = idealTopLeft;

        if (top + tooltipHeight > window.innerHeight - 20) {
          top = window.innerHeight - tooltipHeight - 20;
        }
        if (top < 40) {
          top = 40;
        }
        break;
    }

    // Keep tooltip within viewport horizontally
    left = Math.max(20, Math.min(left, window.innerWidth - tooltipWidth - 20));

    setTooltipPosition({ top, left });

    // Calculate arrow position for right/left positioned tooltips
    if (step.position === 'right' || step.position === 'left') {
      // Calculate where the arrow should point to align with the highlighted element
      const highlightCenter = currentHighlightRect.top + currentHighlightRect.height / 2;
      let arrowTop = highlightCenter - top;

      // Parity step (index 3): nudge arrow only — popup stays high for small screens; moving the card down hides CTAs.
      if (currentStep === 3) {
        arrowTop += 28;
      }
      // Drawer step — align to View Details control
      if (currentStep === 4) {
        arrowTop += 75;
      }

      // Constrain arrow to the white body; step 2 (chevron) uses a smaller floor so the pointer can align with a small target
      const minArrowTop = currentStep === 1 ? 72 : 95;
      const maxArrowTop = tooltipHeight - 30;
      const constrainedArrowTop = Math.max(minArrowTop, Math.min(arrowTop, maxArrowTop));

      setArrowPosition({ top: constrainedArrowTop });
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 200);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
      }, 200);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
      localStorage.setItem('onboardingTourCompleted', 'true');
    }, 200);
  };

  if (!targetElement && !isCenterModal) return null;

  const focusPad = step.highlightPadding ?? 8;
  const focusLeft = highlightRect.left - focusPad;
  const focusTop = highlightRect.top - focusPad;
  const focusW = highlightRect.width + focusPad * 2;
  const focusH = highlightRect.height + focusPad * 2;
  const focusRight = focusLeft + focusW;
  const focusBottom = focusTop + focusH;
  // Single dim layer with a true cut-out so the target is not washed by a second overlay (even-odd hole).
  const spotlightClipPath = `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${focusLeft}px ${focusTop}px, ${focusLeft}px ${focusBottom}px, ${focusRight}px ${focusBottom}px, ${focusRight}px ${focusTop}px, ${focusLeft}px ${focusTop}px)`;

  return (
    <>
      {isCenterModal ? (
        <div
          className="fixed inset-0 z-[9998] bg-black/60 transition-opacity duration-300"
          style={{ opacity: isVisible ? 1 : 0 }}
        />
      ) : (
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/[0.52] transition-opacity duration-300 pointer-events-auto"
            style={{
              opacity: isVisible ? 1 : 0,
              clipPath: spotlightClipPath
            }}
            aria-hidden
          />
          <div
            className="fixed z-[9999] pointer-events-none transition-all duration-300 rounded-xl border-[3px] border-white bg-transparent shadow-[0_0_0_1px_rgba(39,83,235,0.65),0_0_32px_rgba(39,83,235,0.45),0_0_80px_rgba(39,83,235,0.12)]"
            style={{
              top: focusTop,
              left: focusLeft,
              width: focusW,
              height: focusH,
              opacity: isVisible ? 1 : 0
            }}
          />
        </>
      )}

      {/* Tooltip */}
      <div
        className={`fixed z-[10000] bg-white rounded-xl transition-all duration-300 ${
          currentStep === 2 || currentStep === 3
            ? 'shadow-[0_22px_50px_-12px_rgba(15,23,42,0.18)] ring-1 ring-[#2753eb]/12'
            : 'shadow-2xl ring-1 ring-black/[0.04]'
        }`}
        style={
          isCenterModal
            ? {
                top: '50%',
                left: '50%',
                transform: isVisible ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.95)',
                width: '420px',
                opacity: isVisible ? 1 : 0
              }
            : {
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                width: `${getTooltipWidth(currentStep)}px`,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'scale(1)' : 'scale(0.95)'
              }
        }
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#2753eb] to-[#4f46e5] text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold leading-tight mb-1">{step.title}</h3>
                <p className="text-[11px] text-white/80">
                  Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleComplete}
              className="text-white/80 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {step.description ? (
            <p
              className={`text-[13px] leading-relaxed ${currentStep === 1 ? 'text-gray-800 font-medium' : 'text-gray-700'}`}
            >
              {step.description}
            </p>
          ) : null}

          {/* Visual Illustration for Welcome */}
          {currentStep === 0 && (
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  
                  <div>
                    <div className="text-[11px] font-bold text-blue-900 mb-1">Competitor Rate Analysis</div>
                    <p className="text-[10px] text-gray-700 leading-relaxed">
                      Compare your pricing with competitors and spot revenue opportunities.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  
                  <div>
                    <div className="text-[11px] font-bold text-green-900 mb-1">Channel Parity Analysis</div>
                    <p className="text-[10px] text-gray-700 leading-relaxed">
                      Monitor OTA rates and maintain consistency across all channels.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Parity legend — distinct from chart step: compact grid, flat fills, brand accent */}
          {currentStep === 3 && (
            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2753eb] mb-2.5">
                Parity grid
              </p>
              <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-emerald-200/90 bg-emerald-50/90 px-2 py-2.5 text-center">
                    <div className="mx-auto h-1.5 w-full max-w-[56px] rounded-full bg-emerald-400" />
                    <p className="mt-2 text-[11px] font-bold text-gray-900">Meet</p>
                    <p className="mt-0.5 text-[9px] leading-snug text-gray-600">Rates match</p>
                  </div>
                  <div className="rounded-lg border border-orange-200/90 bg-orange-50/90 px-2 py-2.5 text-center">
                    <div className="mx-auto h-1.5 w-full max-w-[56px] rounded-full bg-orange-400" />
                    <p className="mt-2 text-[11px] font-bold text-gray-900">Win</p>
                    <p className="mt-0.5 text-[9px] leading-snug text-gray-600">OTA higher</p>
                  </div>
                  <div className="rounded-lg border border-red-200/90 bg-red-50/90 px-2 py-2.5 text-center">
                    <div className="mx-auto h-1.5 w-full max-w-[56px] rounded-full bg-red-400" />
                    <p className="mt-2 text-[11px] font-bold text-gray-900">Loss</p>
                    <p className="mt-0.5 text-[9px] leading-snug text-gray-600">OTA lower</p>
                  </div>
                </div>
                <p className="mt-3 text-[10px] leading-relaxed text-gray-600 border-t border-slate-100 pt-3">
                  Cell backgrounds mirror these states so you can scan parity issues in seconds.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: chevron target — minimal copy; spotlight + arrow aim at real chevron */}
          {currentStep === 1 && (
            <div className="mt-4">
              <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/80 shadow-sm">
                <div className="flex items-center gap-3 px-3 py-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#2753eb]/30 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                    aria-hidden
                  >
                    <ChevronRight className="h-5 w-5 text-[#2753eb]" strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold tracking-tight text-gray-900">Expand this row</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-gray-600">
                      Unlocks <span className="font-medium text-gray-800">Competitor & Parity</span> for that plan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 of 5 — competitor chart: horizontal grid + SVGs matching RateCandlestickChart (spine, T-bars, blue dot + ties) */}
          {currentStep === 2 && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2753eb] mb-2">
                Competitor range
              </p>
              <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="rounded-lg border border-emerald-200/90 bg-emerald-50/90 px-1.5 py-2 text-center">
                    <svg viewBox="0 0 28 36" className="mx-auto h-10 w-8" aria-hidden>
                      <line
                        x1="14"
                        y1="10"
                        x2="14"
                        y2="30"
                        stroke="#90a4ae"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="7"
                        y1="10"
                        x2="21"
                        y2="10"
                        stroke="#4caf50"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                      <circle cx="14" cy="10" r="2.8" fill="#4caf50" stroke="#fff" strokeWidth="1.2" />
                    </svg>
                    <p className="mt-1.5 text-[11px] font-bold text-gray-900">Max</p>
                    <p className="mt-0.5 text-[9px] leading-tight text-gray-600">OTA high</p>
                  </div>
                  <div className="rounded-lg border border-blue-200/90 bg-blue-50/90 px-1.5 py-2 text-center">
                    <svg viewBox="0 0 28 36" className="mx-auto h-10 w-8" aria-hidden>
                      <line
                        x1="14"
                        y1="8"
                        x2="14"
                        y2="30"
                        stroke="#90a4ae"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="2"
                        y1="18"
                        x2="10"
                        y2="18"
                        stroke="#2196F3"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <line
                        x1="18"
                        y1="18"
                        x2="26"
                        y2="18"
                        stroke="#2196F3"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle cx="14" cy="18" r="3.6" fill="#2196F3" stroke="#fff" strokeWidth="1.8" />
                    </svg>
                    <p className="mt-1.5 text-[11px] font-bold text-gray-900">Yours</p>
                    <p className="mt-0.5 text-[9px] leading-tight text-gray-600">On spine</p>
                  </div>
                  <div className="rounded-lg border border-red-200/90 bg-red-50/90 px-1.5 py-2 text-center">
                    <svg viewBox="0 0 28 36" className="mx-auto h-10 w-8" aria-hidden>
                      <line
                        x1="14"
                        y1="8"
                        x2="14"
                        y2="28"
                        stroke="#90a4ae"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="7"
                        y1="28"
                        x2="21"
                        y2="28"
                        stroke="#f44336"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                      <circle cx="14" cy="28" r="2.8" fill="#f44336" stroke="#fff" strokeWidth="1.2" />
                    </svg>
                    <p className="mt-1.5 text-[11px] font-bold text-gray-900">Min</p>
                    <p className="mt-0.5 text-[9px] leading-tight text-gray-600">OTA low</p>
                  </div>
                </div>
                <p className="mt-2 text-[10px] leading-snug text-gray-600 border-t border-slate-100 pt-2">
                  Same as the chart: vertical range line, green/red caps, blue dot with horizontal ties across dates.
                </p>
              </div>
            </div>
          )}

          {/* Visual Illustration for Drawer Preview */}
          {currentStep === 4 && (
            <div className="mt-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[11px] text-blue-600 mt-0.5">•</span>
                  <p className="text-[11px] text-gray-700 leading-relaxed">
                    <strong>Rate comparison</strong> with each competitor
                  </p>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[11px] text-blue-600 mt-0.5">•</span>
                  <p className="text-[11px] text-gray-700 leading-relaxed">
                    <strong>Parity</strong> across connected channels (OTAs)
                  </p>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[11px] text-blue-600 mt-0.5">•</span>
                  <p className="text-[11px] text-gray-700 leading-relaxed">
                    <strong>Win / Meet / Loss</strong> performance by date
                  </p>
                </li>
              </ul>
            </div>
          )}

          {/* Progress indicators */}
          <div className="flex items-center gap-1.5 mt-5 mb-4">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: index === currentStep ? '#2753eb' : index < currentStep ? '#2753eb80' : '#e5e7eb'
                }}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleSkip}
              className="text-[13px] text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-[#2753eb] hover:bg-[#1e3db8] rounded-lg transition-colors"
              >
                {isLastStep ? 'Finish' : 'Next'}
                {!isLastStep && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Arrow pointer — vertical position targets highlight center (chevron on step 2) */}
        {!isCenterModal && step.position === 'bottom' && (
          <div
            className="absolute -top-2 w-4 h-4 bg-white"
            style={{
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)'
            }}
          />
        )}
        {!isCenterModal && step.position === 'top' && (
          <div
            className="absolute -bottom-2 w-4 h-4 bg-white"
            style={{
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)'
            }}
          />
        )}
        {!isCenterModal && step.position === 'right' && (
          <div
            className="absolute -left-2 h-4 w-4 bg-white"
            style={{
              top: arrowPosition.top,
              transform: 'translateY(-50%) rotate(45deg)'
            }}
          />
        )}
        {!isCenterModal && step.position === 'left' && (
          <div
            className="absolute -right-2 w-4 h-4 bg-white"
            style={{
              top: arrowPosition.top,
              transform: 'rotate(45deg)'
            }}
          />
        )}
      </div>
    </>
  );
}