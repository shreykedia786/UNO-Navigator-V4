import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Header } from '@/app/components/Header';
import { PropertyInventoryTable } from '@/app/components/PropertyInventoryTable';
import { OnboardingTour, ONBOARDING_STORAGE_KEYS } from '@/app/components/OnboardingTour';
import { NavigatorAccessGate } from '@/app/components/NavigatorSubscriptionGate';
import { StartFreeTrialModal } from '@/app/components/StartFreeTrialModal';
import { Button } from '@/app/components/ui/button';
import {
  readNavigatorEntitlement,
  setNavigatorFullSubscriber,
  startNavigatorTrial,
  navigatorIntelligenceUnlocked,
  trialDaysRemaining,
  applyNavigatorLimitedGateChoice,
  isNavigatorLockedPreviewDismissed,
  dismissNavigatorLockedPreview,
  clearNavigatorLockedPreviewDismiss,
  type NavigatorEntitlement
} from '@/app/lib/navigatorEntitlement';

type AccessScreen = 'gate' | 'main';

function initialAccessScreen(): AccessScreen {
  // Every load / refresh: start on the two-CTA gate; each CTA clears the matching tour flag for a fresh onboarding.
  return 'gate';
}

function NavigatorTrialBanner() {
  const left = trialDaysRemaining();
  if (left == null) return null;
  return (
    <div className="navigator-top-strip w-full border-b border-[#1e45c7]/30 bg-gradient-to-r from-[#2753eb] via-[#3d5afe] to-[#5c6bc0] px-4 py-2 text-center text-[13px] font-medium text-white shadow-sm">
      <span className="opacity-95">Navigator trial active — </span>
      <strong className="font-semibold">{left} day{left === 1 ? '' : 's'} left</strong>
      <span className="opacity-95"> of full competitor &amp; parity analysis.</span>
    </div>
  );
}

const LIMITED_BANNER_DISMISS_KEY = 'uno.navigatorLimitedBanner.dismissed';

/** In-product cross-sell for UNO users without Navigator (no separate marketing page). */
function NavigatorLimitedBanner({
  onStartTrial,
  lockedNavigatorPreviewDismissed,
  onRestoreNavigatorChartPreview,
  onDismiss
}: {
  onStartTrial: () => void;
  lockedNavigatorPreviewDismissed?: boolean;
  onRestoreNavigatorChartPreview?: () => void;
  onDismiss: () => void;
}) {
  const dismiss = () => {
    try {
      sessionStorage.setItem(LIMITED_BANNER_DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    onDismiss();
  };

  return (
    <div className="navigator-top-strip relative w-full shrink-0 border-b border-white/10 bg-gradient-to-r from-[#001533] to-[#23508a] px-4 py-2.5 pr-12 text-[14px] sm:px-[50px] sm:pr-14">
      <button
        type="button"
        className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-white/90 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 sm:right-10"
        aria-label="Dismiss banner"
        onClick={dismiss}
      >
        <X className="size-[18px]" strokeWidth={2} aria-hidden />
      </button>
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-center gap-2 text-center sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3 sm:gap-y-2 sm:text-left">
        <p className="max-w-[920px] font-normal leading-snug text-white/95 sm:leading-tight">
          <span aria-hidden>👉 </span>
          Want to stay competitive on pricing? Compare your rates with competitors and track your parity to make
          smarter pricing decisions
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:shrink-0">
          <span className="hidden select-none text-white/80 sm:inline" aria-hidden>
            —
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="inline-flex h-9 w-full items-center justify-center whitespace-nowrap rounded border border-white bg-transparent px-4 text-[14px] font-medium text-white shadow-none hover:bg-white/10 hover:text-white sm:w-auto"
            onClick={onStartTrial}
          >
            Start your free 30-day trial
          </Button>
          {lockedNavigatorPreviewDismissed && onRestoreNavigatorChartPreview ? (
            <button
              type="button"
              className="text-[12px] font-medium text-white/90 underline decoration-white/50 underline-offset-2 transition-colors hover:text-white hover:decoration-white sm:text-[13px]"
              onClick={onRestoreNavigatorChartPreview}
            >
              Show competitor chart preview
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [accessScreen, setAccessScreen] = useState<AccessScreen>(initialAccessScreen);
  const [entitlement, setEntitlement] = useState<NavigatorEntitlement>(() => readNavigatorEntitlement());
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [lockedNavigatorPreviewDismissed, setLockedNavigatorPreviewDismissed] = useState(
    () => isNavigatorLockedPreviewDismissed()
  );
  /** Shown once after user hides the locked chart preview (not when preview was already hidden from storage). */
  const [previewDismissGuidanceVisible, setPreviewDismissGuidanceVisible] = useState(false);
  /** Limited promo strip dismissed for this session (sessionStorage); no secondary/minimized UI. */
  const [limitedBannerDismissed, setLimitedBannerDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(LIMITED_BANNER_DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  const handleLimitedBannerDismiss = useCallback(() => {
    setLimitedBannerDismissed(true);
  }, []);

  const syncEntitlement = useCallback(() => {
    setEntitlement(readNavigatorEntitlement());
  }, []);

  const handleDismissLockedNavigatorPreview = useCallback(() => {
    dismissNavigatorLockedPreview();
    setLockedNavigatorPreviewDismissed(true);
    setPreviewDismissGuidanceVisible(true);
  }, []);

  const handleRestoreLockedNavigatorPreview = useCallback(() => {
    clearNavigatorLockedPreviewDismiss();
    setLockedNavigatorPreviewDismissed(false);
    setPreviewDismissGuidanceVisible(false);
  }, []);

  const enterMainAsFullSubscriber = () => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEYS.full);
      localStorage.removeItem(ONBOARDING_STORAGE_KEYS.limited);
    } catch {
      /* ignore */
    }
    setShowOnboardingTour(false);
    clearNavigatorLockedPreviewDismiss();
    setLockedNavigatorPreviewDismissed(false);
    setPreviewDismissGuidanceVisible(false);
    try {
      sessionStorage.removeItem(LIMITED_BANNER_DISMISS_KEY);
    } catch {
      /* ignore */
    }
    setLimitedBannerDismissed(false);
    setNavigatorFullSubscriber();
    syncEntitlement();
    setAccessScreen('main');
  };

  const activateTrial = () => {
    clearNavigatorLockedPreviewDismiss();
    setLockedNavigatorPreviewDismissed(false);
    setPreviewDismissGuidanceVisible(false);
    startNavigatorTrial();
    syncEntitlement();
    setTrialModalOpen(false);
  };

  /** Not subscribed: stay in UNO Rates & Inventory; intelligence stays off until trial or paid Navigator. */
  const enterMainWithoutNavigator = () => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEYS.full);
      localStorage.removeItem(ONBOARDING_STORAGE_KEYS.limited);
    } catch {
      /* ignore */
    }
    try {
      sessionStorage.removeItem(LIMITED_BANNER_DISMISS_KEY);
    } catch {
      /* ignore */
    }
    setLimitedBannerDismissed(false);
    clearNavigatorLockedPreviewDismiss();
    setLockedNavigatorPreviewDismissed(false);
    setPreviewDismissGuidanceVisible(false);
    setShowOnboardingTour(false);
    applyNavigatorLimitedGateChoice();
    syncEntitlement();
    setAccessScreen('main');
  };

  useEffect(() => {
    if (accessScreen !== 'main') return;

    const storageKey =
      entitlement === 'limited' ? ONBOARDING_STORAGE_KEYS.limited : ONBOARDING_STORAGE_KEYS.full;
    let tourCompleted = false;
    try {
      tourCompleted = localStorage.getItem(storageKey) === 'true';
    } catch {
      tourCompleted = false;
    }

    if (!tourCompleted) {
      const timer = setTimeout(() => {
        setShowOnboardingTour(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [accessScreen, entitlement]);

  const handleTourComplete = () => {
    setShowOnboardingTour(false);
  };

  const handleTourStepChange = (stepIndex: number) => {
    // Step 2 (index 1): expand Standard Room so the chevron / chart targets are visible (full and limited tours).
    if (stepIndex === 1) {
      window.dispatchEvent(new CustomEvent('onboarding-expand-standard-room'));
    }
  };

  const intelligenceOn = navigatorIntelligenceUnlocked(entitlement);

  if (accessScreen === 'gate') {
    return (
      <NavigatorAccessGate
        onNotSubscribed={enterMainWithoutNavigator}
        onAlreadySubscribed={enterMainAsFullSubscriber}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] w-full">
      {entitlement === 'limited' && !limitedBannerDismissed ? (
        <NavigatorLimitedBanner
          onStartTrial={() => setTrialModalOpen(true)}
          lockedNavigatorPreviewDismissed={lockedNavigatorPreviewDismissed}
          onRestoreNavigatorChartPreview={handleRestoreLockedNavigatorPreview}
          onDismiss={handleLimitedBannerDismiss}
        />
      ) : null}
      {entitlement === 'limited' &&
      lockedNavigatorPreviewDismissed &&
      previewDismissGuidanceVisible ? (
        <div className="w-full shrink-0 border-b border-sky-200/90 bg-sky-50 px-4 py-2.5 sm:px-[50px]">
          <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-center gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p className="max-w-3xl text-center text-[12px] leading-snug text-sky-950 sm:text-left sm:text-[13px]">
              <span className="font-semibold">Preview hidden.</span>{' '}
              {limitedBannerDismissed ? (
                <>
                  Use the Navigator intelligence section in the table below to start a free trial or bring the
                  competitor chart preview back.
                </>
              ) : (
                <>
                  Whenever you want to subscribe or start a trial, use the options in the blue Navigator banner at the
                  top of the page or in the intelligence section below.
                </>
              )}
            </p>
            <button
              type="button"
              className="shrink-0 rounded-md px-3 py-1 text-[12px] font-semibold text-sky-900 underline decoration-sky-400/70 underline-offset-2 transition-colors hover:bg-sky-100/80 hover:decoration-sky-700"
              onClick={() => setPreviewDismissGuidanceVisible(false)}
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
      {entitlement === 'trial' ? <NavigatorTrialBanner /> : null}
      <Header
        onUnoLogoClick={() => {
          setTrialModalOpen(false);
          setShowOnboardingTour(false);
          clearNavigatorLockedPreviewDismiss();
          setLockedNavigatorPreviewDismissed(false);
          setPreviewDismissGuidanceVisible(false);
          try {
            sessionStorage.removeItem(LIMITED_BANNER_DISMISS_KEY);
          } catch {
            /* ignore */
          }
          setLimitedBannerDismissed(false);
          setAccessScreen('gate');
        }}
      />
      <div className="w-full max-w-[1440px] mx-auto px-[50px] mt-6">
        <PropertyInventoryTable
          navigatorIntelligenceUnlocked={intelligenceOn}
          onRequestNavigatorTrial={() => setTrialModalOpen(true)}
          lockedNavigatorPreviewDismissed={entitlement === 'limited' ? lockedNavigatorPreviewDismissed : false}
          onDismissLockedNavigatorPreview={
            entitlement === 'limited' ? handleDismissLockedNavigatorPreview : undefined
          }
        />
      </div>

      {showOnboardingTour && (
        <OnboardingTour
          variant={entitlement === 'limited' ? 'limited' : 'full'}
          onComplete={handleTourComplete}
          onStepChange={handleTourStepChange}
        />
      )}

      <StartFreeTrialModal open={trialModalOpen} onOpenChange={setTrialModalOpen} onSuccess={activateTrial} />
    </div>
  );
}
