import { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  BarChart3,
  Scale
} from 'lucide-react';
import { LegendIconMax, LegendIconMin, LegendIconMyRate } from './CompetitorChartLegendIcons';

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
    description: 'Understand your pricing and stay competitive across channels.',
    targetSelector: '', // Centered modal
    position: 'bottom',
    highlightPadding: 0
  },
  {
    id: 'find-it',
    title: 'Open a room type',
    description: 'Expand a room to see rates and the room-level competitor chart (cheapest rate plan per day).',
    targetSelector: '[data-tour="room-chevron"]',
    position: 'right',
    highlightPadding: 8
  },
  {
    id: 'competitor-graph',
    title: 'Competitor spread at room level',
    description: 'Each column uses competitors’ cheapest rate plan for that room; your blue line is your cheapest rate that day. Hover for rate plan and channel.',
    targetSelector: '[data-tour="rate-chart"]',
    position: 'right',
    highlightPadding: 8
  },
  {
    id: 'parity-colors',
    title: 'Parity',
    description: 'Column tint reflects how your cheapest rate compares to the competitor spread (not rate-plan parity).',
    targetSelector: '[data-tour="rate-chart"]',
    position: 'right',
    highlightPadding: 8
  },
  {
    id: 'drawer-preview',
    title: 'View Detailed Analysis',
    description: 'Opens the panel with two tabs—Competitor Rate Analysis and Parity Analysis.',
    targetSelector: '[data-tour="view-details-button"]',
    position: 'right',
    highlightPadding: 8
  }
];

/** Not subscribed / limited demo: welcome + locked chart snapshot with hotspots. */
const LIMITED_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome-limited',
    title: 'Navigator intelligence preview',
    description:
      "You're seeing a preview of competitor pricing and parity insights. Start your free trial from the top banner to unlock full access.",
    targetSelector: '',
    position: 'bottom',
    highlightPadding: 0
  },
  {
    id: 'expand-room-limited',
    title: 'Expand this room',
    description: 'Tap the chevron to open the row. You will see a Navigator snapshot with competitor rate comparison.',
    targetSelector: '[data-tour="room-chevron-icon"]',
    position: 'right',
    highlightPadding: 6
  }
];

export const ONBOARDING_STORAGE_KEYS = {
  full: 'onboardingTourCompleted',
  limited: 'onboardingLimitedTourCompleted'
} as const;

export type OnboardingTourVariant = 'full' | 'limited';

interface OnboardingTourProps {
  onComplete: () => void;
  onStepChange?: (stepIndex: number) => void;
  variant?: OnboardingTourVariant;
}

const chartStyleTooltipIds = new Set(['competitor-graph', 'parity-colors', 'drawer-preview']);

export function OnboardingTour({ onComplete, onStepChange, variant = 'full' }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState({ top: 0 });
  /** When true, pointer is on the left edge of the tooltip (tooltip sits to the right of the target). When false, tooltip flipped left of target — pointer on right edge. */
  const [tooltipArrowOnLeft, setTooltipArrowOnLeft] = useState(true);
  const [highlightRect, setHighlightRect] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const steps = useMemo(
    () => (variant === 'limited' ? LIMITED_ONBOARDING_STEPS : ONBOARDING_STEPS),
    [variant]
  );

  useEffect(() => {
    setCurrentStep(0);
    setIsVisible(false);
  }, [variant]);

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const isCenterModal = !step.targetSelector; // Check if this should be a centered modal
  const isWelcomeStep = step.id === 'welcome' || step.id === 'welcome-limited';

  const getTooltipWidth = (s: OnboardingStep) => {
    if (s.id === 'competitor-graph' || s.id === 'parity-colors' || s.id === 'drawer-preview') return 332;
    return 360;
  };

  const getTooltipHeight = () => {
    if (isWelcomeStep) return step.id === 'welcome-limited' ? 430 : 460;
    if (step.id === 'find-it') return 320;
    if (step.id === 'expand-room-limited') return 220;
    if (step.id === 'competitor-graph') return 300;
    if (step.id === 'parity-colors') return 340;
    if (step.id === 'drawer-preview') return 335;
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
    const tooltipWidth = getTooltipWidth(step);
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
      case 'right': {
        // Check if tooltip would overflow on the right
        const rightPosition = currentHighlightRect.right + padding;
        if (rightPosition + tooltipWidth > window.innerWidth - 20) {
          // Tooltip on the left of the target — arrow must sit on the right edge of the tooltip
          left = currentHighlightRect.left - tooltipWidth - padding;
          setTooltipArrowOnLeft(false);
        } else {
          left = rightPosition;
          setTooltipArrowOnLeft(true);
        }

        // Calculate ideal position - center the arrow on the highlighted element
        // Arrow will be at position 95px from tooltip top (to stay on white background)
        // So we need: top + 95 = highlightCenter
        const highlightCenter = currentHighlightRect.top + currentHighlightRect.height / 2;
        let idealTop = highlightCenter - 95;

        // Chart + parity share `rate-chart` — keep the same high placement so Next/CTAs stay in view on short viewports.
        // Do not push parity down; adjust the arrow only for parity (see arrowTop below).
        if (step.id === 'competitor-graph' || step.id === 'parity-colors') {
          idealTop = Math.min(idealTop, 330);
        }
        // Drawer step: keep tooltip higher so footer CTAs stay on-screen on small viewports
        if (step.id === 'drawer-preview') {
          idealTop = Math.min(idealTop, 228);
        }

        // Apply the ideal position with bounds checking
        top = idealTop;

        const bottomInset = step.id === 'drawer-preview' ? 72 : 20;
        if (top + tooltipHeight > window.innerHeight - bottomInset) {
          top = window.innerHeight - tooltipHeight - bottomInset;
        }
        if (top < 40) {
          top = 40;
        }
        break;
      }
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

      if (step.id === 'parity-colors') {
        arrowTop += 28;
      }
      const minArrowTop =
        step.id === 'find-it' || step.id === 'drawer-preview' || step.id === 'expand-room-limited' ? 72 : 95;
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
      const key = variant === 'limited' ? ONBOARDING_STORAGE_KEYS.limited : ONBOARDING_STORAGE_KEYS.full;
      localStorage.setItem(key, 'true');
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
          chartStyleTooltipIds.has(step.id)
            ? 'shadow-[0_22px_50px_-12px_rgba(15,23,42,0.18)] ring-1 ring-[#2753eb]/12'
            : 'shadow-2xl ring-1 ring-black/[0.04]'
        }`}
        style={
          isCenterModal
            ? {
                top: '50%',
                left: '50%',
                transform: isVisible ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.95)',
                width: isWelcomeStep ? 'min(460px, calc(100vw - 2rem))' : '420px',
                maxWidth: isWelcomeStep ? '460px' : undefined,
                opacity: isVisible ? 1 : 0
              }
            : {
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                width: `${getTooltipWidth(step)}px`,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'scale(1)' : 'scale(0.95)'
              }
        }
      >
        {/* Header — same blue bar as all other onboarding steps */}
        <div className="relative bg-gradient-to-r from-[#2753eb] to-[#4f46e5] text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold leading-tight mb-1">{step.title}</h3>
                <p className="text-[11px] text-white/80">
                  Step {currentStep + 1} of {steps.length}
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
        <div
          className={`px-6 ${
            isWelcomeStep ? 'py-5 pb-5' : step.id === 'drawer-preview' ? 'pt-4 pb-4' : 'py-5'
          }`}
        >
          {!isWelcomeStep && step.description ? (
            <p
              className={`text-[13px] leading-relaxed ${
                step.id === 'find-it' || step.id === 'expand-room-limited' ? 'text-gray-800 font-medium' : 'text-gray-700'
              }`}
            >
              {step.description}
            </p>
          ) : null}

          {/* Welcome — feature spotlight */}
          {isWelcomeStep && (
            <div className="space-y-4">
              <p className="text-[13px] leading-relaxed text-slate-600">{step.description}</p>
              <div className="grid gap-3">
                {step.id === 'welcome-limited' ? (
                  <>
                    <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
                      <div className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2753eb] ring-1 ring-blue-200/70">
                          <BarChart3 className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] leading-relaxed text-slate-700">
                            Compare your rates with competitors across dates to identify pricing gaps.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
                      <div className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80">
                          <Scale className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] leading-relaxed text-slate-700">
                            Track where you win, meet, or lose across OTAs.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
                      <div className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2753eb] ring-1 ring-blue-200/70">
                          <BarChart3 className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-bold leading-snug text-slate-900">
                            Competitor rate insights
                          </h4>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                            See how your rates compare with competitors across dates.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
                      <div className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80">
                          <Scale className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-bold leading-snug text-slate-900">
                            Channel parity insights
                          </h4>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                            Track where you win, match, or lose across OTAs.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <p className="text-center text-[10px] leading-snug text-slate-400">
                {steps.length <= 2 ? '~30 seconds' : '~1 minute'} · {steps.length} quick step{steps.length === 1 ? '' : 's'}
              </p>
            </div>
          )}

          {/* Parity legend — distinct from chart step: compact grid, flat fills, brand accent */}
          {step.id === 'parity-colors' && (
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
          {step.id === 'find-it' && (
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

          {/* Competitor chart: horizontal grid + SVGs matching RateCandlestickChart */}
          {step.id === 'competitor-graph' && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2753eb] mb-2">
                Competitor range
              </p>
              <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="rounded-lg border border-red-200/90 bg-red-50/90 px-1.5 py-2 text-center">
                    <LegendIconMax className="mx-auto h-10 w-8" />
                    <p className="mt-1.5 text-[11px] font-bold text-gray-900">Max</p>
                    <p className="mt-0.5 text-[9px] leading-tight text-gray-600">OTA high</p>
                  </div>
                  <div className="rounded-lg border border-blue-200/90 bg-blue-50/90 px-1.5 py-2 text-center">
                    <LegendIconMyRate className="mx-auto h-10 w-8" />
                    <p className="mt-1.5 text-[11px] font-bold text-gray-900">Yours</p>
                    <p className="mt-0.5 text-[9px] leading-tight text-gray-600">On spine</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200/90 bg-emerald-50/90 px-1.5 py-2 text-center">
                    <LegendIconMin className="mx-auto h-10 w-8" />
                    <p className="mt-1.5 text-[11px] font-bold text-gray-900">Min</p>
                    <p className="mt-0.5 text-[9px] leading-tight text-gray-600">OTA low</p>
                  </div>
                </div>
                <p className="mt-2 text-[10px] leading-snug text-gray-600 border-t border-slate-100 pt-2">
                  Same as the chart: vertical range line, min in green and max in red, blue dot with horizontal ties
                  across dates.
                </p>
              </div>
            </div>
          )}

          {/* Step 5 of 5 — matches DetailedCompetitorModal tabs (compact for small viewports) */}
          {step.id === 'drawer-preview' && (
            <div className="mt-3">
              <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <div className="space-y-1.5">
                  <div className="flex gap-2.5 rounded-lg border border-slate-100 bg-slate-50/70 px-2 py-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[#2753eb] ring-1 ring-blue-100">
                      <BarChart3 className="h-3.5 w-3.5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-900 leading-tight">Competitor Rate Analysis</p>
                      <p className="mt-0.5 text-[9px] leading-snug text-slate-600">
                        Track pricing against individual competitors and avg. compset rates.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 rounded-lg border border-slate-100 bg-slate-50/70 px-2 py-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                      <Scale className="h-3.5 w-3.5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-900 leading-tight">Parity Analysis</p>
                      <p className="mt-0.5 text-[9px] leading-snug text-slate-600">
                        Quickly see where you win, meet, or lose with detailed OTA-level insights.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress indicators */}
          <div
            className={`flex items-center gap-1.5 mb-4 ${step.id === 'drawer-preview' ? 'mt-4' : 'mt-5'}`}
          >
            {steps.map((_, index) => (
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
        {!isCenterModal && step.position === 'right' && tooltipArrowOnLeft && (
          <div
            className="absolute -left-2 h-4 w-4 bg-white"
            style={{
              top: arrowPosition.top,
              transform: 'translateY(-50%) rotate(45deg)'
            }}
          />
        )}
        {!isCenterModal && step.position === 'right' && !tooltipArrowOnLeft && (
          <div
            className="absolute -right-2 h-4 w-4 bg-white"
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