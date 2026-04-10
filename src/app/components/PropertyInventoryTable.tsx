import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, Lock, Zap } from 'lucide-react';
import svgPaths from "../../imports/svg-eqrmta6hqq";
import { RateCandlestickChart } from './RateCandlestickChart';

interface DateCell {
  day: string;
  date: string;
  month: string;
}

/** Initial Suite rates — competitor analysis stays fixed to these baselines when rates are edited. */
const SUITE_GDS_BASELINE: number[] = [425, 430, 428, 435, 440, 438, 445, 450, 448, 455, 460, 458, 465, 470];
const SUITE_BAR_BASELINE: number[] = [445, 450, 448, 455, 460, 458, 465, 470, 468, 475, 480, 478, 485, 490];

function parseSuiteRateInput(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  if (digits === '') return 0;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : 0;
}

export function PropertyInventoryTable() {
  const [isPropertyDetailsExpanded, setIsPropertyDetailsExpanded] = useState(false);
  const [isStandardRoomExpanded, setIsStandardRoomExpanded] = useState(false);
  const [isSuiteExpanded, setIsSuiteExpanded] = useState(false);
  const [isDeluxeRoomExpanded, setIsDeluxeRoomExpanded] = useState(false);
  
  // Track expanded rate plans
  const [expandedRatePlans, setExpandedRatePlans] = useState<Set<string>>(new Set());

  const [suiteGdsRates, setSuiteGdsRates] = useState<number[]>(() => [...SUITE_GDS_BASELINE]);
  const [suiteBarRates, setSuiteBarRates] = useState<number[]>(() => [...SUITE_BAR_BASELINE]);
  /** Indices where user committed a change (blur/Enter) that differs from baseline — orange highlight */
  const [suiteGdsEditedCells, setSuiteGdsEditedCells] = useState<Set<number>>(new Set());
  const [suiteBarEditedCells, setSuiteBarEditedCells] = useState<Set<number>>(new Set());

  const applySuiteGdsRate = (index: number, value: string) => {
    const n = parseSuiteRateInput(value);
    setSuiteGdsRates((prev) => {
      const next = [...prev];
      next[index] = n;
      return next;
    });
  };

  const applySuiteBarRate = (index: number, value: string) => {
    const n = parseSuiteRateInput(value);
    setSuiteBarRates((prev) => {
      const next = [...prev];
      next[index] = n;
      return next;
    });
  };

  const syncSuiteGdsEditedFlag = (index: number, value: string) => {
    const n = parseSuiteRateInput(value);
    setSuiteGdsEditedCells((prev) => {
      const next = new Set(prev);
      if (n !== SUITE_GDS_BASELINE[index]) next.add(index);
      else next.delete(index);
      return next;
    });
  };

  const syncSuiteBarEditedFlag = (index: number, value: string) => {
    const n = parseSuiteRateInput(value);
    setSuiteBarEditedCells((prev) => {
      const next = new Set(prev);
      if (n !== SUITE_BAR_BASELINE[index]) next.add(index);
      else next.delete(index);
      return next;
    });
  };

  /** Table: call on blur / after Enter (blur) */
  const commitSuiteGdsCell = (index: number, value: string) => {
    applySuiteGdsRate(index, value);
    syncSuiteGdsEditedFlag(index, value);
  };

  const commitSuiteBarCell = (index: number, value: string) => {
    applySuiteBarRate(index, value);
    syncSuiteBarEditedFlag(index, value);
  };

  /** Drawer: keep chart in sync and mark edited when value ≠ baseline */
  const updateSuiteGdsRateFromDrawer = (index: number, value: string) => {
    applySuiteGdsRate(index, value);
    syncSuiteGdsEditedFlag(index, value);
  };

  const updateSuiteBarRateFromDrawer = (index: number, value: string) => {
    applySuiteBarRate(index, value);
    syncSuiteBarEditedFlag(index, value);
  };

  // Listen for onboarding event to expand Standard Room
  useEffect(() => {
    const handleExpandStandardRoom = () => {
      setIsStandardRoomExpanded(true);
    };

    window.addEventListener('onboarding-expand-standard-room', handleExpandStandardRoom);

    return () => {
      window.removeEventListener('onboarding-expand-standard-room', handleExpandStandardRoom);
    };
  }, []);

  // Listen for onboarding event to expand first rate plan
  useEffect(() => {
    const handleExpandFirstRatePlan = () => {
      setExpandedRatePlans(new Set(['std-club-special']));
    };

    window.addEventListener('onboarding-expand-first-rate-plan', handleExpandFirstRatePlan);

    return () => {
      window.removeEventListener('onboarding-expand-first-rate-plan', handleExpandFirstRatePlan);
    };
  }, []);

  const toggleRatePlan = (ratePlanId: string) => {
    const newExpanded = new Set(expandedRatePlans);
    if (newExpanded.has(ratePlanId)) {
      newExpanded.delete(ratePlanId);
    } else {
      newExpanded.add(ratePlanId);
    }
    setExpandedRatePlans(newExpanded);
  };
  
  // Generate competitor rate data (min, avg, max) for analysis
  const getCompetitorRatesForDate = (dateIndex: number, baseRate: number) => {
    // Create varied scenarios - some rates will be above max, below min, and in between
    const scenarios = [
      // Scenario 1: Rate within range
      { minVariance: -0.15, maxVariance: 0.20, avgOffset: 0.02 },
      // Scenario 2: Rate BELOW minimum (aggressive pricing)
      { minVariance: 0.10, maxVariance: 0.35, avgOffset: 0.22 },
      // Scenario 3: Rate within range
      { minVariance: -0.12, maxVariance: 0.18, avgOffset: 0.03 },
      // Scenario 4: Rate ABOVE maximum (premium pricing)
      { minVariance: -0.25, maxVariance: -0.05, avgOffset: -0.15 },
      // Scenario 5: Rate within range
      { minVariance: -0.10, maxVariance: 0.22, avgOffset: 0.06 },
      // Scenario 6: Rate within range
      { minVariance: -0.18, maxVariance: 0.15, avgOffset: -0.01 },
      // Scenario 7: Rate BELOW minimum
      { minVariance: 0.08, maxVariance: 0.28, avgOffset: 0.18 },
      // Scenario 8: Rate ABOVE maximum
      { minVariance: -0.30, maxVariance: -0.08, avgOffset: -0.19 },
      // Scenario 9: Rate within range
      { minVariance: -0.14, maxVariance: 0.16, avgOffset: 0.01 },
      // Scenario 10: Rate within range (weekend)
      { minVariance: -0.20, maxVariance: 0.25, avgOffset: 0.02 },
      // Scenario 11: Rate ABOVE maximum
      { minVariance: -0.28, maxVariance: -0.10, avgOffset: -0.19 },
      // Scenario 12: Rate within range
      { minVariance: -0.15, maxVariance: 0.20, avgOffset: 0.02 },
      // Scenario 13: Rate BELOW minimum
      { minVariance: 0.12, maxVariance: 0.32, avgOffset: 0.22 },
      // Scenario 14: Rate within range (last date)
      { minVariance: -0.10, maxVariance: 0.18, avgOffset: 0.04 }
    ];
    
    // Get scenario for this date, or use a default if index out of range
    const scenario = scenarios[dateIndex] || scenarios[0];
    
    // Calculate competitor rates based on scenario
    const min = Math.round(baseRate * (1 + scenario.minVariance));
    const max = Math.round(baseRate * (1 + scenario.maxVariance));
    const avg = Math.round(baseRate * (1 + scenario.avgOffset));
    
    return { min, avg, max };
  };

  const dates: DateCell[] = [
    { day: 'Wed', date: '21', month: 'Jan' },
    { day: 'Thu', date: '22', month: 'Jan' },
    { day: 'Fri', date: '23', month: 'Jan' },
    { day: 'Sat', date: '24', month: 'Jan' },
    { day: 'Sun', date: '25', month: 'Jan' },
    { day: 'Mon', date: '26', month: 'Jan' },
    { day: 'Tue', date: '27', month: 'Jan' },
    { day: 'Wed', date: '28', month: 'Jan' },
    { day: 'Thu', date: '29', month: 'Jan' },
    { day: 'Fri', date: '30', month: 'Jan' },
    { day: 'Sat', date: '31', month: 'Jan' },
    { day: 'Sun', date: '01', month: 'Feb' },
    { day: 'Mon', date: '02', month: 'Feb' },
    { day: 'Tue', date: '03', month: 'Feb' },
  ];
  
  // Event data for each date - red: important, amber: medium, green: less important
  const events = [
    null, // Jan 21
    null, // Jan 22
    null, // Jan 23
    { 
      name: 'Winter Festival', 
      dateRange: 'Jan 24 - Jan 26', 
      importance: 'medium',
      demandLevel: 'High Demand',
      demandIndex: 38,
      demandMultiplier: '2.0x',
      confidenceScore: '95%'
    }, // Jan 24
    { 
      name: 'Winter Festival', 
      dateRange: 'Jan 24 - Jan 26', 
      importance: 'high',
      demandLevel: 'Very High Demand',
      demandIndex: 45,
      demandMultiplier: '2.5x',
      confidenceScore: '98%'
    }, // Jan 25
    { 
      name: 'Winter Festival', 
      dateRange: 'Jan 24 - Jan 26', 
      importance: 'medium',
      demandLevel: 'High Demand',
      demandIndex: 40,
      demandMultiplier: '2.2x',
      confidenceScore: '96%'
    }, // Jan 26
    null, // Jan 27
    { 
      name: 'Business Conference', 
      dateRange: 'Jan 28 - Jan 29', 
      importance: 'low',
      demandLevel: 'Medium Demand',
      demandIndex: 28,
      demandMultiplier: '1.5x',
      confidenceScore: '89%'
    }, // Jan 28
    { 
      name: 'Business Conference', 
      dateRange: 'Jan 28 - Jan 29', 
      importance: 'low',
      demandLevel: 'Medium Demand',
      demandIndex: 30,
      demandMultiplier: '1.6x',
      confidenceScore: '90%'
    }, // Jan 29
    { 
      name: 'Weekend Market', 
      dateRange: 'Jan 30 - Feb 01', 
      importance: 'medium',
      demandLevel: 'High Demand',
      demandIndex: 42,
      demandMultiplier: '2.3x',
      confidenceScore: '94%'
    }, // Jan 30
    { 
      name: 'Weekend Market', 
      dateRange: 'Jan 30 - Feb 01', 
      importance: 'high',
      demandLevel: 'Very High Demand',
      demandIndex: 48,
      demandMultiplier: '2.8x',
      confidenceScore: '99%'
    }, // Jan 31
    { 
      name: 'Weekend Market', 
      dateRange: 'Jan 30 - Feb 01', 
      importance: 'medium',
      demandLevel: 'High Demand',
      demandIndex: 39,
      demandMultiplier: '2.1x',
      confidenceScore: '93%'
    }, // Feb 01
    null, // Feb 02
    null, // Feb 03
  ];

  // Icon components matching Figma exactly
  const IconLock = () => (
    <div className="relative shrink-0 size-[12px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g>
          <path d={svgPaths.p2b283480} stroke="#FF5E01" strokeLinecap="round" strokeLinejoin="round" />
          <path d={svgPaths.pbc77700} stroke="#FF5E01" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );

  const IconZap = () => (
    <div className="relative shrink-0 size-[14px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g>
          <path d={svgPaths.p27661e00} stroke="#D500FF" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );

  return (
    <div className="space-y-0">
      {/* Scrollable container wrapping all sections */}
      <div className="relative">
        <button className="absolute left-[298px] top-[14.5px] z-10 w-7 h-10 flex items-center justify-center bg-white border border-[#e0e0e0] hover:bg-gray-50">
          <ChevronLeft className="w-4 h-4 text-[#999999]" />
        </button>
        <button className="absolute right-0 top-[14.5px] z-10 w-7 h-10 flex items-center justify-center bg-white border border-[#e0e0e0] hover:bg-gray-50">
          <ChevronRight className="w-4 h-4 text-[#999999]" />
        </button>

        <div className="overflow-x-auto">
          {/* Date Header Row - Shared */}
          <div className="bg-white shadow-sm">
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed', minWidth: '1450px' }}>
              <colgroup>
                <col style={{ width: '240px' }} />
                <col style={{ width: '90px' }} />
                {dates.map((_, idx) => (
                  <col key={idx} style={{ width: '80px' }} />
                ))}
              </colgroup>
              <thead>
                <tr className="bg-[#fafafa] h-[69px]">
                  <th className="border-b border-[#e0e0e0] px-4 py-2"></th>
                  <th className="border-r border-b border-[#e0e0e0] px-3 py-2"></th>
                  {dates.map((date, idx) => (
                    <th key={idx} className="border-r border-b border-[#e0e0e0] px-3 py-2 relative group/date">
                      <div className="flex flex-col items-center justify-center h-[52.5px] relative">
                        <span className="text-[10px] font-bold text-[#999999] leading-[15px]">{date.day}</span>
                        <span className="text-[15px] font-semibold text-[#333333] leading-[22.5px]">{date.date}</span>
                        <span className="text-[10px] font-bold text-[#999999] leading-[15px]">{date.month}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
          </div>

          {/* Property Details Section */}
          <div className="bg-white shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] mb-3">
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed', minWidth: '1450px' }}>
              <colgroup>
                <col style={{ width: '240px' }} />
                <col style={{ width: '90px' }} />
                {dates.map((_, idx) => (
                  <col key={idx} style={{ width: '80px' }} />
                ))}
              </colgroup>
              <tbody>
                <tr className="border-b border-[#e0e0e0] h-[48.5px]">
                  <td className="px-4 py-3 bg-white border-r-0">
                    <button
                      onClick={() => setIsPropertyDetailsExpanded(!isPropertyDetailsExpanded)}
                      className="flex items-center gap-2 w-full text-left"
                    >
                      {isPropertyDetailsExpanded ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 14 14">
                          <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="#666666" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                          <path d="M6 12L10 8L6 4" stroke="#666666" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                        </svg>
                      )}
                      <span className="text-[13px] font-semibold text-[#333333] leading-[19.5px]">Property Details</span>
                    </button>
                  </td>
                  <td className="px-3 py-3 text-center border-r border-[#e0e0e0] bg-white">
                    <span className="text-[11px] font-medium text-[#666666] leading-[16.5px]">Inventory</span>
                  </td>
                  {dates.map((_, idx) => (
                    <td key={idx} className="px-3 py-3 text-center border-r border-[#e0e0e0] bg-white">
                      <span className="text-[13px] font-semibold text-[#333333] leading-[19.5px]">44</span>
                    </td>
                  ))}
                </tr>

                {isPropertyDetailsExpanded && (
                  <>
                    {/* Sold Row */}
                    <tr className="border-b border-[#e0e0e0]">
                      <td className="px-4 py-3 bg-white border-r-0">
                        <span className="text-[13px] text-[#333333] pl-6">Sold</span>
                      </td>
                      <td className="px-3 py-3 text-center border-r border-[#e0e0e0] bg-white"></td>
                      {dates.map((_, idx) => (
                        <td key={idx} className="px-3 py-3 text-center border-r border-[#e0e0e0] bg-white">
                          <span className="text-[13px] text-[#999999]">-</span>
                        </td>
                      ))}
                    </tr>

                    {/* Over Booking Row */}
                    <tr className="border-b border-[#e0e0e0]">
                      <td className="px-4 py-3 bg-white border-r-0">
                        <span className="text-[13px] text-[#333333] pl-6">Over Booking</span>
                      </td>
                      <td className="px-3 py-3 text-center border-r border-[#e0e0e0] bg-white"></td>
                      {dates.map((_, idx) => (
                        <td key={idx} className="px-3 py-3 text-center border-r border-[#e0e0e0] bg-white">
                          <span className="text-[13px] text-[#999999]">-</span>
                        </td>
                      ))}
                    </tr>

                    {/* Occupancy Row */}
                    <tr className="border-b border-[#e0e0e0]">
                      <td className="px-4 py-3 bg-white border-r-0">
                        <span className="text-[13px] text-[#333333] pl-6">Occupancy</span>
                      </td>
                      <td className="px-3 py-3 text-center border-r border-[#e0e0e0] bg-white"></td>
                      {dates.map((_, idx) => (
                        <td key={idx} className="px-3 py-3 text-center border-r border-[#e0e0e0] bg-white">
                          <span className="text-[13px] text-[#999999]">-</span>
                        </td>
                      ))}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Standard Room Section */}
          <div className="bg-white shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] mb-3">
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed', minWidth: '1450px' }}>
              <colgroup>
                <col style={{ width: '240px' }} />
                <col style={{ width: '90px' }} />
                {dates.map((_, idx) => (
                  <col key={idx} style={{ width: '80px' }} />
                ))}
              </colgroup>
              <tbody>
                {/* Standard Room Header Row */}
                <tr className="border-b border-[#e0e0e0] h-[57.5px]" data-tour="room-accordion">
                  <td className="px-4 py-3 bg-white border-r-0">
                    <button
                      onClick={() => setIsStandardRoomExpanded(!isStandardRoomExpanded)}
                      className="flex items-center gap-2 w-full text-left"
                      data-tour="room-chevron"
                    >
                      {isStandardRoomExpanded ? (
                        <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 14 14">
                          <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="#666666" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                          <path d="M6 12L10 8L6 4" stroke="#666666" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                        </svg>
                      )}
                      <div>
                        <div className="text-[12px] font-semibold text-[#333333] leading-[18px]">Standard Room</div>
                        <div className="text-[10px] font-medium italic text-[#999999] leading-[15px]">STD</div>
                      </div>
                    </button>
                  </td>
                  <td className="px-3 py-3 text-center border-r border-[#e0e0e0] bg-white">
                    <span className="text-[11px] font-medium text-[#666666] leading-[16.5px]">Inventory</span>
                  </td>
                  {dates.map((_, idx) => (
                    <td key={idx} className="px-3 py-3 text-center border-r border-[#e0e0e0] bg-white relative">
                      <span className="text-[13px] font-normal text-[#333333] leading-[19.5px]">5</span>
                      <div className="absolute bottom-0 left-[0.5px] right-0 h-[3px] bg-[#4ecdc4] w-[79px]"></div>
                    </td>
                  ))}
                </tr>

                {isStandardRoomExpanded && (
                  <>
                    {/* Club Only Special Rates */}
                    <tr className="border-b border-[#e0e0e0]">
                      <td className="px-4 py-2.5 bg-white border-r-0">
                        <button
                          onClick={() => toggleRatePlan('std-club-special')}
                          className="pl-4 flex items-center gap-2 w-full text-left hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
                        >
                          <div data-tour="rate-plan-chevron">
                            {expandedRatePlans.has('std-club-special') ? (
                              <ChevronDown className="w-3 h-3 text-[#2753eb] flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                          <div>
                            <div className="text-[11px] font-medium text-[#333333]">Club Only Special Rates With Breakfast And Complementary...</div>
                            <div className="text-[10px] font-medium italic text-[#999999]">GDSR</div>
                          </div>
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-center border-r border-[#e0e0e0] bg-white">
                        <span className="text-[10px] font-normal text-[#666666]">Rates(EUR)</span>
                      </td>
                      <td className="px-3 py-2.5 text-center border-r border-[#e0e0e0] bg-white">
                        <span className="text-[12px] font-normal text-[#333333]">315</span>
                      </td>
                      {[315, 315, 315, 315, 315, 315, 315, 315, 315, 350, 350, 350, 350].map((rate, idx) => (
                        <td key={idx} className="px-3 py-2.5 text-center border-r border-[#e0e0e0] bg-white">
                          <span className="text-[12px] font-normal text-[#333333]">{rate}</span>
                        </td>
                      ))}
                    </tr>

                    {/* Candlestick Chart for Club Only Special Rates */}
                    {expandedRatePlans.has('std-club-special') && (
                      <RateCandlestickChart 
                        dates={dates}
                        rates={[315, 315, 315, 315, 315, 315, 315, 315, 315, 350, 350, 350, 350, 350]} 
                        getCompetitorRates={getCompetitorRatesForDate}
                        showLegend={true}
                        roomType="Standard Room"
                        ratePlan="Club Only Special Rates"
                        events={events}
                      />
                    )}

                    {/* BAR */}
                    <tr className="border-b border-[#e0e0e0]">
                      <td className="px-4 py-2.5 bg-white border-r-0">
                        <button
                          onClick={() => toggleRatePlan('std-bar')}
                          className="pl-4 flex items-center gap-2 w-full text-left hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
                        >
                          {expandedRatePlans.has('std-bar') ? (
                            <ChevronDown className="w-3 h-3 text-[#2753eb] flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          )}
                          <div>
                            <div className="text-[11px] font-semibold text-[#333333]">BAR</div>
                            <div className="text-[10px] font-medium italic text-[#999999]">BAR</div>
                          </div>
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-center border-r border-[#e0e0e0] bg-white">
                        <span className="text-[10px] font-normal text-[#666666]">Rates(EUR)</span>
                      </td>
                      {[320, 345, 310, 335, 340, 330, 325, 355, 315, 340, 345, 330, 325, 335].map((rate, idx) => (
                        <td key={idx} className="px-3 py-2.5 text-center border-r border-[#e0e0e0] bg-white">
                          <span className="text-[12px] font-normal text-[#333333]">{rate}</span>
                        </td>
                      ))}
                    </tr>

                    {/* Candlestick Chart for BAR */}
                    {expandedRatePlans.has('std-bar') && (
                      <RateCandlestickChart 
                        dates={dates}
                        rates={[320, 345, 310, 335, 340, 330, 325, 355, 315, 340, 345, 330, 325, 335]} 
                        getCompetitorRates={getCompetitorRatesForDate}
                        showLegend={true}
                        roomType="Standard Room"
                        ratePlan="BAR"
                        events={events}
                      />
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Suite Section */}
          <div className="bg-white shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] mb-3">
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed', minWidth: '1450px' }}>
              <colgroup>
                <col style={{ width: '240px' }} />
                <col style={{ width: '90px' }} />
                {dates.map((_, idx) => (
                  <col key={idx} style={{ width: '80px' }} />
                ))}
              </colgroup>
              <tbody>
                {/* Suite Header Row */}
                <tr className="border-b border-[#e0e0e0] bg-[#dde9f7]">
                  <td className="px-4 py-3 border-r-0">
                    <button
                      onClick={() => setIsSuiteExpanded(!isSuiteExpanded)}
                      className="flex items-center gap-2 w-full text-left"
                    >
                      {isSuiteExpanded ? (
                        <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 14 14">
                          <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="#666666" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                          <path d="M6 12L10 8L6 4" stroke="#666666" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                        </svg>
                      )}
                      <div>
                        <div className="text-[12px] font-semibold text-[#333333] leading-[18px]">Suite</div>
                        <div className="text-[10px] font-medium italic text-[#666666] leading-[15px]">SUI7</div>
                      </div>
                    </button>
                  </td>
                  <td className="px-3 py-3 text-center border-r border-[#e0e0e0]">
                    <span className="text-[11px] font-medium text-[#666666] leading-[16.5px]">Inventory</span>
                  </td>
                  {dates.map((_, idx) => (
                    <td key={idx} className="px-3 py-3 text-center border-r border-[#e0e0e0]">
                      <span className="text-[13px] font-normal text-[#333333] leading-[19.5px]">19</span>
                    </td>
                  ))}
                </tr>

                {isSuiteExpanded && (
                  <>
                    {/* GDS Only Special Rates */}
                    <tr className="border-b border-[#e0e0e0]">
                      <td className="px-4 py-2.5 bg-white border-r-0">
                        <button
                          onClick={() => toggleRatePlan('suite-gds-special')}
                          className="pl-4 flex items-center gap-2 w-full text-left hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
                        >
                          {expandedRatePlans.has('suite-gds-special') ? (
                            <ChevronDown className="w-3 h-3 text-[#2753eb] flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          )}
                          <div>
                            <div className="text-[11px] font-medium text-[#333333]">GDS Only Special Rates With Breakfast And Complementary...</div>
                            <div className="text-[10px] font-medium italic text-[#999999]">GDSN</div>
                          </div>
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-center border-r border-[#e0e0e0] bg-white">
                        <span className="text-[10px] font-normal text-[#666666]">Rates(EUR)</span>
                      </td>
                      {suiteGdsRates.map((rate, idx) => {
                        const isEdited = suiteGdsEditedCells.has(idx);
                        return (
                        <td
                          key={idx}
                          className="px-2 py-2 text-center border-r border-[#e0e0e0] bg-white"
                        >
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            aria-label={`Suite GDS rate ${dates[idx]?.day} ${dates[idx]?.date} ${dates[idx]?.month}`}
                            value={rate === 0 ? '' : String(rate)}
                            onChange={(e) => applySuiteGdsRate(idx, e.target.value)}
                            onBlur={(e) => commitSuiteGdsCell(idx, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className={`mx-auto block w-[3.25rem] h-7 text-center text-[11px] rounded-full tabular-nums border ${
                              isEdited
                                ? 'border-orange-400 text-orange-700 bg-orange-50'
                                : 'border-[#d0d0d0] text-[#333333] bg-white'
                            }`}
                          />
                        </td>
                        );
                      })}
                    </tr>

                    {expandedRatePlans.has('suite-gds-special') && (
                      <RateCandlestickChart
                        dates={dates}
                        rates={suiteGdsRates}
                        competitorBaseRates={SUITE_GDS_BASELINE}
                        onYourRatesChange={updateSuiteGdsRateFromDrawer}
                        getCompetitorRates={getCompetitorRatesForDate}
                        showLegend={true}
                        roomType="Suite"
                        ratePlan="GDS Only Special Rates"
                        events={events}
                      />
                    )}

                    {/* BAR under Suite */}
                    <tr className="border-b border-[#e0e0e0]">
                      <td className="px-4 py-2.5 bg-white border-r-0">
                        <button
                          onClick={() => toggleRatePlan('suite-bar')}
                          className="pl-4 flex items-center gap-2 w-full text-left hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
                        >
                          {expandedRatePlans.has('suite-bar') ? (
                            <ChevronDown className="w-3 h-3 text-[#2753eb] flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          )}
                          <div>
                            <div className="text-[11px] font-semibold text-[#333333]">BAR</div>
                            <div className="text-[10px] font-medium italic text-[#999999]">BAR</div>
                          </div>
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-center border-r border-[#e0e0e0] bg-white">
                        <span className="text-[10px] font-normal text-[#666666]">Rates(EUR)</span>
                      </td>
                      {suiteBarRates.map((rate, idx) => {
                        const isEdited = suiteBarEditedCells.has(idx);
                        return (
                        <td key={idx} className="px-2 py-2 text-center border-r border-[#e0e0e0] bg-white">
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            aria-label={`Suite BAR rate ${dates[idx]?.day} ${dates[idx]?.date} ${dates[idx]?.month}`}
                            value={rate === 0 ? '' : String(rate)}
                            onChange={(e) => applySuiteBarRate(idx, e.target.value)}
                            onBlur={(e) => commitSuiteBarCell(idx, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className={`mx-auto block w-[3.25rem] h-7 text-center text-[11px] rounded-full tabular-nums border ${
                              isEdited
                                ? 'border-orange-400 text-orange-700 bg-orange-50'
                                : 'border-[#d0d0d0] text-[#333333] bg-white'
                            }`}
                          />
                        </td>
                        );
                      })}
                    </tr>

                    {expandedRatePlans.has('suite-bar') && (
                      <RateCandlestickChart
                        dates={dates}
                        rates={suiteBarRates}
                        competitorBaseRates={SUITE_BAR_BASELINE}
                        onYourRatesChange={updateSuiteBarRateFromDrawer}
                        getCompetitorRates={getCompetitorRatesForDate}
                        showLegend={true}
                        roomType="Suite"
                        ratePlan="BAR"
                        events={events}
                      />
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Deluxe Room Section */}
          <div className="bg-white shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1),0px_2px_4px_0px_rgba(0,0,0,0.1)] mb-3">
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed', minWidth: '1450px' }}>
              <colgroup>
                <col style={{ width: '240px' }} />
                <col style={{ width: '90px' }} />
                {dates.map((_, idx) => (
                  <col key={idx} style={{ width: '80px' }} />
                ))}
              </colgroup>
              <tbody>
                {/* Deluxe Room Header Row */}
                <tr className="h-[57.5px]">
                  <td className="px-4 py-3 bg-white border-r-0">
                    <button
                      onClick={() => setIsDeluxeRoomExpanded(!isDeluxeRoomExpanded)}
                      className="flex items-center gap-2 w-full text-left"
                    >
                      {isDeluxeRoomExpanded ? (
                        <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 14 14">
                          <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="#666666" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                          <path d="M6 12L10 8L6 4" stroke="#666666" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                        </svg>
                      )}
                      <div>
                        <div className="text-[12px] font-semibold text-[#333333] leading-[18px]">Deluxe Room</div>
                        <div className="text-[10px] font-medium italic text-[#999999] leading-[15px]">DLX</div>
                      </div>
                    </button>
                  </td>
                  <td className="px-3 py-3 text-center border-r border-[#e0e0e0] bg-white">
                    <span className="text-[11px] font-medium text-[#666666] leading-[16.5px]">Inventory</span>
                  </td>
                  {dates.map((_, idx) => (
                    <td key={idx} className="px-3 py-3 text-center border-r border-[#e0e0e0] bg-white relative">
                      <span className="text-[13px] font-normal text-[#333333] leading-[19.5px]">5</span>
                      <div className="absolute bottom-0 left-[0.5px] right-0 h-[3px] bg-[#4ecdc4] w-[79px]"></div>
                    </td>
                  ))}
                </tr>

                {isDeluxeRoomExpanded && (
                  <>
                    {/* Deluxe special rates */}
                    <tr className="border-b border-[#e0e0e0]">
                      <td className="px-4 py-2.5 bg-white border-r-0">
                        <button
                          onClick={() => toggleRatePlan('deluxe-club-special')}
                          className="pl-4 flex items-center gap-2 w-full text-left hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
                        >
                          {expandedRatePlans.has('deluxe-club-special') ? (
                            <ChevronDown className="w-3 h-3 text-[#2753eb] flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          )}
                          <div>
                            <div className="text-[11px] font-medium text-[#333333]">Deluxe Club Special Rates With Breakfast And Complementary...</div>
                            <div className="text-[10px] font-medium italic text-[#999999]">DLXR</div>
                          </div>
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-center border-r border-[#e0e0e0] bg-white">
                        <span className="text-[10px] font-normal text-[#666666]">Rates(EUR)</span>
                      </td>
                      <td className="px-3 py-2.5 text-center border-r border-[#e0e0e0] bg-white">
                        <span className="text-[12px] font-normal text-[#333333]">355</span>
                      </td>
                      {[358, 360, 362, 365, 368, 370, 372, 375, 378, 380, 382, 385, 388].map((rate, idx) => (
                        <td key={idx} className="px-3 py-2.5 text-center border-r border-[#e0e0e0] bg-white">
                          <span className="text-[12px] font-normal text-[#333333]">{rate}</span>
                        </td>
                      ))}
                    </tr>

                    {expandedRatePlans.has('deluxe-club-special') && (
                      <RateCandlestickChart
                        dates={dates}
                        rates={[355, 358, 360, 362, 365, 368, 370, 372, 375, 378, 380, 382, 385, 388]}
                        getCompetitorRates={getCompetitorRatesForDate}
                        showLegend={true}
                        roomType="Deluxe Room"
                        ratePlan="Deluxe Club Special Rates"
                        events={events}
                      />
                    )}

                    {/* BAR — Deluxe */}
                    <tr className="border-b border-[#e0e0e0]">
                      <td className="px-4 py-2.5 bg-white border-r-0">
                        <button
                          onClick={() => toggleRatePlan('deluxe-bar')}
                          className="pl-4 flex items-center gap-2 w-full text-left hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
                        >
                          {expandedRatePlans.has('deluxe-bar') ? (
                            <ChevronDown className="w-3 h-3 text-[#2753eb] flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          )}
                          <div>
                            <div className="text-[11px] font-semibold text-[#333333]">BAR</div>
                            <div className="text-[10px] font-medium italic text-[#999999]">BAR</div>
                          </div>
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-center border-r border-[#e0e0e0] bg-white">
                        <span className="text-[10px] font-normal text-[#666666]">Rates(EUR)</span>
                      </td>
                      {[375, 378, 380, 382, 385, 388, 390, 392, 395, 398, 400, 402, 405, 408].map((rate, idx) => (
                        <td key={idx} className="px-3 py-2.5 text-center border-r border-[#e0e0e0] bg-white">
                          <span className="text-[12px] font-normal text-[#333333]">{rate}</span>
                        </td>
                      ))}
                    </tr>

                    {expandedRatePlans.has('deluxe-bar') && (
                      <RateCandlestickChart
                        dates={dates}
                        rates={[375, 378, 380, 382, 385, 388, 390, 392, 395, 398, 400, 402, 405, 408]}
                        getCompetitorRates={getCompetitorRatesForDate}
                        showLegend={true}
                        roomType="Deluxe Room"
                        ratePlan="BAR"
                        events={events}
                      />
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}