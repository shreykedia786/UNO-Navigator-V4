import { useState, useEffect } from 'react';
import { Header } from '@/app/components/Header';
import { PropertyInventoryTable } from '@/app/components/PropertyInventoryTable';
import { OnboardingTour } from '@/app/components/OnboardingTour';

export default function App() {
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);

  useEffect(() => {
    // Clear localStorage for testing - REMOVE THIS LINE after testing
    localStorage.removeItem('onboardingTourCompleted');
    
    // Check if user has completed the onboarding tour
    const tourCompleted = localStorage.getItem('onboardingTourCompleted');
    console.log('Tour completed status:', tourCompleted);
    
    if (!tourCompleted) {
      // Delay showing the tour to let the page render first
      const timer = setTimeout(() => {
        console.log('Showing onboarding tour...');
        setShowOnboardingTour(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleTourComplete = () => {
    setShowOnboardingTour(false);
  };

  const handleTourStepChange = (stepIndex: number) => {
    // When reaching step 1, expand the Standard Room so the rate plan chevron is visible
    if (stepIndex === 1) {
      window.dispatchEvent(new CustomEvent('onboarding-expand-standard-room'));
    }
    // When reaching step 2, expand the first rate plan to show competitor analysis
    if (stepIndex === 2) {
      window.dispatchEvent(new CustomEvent('onboarding-expand-first-rate-plan'));
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] w-full">
      {/* Header bars (main nav, links, filters, status) span full browser width */}
      <Header />
      <div className="w-full max-w-[1440px] mx-auto px-[50px] mt-6">
        <PropertyInventoryTable />
      </div>
      
      {/* Onboarding Tour */}
      {showOnboardingTour && (
        <OnboardingTour 
          onComplete={handleTourComplete}
          onStepChange={handleTourStepChange}
        />
      )}
    </div>
  );
}