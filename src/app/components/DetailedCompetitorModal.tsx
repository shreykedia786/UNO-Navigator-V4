import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface EventData {
  name: string;
  dateRange: string;
  importance: 'high' | 'medium' | 'low';
  demandLevel: string;
  demandIndex: number;
  demandMultiplier: string;
  confidenceScore: string;
}

interface DetailedCompetitorModalProps {
  dates: Array<{ day: string; date: string; month: string }>;
  rates: number[];
  chartData: Array<{ rate: number; min: number; max: number; date: { day: string; date: string; month: string } }>;
  roomType?: string;
  ratePlan?: string;
  events?: Array<EventData | null>;
  /** Suite: editable Your Rates on Competitor tab only; Parity tab always shows read-only rates. */
  editableYourRates?: boolean;
  onYourRateChange?: (globalDateIndex: number, rawValue: string) => void;
  onClose: () => void;
}

// Mock competitor data
const competitors = [
  { name: 'Central Hotel', color: '#4caf50' },
  { name: 'Hotel Palermitano by DecO', color: '#2196F3' },
  { name: 'The Belgrove Hotel', color: '#9c27b0' },
  { name: 'Fairway Hotel', color: '#ff9800' },
  { name: 'Princess Hotel', color: '#f44336' },
  { name: 'Jesmond Dene Hotel', color: '#795548' },
  { name: 'Scandic Stavanger Airport', color: '#607d8b' },
  { name: 'Scandic Flesland Airport', color: '#009688' }
];

export function DetailedCompetitorModal({
  dates,
  rates,
  chartData,
  roomType = 'Standard Room',
  ratePlan = 'Best Available Rate (BAR)',
  events,
  editableYourRates = false,
  onYourRateChange,
  onClose
}: DetailedCompetitorModalProps) {
  const [hideCompetitors, setHideCompetitors] = useState(false);
  const [dateOffset, setDateOffset] = useState(0);
  const [activeTab, setActiveTab] = useState<'competitor' | 'parity'>('competitor');
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  // Number of dates to show at once - 7 for parity, 10 for competitor
  const DATES_TO_SHOW = activeTab === 'parity' ? 7 : 10;

  // Calculate visible data based on offset
  const visibleDates = dates.slice(dateOffset, dateOffset + DATES_TO_SHOW);
  const visibleRates = rates.slice(dateOffset, dateOffset + DATES_TO_SHOW);
  const visibleChartData = chartData.slice(dateOffset, dateOffset + DATES_TO_SHOW);
  
  // Navigation handlers
  const canGoPrevious = dateOffset > 0;
  const canGoNext = dateOffset + DATES_TO_SHOW < dates.length;
  
  const handlePrevious = () => {
    if (canGoPrevious) {
      setDateOffset(Math.max(0, dateOffset - DATES_TO_SHOW));
    }
  };
  
  const handleNext = () => {
    if (canGoNext) {
      setDateOffset(dateOffset + DATES_TO_SHOW);
    }
  };

  // Generate unique competitor rates for each date
  const getCompetitorRateForDate = (competitorIndex: number, dateIndex: number, myRate: number) => {
    const seed = competitorIndex * 1000 + dateIndex;
    const dateData = chartData[dateIndex];
    if (!dateData) return null;
    
    // Some random sold outs (less frequent)
    if (seed % 29 === 0) {
      return null;
    }
    
    // Generate unique rates for each competitor within a reasonable range
    const minRate = dateData.min;
    const maxRate = dateData.max;
    const range = maxRate - minRate;
    
    // Use different variance for each competitor to create unique rates
    const variance = ((seed % 97) / 97); // 0 to 1, using prime number for better distribution
    const rate = Math.round(minRate + (range * variance));
    
    return rate;
  };

  // Pre-generate all competitor rates and find actual min/max for each date
  const competitorRatesMatrix: Array<Array<number | null>> = [];
  const actualMinMaxPerDate: Array<{ min: number | null; max: number | null }> = [];
  
  for (let dateIdx = 0; dateIdx < visibleRates.length; dateIdx++) {
    const ratesForThisDate: Array<number | null> = [];
    let actualMin: number | null = null;
    let actualMax: number | null = null;
    
    for (let compIdx = 0; compIdx < competitors.length; compIdx++) {
      const rate = getCompetitorRateForDate(compIdx, dateOffset + dateIdx, visibleRates[dateIdx]);
      ratesForThisDate.push(rate);
      
      // Track actual min/max across all competitors
      if (rate !== null) {
        if (actualMin === null || rate < actualMin) actualMin = rate;
        if (actualMax === null || rate > actualMax) actualMax = rate;
      }
    }
    
    competitorRatesMatrix.push(ratesForThisDate);
    actualMinMaxPerDate.push({ min: actualMin, max: actualMax });
  }

  // Check if date has events/holidays
  const hasEvent = (dateIndex: number) => {
    return dateIndex % 4 === 2; // Random events on some dates
  };

  // Use same Y-axis range as main chart
  const chartMin = 200;
  const chartMax = 500;
  const chartRange = chartMax - chartMin;

  // Match main grid chart: clamp to axis, map into inset band so strokes never bleed into "Your Rates"
  const valueToY = (value: number) => {
    if (chartRange === 0) return 50;
    const clamped = Math.min(chartMax, Math.max(chartMin, value));
    const raw = 100 - ((clamped - chartMin) / chartRange) * 100;
    return 6 + (raw / 100) * 88;
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex justify-end"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      onClick={handleClose}
    >
      <div
        className={`bg-white shadow-2xl w-full max-w-[1300px] h-full overflow-hidden flex flex-col ${isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white">
          {/* Close button - positioned absolutely */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-6 z-10 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tabs */}
          <div className="flex items-center px-6 pt-4">
            <div className="flex gap-8">
              <button
                onClick={() => {
                  setActiveTab('competitor');
                  setDateOffset(0);
                }}
                className={`pb-3 pt-3 text-[14px] font-medium transition-colors border-b-2 ${
                  activeTab === 'competitor'
                    ? 'text-[#2196F3] border-[#2196F3]'
                    : 'text-[#666666] border-transparent hover:text-[#333333]'
                }`}
              >
                Competitor Rate Analysis
              </button>
              <button
                onClick={() => {
                  setActiveTab('parity');
                  setDateOffset(0);
                }}
                className={`pb-3 pt-3 text-[14px] font-medium transition-colors border-b-2 ${
                  activeTab === 'parity'
                    ? 'text-[#2196F3] border-[#2196F3]'
                    : 'text-[#666666] border-transparent hover:text-[#333333]'
                }`}
              >
                Parity Analysis
              </button>
            </div>
          </div>

          {/* Room Type and Rate Plan - now below tabs */}
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-semibold text-[#333333]">{roomType}</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">{ratePlan}</p>
            </div>

            {/* Legends - only show for parity tab */}
            {activeTab === 'parity' && (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm bg-[#f97316]"></div>
                  <span className="text-[11px] text-[#666666]">Win</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm bg-[#22c55e]"></div>
                  <span className="text-[11px] text-[#666666]">Meet</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm bg-[#ef4444]"></div>
                  <span className="text-[11px] text-[#666666]">Loss</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5" fill="none"/>
                    <text x="8" y="11" textAnchor="middle" fontSize="10" fontWeight="600" fill="#ef4444">A</text>
                  </svg>
                  <span className="text-[11px] text-[#666666]">Availability Violation</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5" fill="none"/>
                    <text x="8" y="11" textAnchor="middle" fontSize="10" fontWeight="600" fill="#ef4444">R</text>
                  </svg>
                  <span className="text-[11px] text-[#666666]">Rate Variation</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content with Navigation Arrows */}
        <div className="flex-1 overflow-x-auto overflow-y-auto relative">
          {/* Previous Arrow - Positioned based on active tab */}
          {activeTab === 'competitor' && (
            <button
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className={`absolute left-[180px] top-[14.5px] z-20 w-7 h-10 flex items-center justify-center bg-white border border-[#e0e0e0] hover:bg-gray-50 transition-colors ${!canGoPrevious ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ChevronLeft className="w-4 h-4 text-[#999999]" />
            </button>
          )}

          {activeTab === 'parity' && (
            <button
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className={`absolute left-[440px] top-[8.5px] z-20 w-7 h-10 flex items-center justify-center bg-white border border-[#e0e0e0] hover:bg-gray-50 transition-colors ${!canGoPrevious ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ChevronLeft className="w-4 h-4 text-[#999999]" />
            </button>
          )}

          {/* Next Arrow - Positioned on the right side of the last date column */}
          {activeTab === 'competitor' && (
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className={`absolute right-[10px] top-[14.5px] z-20 w-7 h-10 flex items-center justify-center bg-white border border-[#e0e0e0] hover:bg-gray-50 transition-colors ${!canGoNext ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ChevronRight className="w-4 h-4 text-[#999999]" />
            </button>
          )}

          {activeTab === 'parity' && (
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className={`absolute right-[10px] top-[8.5px] z-20 w-7 h-10 flex items-center justify-center bg-white border border-[#e0e0e0] hover:bg-gray-50 transition-colors ${!canGoNext ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ChevronRight className="w-4 h-4 text-[#999999]" />
            </button>
          )}

          {/* Competitor Rate Analysis Tab Content */}
          {activeTab === 'competitor' && (
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '180px' }} />
              {visibleDates.map((_, idx) => (
                <col key={idx} style={{ width: '110px' }} />
              ))}
            </colgroup>
            {/* Date Headers */}
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-[#e0e0e0]">
                <th className="px-4 py-3 text-left border-r border-[#e0e0e0] bg-[#f5f5f5]">
                  {/* Empty cell for the first column */}
                </th>
                {visibleDates.map((date, idx) => {
                  return (
                    <th key={idx} className="px-3 py-2.5 border-r border-[#e0e0e0] bg-[#f5f5f5]">
                      <div className="text-[12px] font-semibold text-[#333333]">{date.day}</div>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <span className="text-[11px] text-gray-600">{date.date} {date.month}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {/* Your Rates Row */}
              <tr className="border-b border-[#e0e0e0] bg-[#e3f2fd]">
                <td className="px-4 py-3 font-semibold text-[13px] text-[#333333] border-r border-[#e0e0e0] sticky left-0 bg-[#e3f2fd] z-10">
                  Your Rates
                </td>
                {visibleRates.map((rate, idx) => {
                  const globalIdx = dateOffset + idx;

                  return (
                    <td key={idx} className="px-3 py-2 text-center text-[13px] font-semibold border-r border-[#e0e0e0]">
                      {editableYourRates && onYourRateChange ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          aria-label={`Your rate ${visibleDates[idx]?.day} ${visibleDates[idx]?.date} ${visibleDates[idx]?.month}`}
                          value={rate === 0 ? '' : String(rate)}
                          onChange={(e) => onYourRateChange(globalIdx, e.target.value)}
                          className="mx-auto block w-[3.25rem] h-7 text-center text-[11px] border border-[#d0d0d0] rounded-full bg-white tabular-nums font-semibold text-[#333333]"
                        />
                      ) : rate === 0 || !rate ? (
                        <span className="text-gray-400 font-normal">Sold Out</span>
                      ) : (
                        <span className="text-[#333333]">€{rate}</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Chart Row with Legend */}
              <tr className="border-b border-[#e0e0e0]">
                <td className="px-4 py-4 border-r border-[#e0e0e0] align-top sticky left-0 bg-white z-10">
                  <div className="space-y-2">
                    <div className="text-[12px] font-semibold text-[#333333] mb-2">Chart Legend</div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <div className="w-3 h-0.5 bg-green-500"></div>
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full -ml-0.5"></div>
                      </div>
                      <span className="text-[11px] text-gray-600">Max Competitor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        <div className="w-2 h-0.5 bg-[#2196F3]"></div>
                        <div className="w-1.5 h-1.5 bg-[#2196F3] rounded-full"></div>
                        <div className="w-2 h-0.5 bg-[#2196F3]"></div>
                      </div>
                      <span className="text-[11px] text-gray-600">Your Rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <div className="w-3 h-0.5 bg-red-500"></div>
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full -ml-0.5"></div>
                      </div>
                      <span className="text-[11px] text-gray-600">Min Competitor</span>
                    </div>
                  </div>
                </td>
                {visibleChartData.map((data, idx) => {
                  const myRateY = valueToY(data.rate);
                  const maxY = valueToY(data.max);
                  const minY = valueToY(data.min);
                  
                  // Get previous and next points for line connection
                  const prevData = idx > 0 ? visibleChartData[idx - 1] : null;
                  const nextData = visibleChartData[idx + 1];
                  const prevMyRateY = prevData ? valueToY(prevData.rate) : null;
                  const nextMyRateY = nextData ? valueToY(nextData.rate) : null;

                  return (
                    <td key={idx} className="px-0 py-2 border-r border-[#e0e0e0] bg-white relative align-middle w-full">
                      <div className="flex items-center justify-center w-full pt-1 pb-2">
                        <ChartCell
                          myRate={data.rate}
                          minRate={data.min}
                          maxRate={data.max}
                          myRateY={myRateY}
                          maxY={maxY}
                          minY={minY}
                          prevMyRateY={prevMyRateY}
                          nextMyRateY={nextMyRateY}
                          hasPrev={!!prevData}
                          hasNext={!!nextData}
                          hasEvent={hasEvent(idx)}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Average Competitor Rates Row */}
              {!hideCompetitors && (
                <tr className="border-b-2 border-[#2196F3] bg-[#E3F2FD]">
                  <td className="px-4 py-3 font-semibold text-[13px] text-[#333333] border-r border-[#e0e0e0] sticky left-0 bg-[#E3F2FD] z-10">
                    Avg. Compset Rates
                  </td>
                  {visibleRates.map((myRate, dateIdx) => {
                    // Calculate average of all competitor rates for this date
                    const competitorRatesForDate = competitorRatesMatrix[dateIdx].filter(r => r !== null) as number[];
                    const avgRate = competitorRatesForDate.length > 0
                      ? Math.round(competitorRatesForDate.reduce((sum, rate) => sum + rate, 0) / competitorRatesForDate.length)
                      : null;

                    return (
                      <td key={dateIdx} className="px-3 py-3 text-center text-[13px] font-semibold border-r border-[#e0e0e0]">
                        {avgRate === null ? (
                          <span className="text-gray-400 text-[12px]">N/A</span>
                        ) : (
                          <span className="text-[#2196F3]">€{avgRate}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Competitor Rows */}
              {!hideCompetitors && competitors.map((competitor, compIdx) => (
                <tr key={compIdx} className="border-b border-[#e0e0e0] hover:bg-gray-50">
                  <td className="px-4 py-3 text-[13px] text-[#333333] border-r border-[#e0e0e0] sticky left-0 bg-white z-10 hover:bg-gray-50">
                    {competitor.name}
                  </td>
                  {visibleRates.map((myRate, dateIdx) => {
                    const compRate = competitorRatesMatrix[dateIdx][compIdx];
                    const actualMinMax = actualMinMaxPerDate[dateIdx];
                    const isMaxRate = compRate !== null && actualMinMax.max !== null && compRate === actualMinMax.max;
                    const isMinRate = compRate !== null && actualMinMax.min !== null && compRate === actualMinMax.min;
                    
                    return (
                      <td key={dateIdx} className="px-3 py-3 text-center text-[13px] border-r border-[#e0e0e0]">
                        {compRate === null ? (
                          <span className="text-gray-400 text-[12px]">Sold Out</span>
                        ) : isMaxRate ? (
                          <span className="text-[#4caf50] font-bold">€{compRate}</span>
                        ) : isMinRate ? (
                          <span className="text-[#f44336] font-bold">€{compRate}</span>
                        ) : (
                          <span className="text-[#333333]">€{compRate}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          )}

          {/* Parity Analysis Tab Content */}
          {activeTab === 'parity' && (
            <ParityAnalysisContent
              visibleDates={visibleDates}
              visibleRates={visibleRates}
              dateOffset={dateOffset}
              competitors={competitors}
              getCompetitorRateForDate={getCompetitorRateForDate}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Parity Analysis Component
function ParityAnalysisContent({
  visibleDates,
  visibleRates,
  dateOffset,
  competitors,
  getCompetitorRateForDate
}: {
  visibleDates: Array<{ day: string; date: string; month: string }>;
  visibleRates: number[];
  dateOffset: number;
  competitors: Array<{ name: string; color: string }>;
  getCompetitorRateForDate: (competitorIndex: number, dateIndex: number, myRate: number) => number | null;
}) {
  const [hoveredCell, setHoveredCell] = useState<{ channelIdx: number; dateIdx: number } | null>(null);

  // Channel names matching the screenshot structure
  const channelNames = [
    'MakeMyTrip',
    'Trivago',
    'Booking.com Super...',
    'Google Hotel Ads',
    'Expedia',
    'Trip Advisor',
    'Agoda',
    'Hotels.com',
    'Priceline',
    'Kayak'
  ];

  // Calculate parity status for a channel rate vs your rate
  const getParityStatus = (channelRate: number, myRate: number) => {
    // If channel is selling at higher rate = Win (good)
    // If channel is selling at lower rate = Loss (bad)
    // If same or very close (within 3%) = Meet

    const diff = channelRate - myRate;
    const diffPercent = Math.abs((diff / myRate) * 100);

    if (diffPercent <= 3) {
      return 'Meet';
    } else if (channelRate > myRate) {
      return 'Win';
    } else {
      return 'Loss';
    }
  };

  // Calculate parity distribution for a channel across visible dates
  const getChannelParityDistribution = (channelIdx: number) => {
    let winCount = 0;
    let meetCount = 0;
    let lossCount = 0;
    let totalCount = 0;

    for (let dateIdx = 0; dateIdx < visibleRates.length; dateIdx++) {
      const myRate = visibleRates[dateIdx];
      const channelRate = getCompetitorRateForDate(channelIdx, dateOffset + dateIdx, myRate);

      if (channelRate !== null && myRate > 0) {
        totalCount++;
        const status = getParityStatus(channelRate, myRate);
        if (status === 'Win') winCount++;
        else if (status === 'Meet') meetCount++;
        else lossCount++;
      }
    }

    const winPercent = totalCount > 0 ? (winCount / totalCount) * 100 : 0;
    const meetPercent = totalCount > 0 ? (meetCount / totalCount) * 100 : 0;
    const lossPercent = totalCount > 0 ? (lossCount / totalCount) * 100 : 0;
    const parityScore = Math.round(winPercent + meetPercent);

    return { winPercent, meetPercent, lossPercent, parityScore };
  };

  // Calculate overall parity percentage for a date
  const getDateParityPercentage = (dateIdx: number) => {
    let goodCount = 0;
    let totalCount = 0;

    for (let i = 0; i < channelNames.length; i++) {
      const myRate = visibleRates[dateIdx];
      const channelRate = getCompetitorRateForDate(i, dateOffset + dateIdx, myRate);

      if (channelRate !== null && myRate > 0) {
        totalCount++;
        const status = getParityStatus(channelRate, myRate);
        if (status === 'Win' || status === 'Meet') {
          goodCount++;
        }
      }
    }

    return totalCount > 0 ? Math.round((goodCount / totalCount) * 100) : 0;
  };

  // Determine cell display type
  const getCellDisplay = (channelRate: number | null, myRate: number, channelIdx: number, dateIdx: number) => {
    const seed1 = (channelIdx * 17 + dateIdx * 23) % 100;

    if (channelRate === null || myRate === 0) {
      return { type: 'no-data', rate: null, status: null };
    }

    const status = getParityStatus(channelRate, myRate);

    // Simulate OTA sold out on channel (green cell) — not a parity loss row
    if (seed1 < 15) {
      return { type: 'sold-out', rate: channelRate, status };
    }

    // Every Loss uses red background — always show R badge on those cells
    if (status === 'Loss') {
      return { type: 'rate-variation', rate: channelRate, status };
    }

    return { type: 'normal', rate: channelRate, status };
  };

  return (
    <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '140px' }} />
          <col style={{ width: '100px' }} />
          <col style={{ width: '80px' }} />
          {visibleDates.map((_, idx) => (
            <col key={idx} style={{ width: '90px' }} />
          ))}
        </colgroup>

        {/* Date Headers */}
        <thead className="sticky top-0 bg-white z-10">
          <tr className="border-b border-[#e0e0e0]">
            <th className="px-3 py-2 border-r border-[#e0e0e0] bg-[#f5f5f5]">
              <div className="text-left text-[11px] font-semibold text-[#333333]">Channels</div>
            </th>
            <th className="px-2 py-2 border-r border-[#e0e0e0] bg-[#f5f5f5]">
              <div className="text-[10px] font-semibold text-[#333333]">Win/Meet/Loss</div>
            </th>
            <th className="px-2 py-2 border-r border-[#e0e0e0] bg-[#f5f5f5]">
              <div className="text-[10px] font-semibold text-[#333333]">Parity Score</div>
            </th>
            {visibleDates.map((date, idx) => (
              <th key={idx} className="px-2 py-2 border-r border-[#e0e0e0] bg-[#f5f5f5]">
                <div className="text-[11px] font-bold text-[#333333]">{date.day}</div>
                <div className="text-[11px] font-semibold text-[#333333] mt-0.5">{date.date} {date.month}</div>
              </th>
            ))}
          </tr>
          {/* Daily overall parity % — light neutral band vs date row (#f5f5f5), distinct from Your Rates blue */}
          <tr className="border-b-2 border-[#d4d8de] bg-[#e2e5ea]">
            <th className="px-3 py-2 border-r border-[#d4d8de] bg-[#e2e5ea]" colSpan={3}>
              <div className="text-left text-[11px] font-semibold text-[#333333]">Overall Parity %</div>
            </th>
            {visibleDates.map((date, idx) => {
              const parityPercent = getDateParityPercentage(idx);
              return (
                <th key={idx} className="px-2 py-2 border-r border-[#d4d8de] bg-[#e2e5ea]">
                  <div className="text-[12px] text-[#333333] font-semibold">
                    {parityPercent}%
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {/* Your Rates Row */}
          <tr className="border-b-2 border-[#2196F3] bg-[#E3F2FD]">
            <td className="px-3 py-3 font-semibold text-[13px] text-[#333333] border-r border-[#e0e0e0] sticky left-0 bg-[#E3F2FD] z-10">
              Your Rates
            </td>
            <td className="px-2 py-3 border-r border-[#e0e0e0] bg-[#E3F2FD]" colSpan={2}>
              {/* Empty cells for Win/Meet/Loss and Parity Score columns */}
            </td>
            {visibleRates.map((rate, idx) => (
              <td key={idx} className="px-2 py-2 text-center text-[13px] font-semibold border-r border-[#e0e0e0] bg-[#E3F2FD]">
                {rate === 0 || !rate ? (
                  <span className="text-gray-400 font-normal">Sold Out</span>
                ) : (
                  <span className="text-[#333333]">€{rate}</span>
                )}
              </td>
            ))}
          </tr>

          {/* Channel Rows */}
          {channelNames.map((channelName, channelIdx) => {
            const distribution = getChannelParityDistribution(channelIdx);

            return (
              <tr key={channelIdx} className="border-b border-[#e0e0e0]">
                {/* Channel Name */}
                <td className="px-3 py-3 border-r border-[#e0e0e0] sticky left-0 bg-white z-10">
                  <div className="text-[12px] font-medium text-[#333333]">
                    {channelName}
                  </div>
                </td>

                {/* Win/Meet/Loss — flat colors, single row; % inside segment when wide enough */}
                <td className="border-r border-[#e0e0e0] bg-white px-2 py-2.5">
                  <div
                    className="flex h-5 overflow-hidden rounded border border-[#e8e8e8]"
                    title={`Win ${Math.round(distribution.winPercent)}% · Meet ${Math.round(distribution.meetPercent)}% · Loss ${Math.round(distribution.lossPercent)}%`}
                  >
                    {distribution.winPercent > 0 && (
                      <div
                        className="flex min-w-0 items-center justify-center bg-[#f97316]"
                        style={{ width: `${distribution.winPercent}%` }}
                      >
                        {distribution.winPercent >= 10 && (
                          <span className="text-[9px] font-semibold tabular-nums text-white">
                            {Math.round(distribution.winPercent)}%
                          </span>
                        )}
                      </div>
                    )}
                    {distribution.meetPercent > 0 && (
                      <div
                        className="flex min-w-0 items-center justify-center bg-[#22c55e]"
                        style={{ width: `${distribution.meetPercent}%` }}
                      >
                        {distribution.meetPercent >= 10 && (
                          <span className="text-[9px] font-semibold tabular-nums text-white">
                            {Math.round(distribution.meetPercent)}%
                          </span>
                        )}
                      </div>
                    )}
                    {distribution.lossPercent > 0 && (
                      <div
                        className="flex min-w-0 items-center justify-center bg-[#ef4444]"
                        style={{ width: `${distribution.lossPercent}%` }}
                      >
                        {distribution.lossPercent >= 10 && (
                          <span className="text-[9px] font-semibold tabular-nums text-white">
                            {Math.round(distribution.lossPercent)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </td>

                {/* Parity Score */}
                <td className="px-2 py-3 text-center border-r border-[#e0e0e0] bg-white">
                  <div className="text-[11px] font-semibold text-[#333333]">
                    {distribution.parityScore}%
                  </div>
                </td>

                {/* Date Cells */}
                {visibleRates.map((myRate, dateIdx) => {
                  const channelRate = getCompetitorRateForDate(channelIdx, dateOffset + dateIdx, myRate);
                  const cellDisplay = getCellDisplay(channelRate, myRate, channelIdx, dateIdx);

                  // No data available
                  if (cellDisplay.type === 'no-data') {
                    return (
                      <td key={dateIdx} className="px-2 py-3 text-center border-r border-[#e0e0e0] bg-gray-50">
                        <span className="text-[10px] text-gray-400">—</span>
                      </td>
                    );
                  }

                  // Sold out - green background, special text
                  if (cellDisplay.type === 'sold-out') {
                    return (
                      <td key={dateIdx} className="px-2 py-3 text-center border-r border-[#e0e0e0] bg-[#dcfce7]">
                        <span className="text-[11px] font-semibold text-[#166534]">Sold Out</span>
                      </td>
                    );
                  }

                  // For all other types (rate-variation with R badge, normal) - show rates with color coding
                  const isWin = cellDisplay.status === 'Win';
                  const isMeet = cellDisplay.status === 'Meet';
                  const isLoss = cellDisplay.status === 'Loss';
                  const bgColor = isWin ? '#dcfce7' : (isMeet ? '#fff7ed' : '#fee2e2');
                  const textColor = isWin ? '#166534' : (isMeet ? '#9a3412' : '#991b1b');

                  // Calculate loss amount for tooltip
                  const lossAmount = isLoss && cellDisplay.rate ? myRate - cellDisplay.rate : 0;
                  const lossPercent = isLoss && cellDisplay.rate ? Math.round(((myRate - cellDisplay.rate) / cellDisplay.rate) * 100) : 0;

                  const isHovered = hoveredCell?.channelIdx === channelIdx && hoveredCell?.dateIdx === dateIdx;

                  return (
                    <td
                      key={dateIdx}
                      className="px-2 py-3 text-center border-r border-[#e0e0e0] relative"
                      style={{ backgroundColor: bgColor }}
                      onMouseEnter={() => isLoss && setHoveredCell({ channelIdx, dateIdx })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {/* Tooltip for Loss cells — border triangle sits flush under rounded panel (no detached rotate-45 square) */}
                      {isLoss && isHovered && (
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2">
                          <div className="relative">
                            <div className="whitespace-nowrap rounded-lg bg-[#1a1d2e] px-3 py-2.5 text-[10px] text-white shadow-xl">
                              <div className="mb-1.5 border-b border-gray-700 pb-1.5 font-semibold">
                                {channelName}
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between gap-4">
                                  <span className="text-gray-400">Your Rate:</span>
                                  <span className="font-semibold">€{myRate}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-gray-400">Channel Rate:</span>
                                  <span className="font-semibold">€{cellDisplay.rate}</span>
                                </div>
                                <div className="flex justify-between gap-4 border-t border-gray-700 pt-1">
                                  <span className="text-gray-400">Loss:</span>
                                  <span className="font-semibold text-[#ef4444]">
                                    €{lossAmount} ({lossPercent}%)
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div
                              className="absolute left-1/2 top-full -translate-x-1/2"
                              style={{ marginTop: '-1px' }}
                              aria-hidden
                            >
                              <div className="h-0 w-0 border-x-[7px] border-t-[8px] border-x-transparent border-t-[#1a1d2e]" />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[11px] font-semibold" style={{ color: textColor }}>
                          €{cellDisplay.rate}
                        </span>
                        {cellDisplay.type === 'rate-variation' && (
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5" fill="none"/>
                            <text x="8" y="11" textAnchor="middle" fontSize="10" fontWeight="600" fill="#ef4444">R</text>
                          </svg>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
  );
}

function ChartCell({
  myRate,
  minRate,
  maxRate,
  myRateY,
  maxY,
  minY,
  prevMyRateY,
  nextMyRateY,
  hasPrev,
  hasNext,
  hasEvent
}: {
  myRate: number;
  minRate: number;
  maxRate: number;
  myRateY: number;
  maxY: number;
  minY: number;
  prevMyRateY: number | null;
  nextMyRateY: number | null;
  hasPrev: boolean;
  hasNext: boolean;
  hasEvent: boolean;
}) {
  const chartHeight = 112;

  return (
    <svg
      width="100%"
      height={chartHeight}
      className="overflow-hidden block max-w-full"
      preserveAspectRatio="none"
    >
        {/* Vertical range line from min to max */}
        <line
          x1="50%"
          y1={`${minY}%`}
          x2="50%"
          y2={`${maxY}%`}
          stroke="#90a4ae"
          strokeWidth="2"
        />

        {/* Max rate T-marker */}
        <line
          x1="calc(50% - 8px)"
          y1={`${maxY}%`}
          x2="calc(50% + 8px)"
          y2={`${maxY}%`}
          stroke="#4caf50"
          strokeWidth="2.5"
        />
        <circle cx="50%" cy={`${maxY}%`} r="3" fill="#4caf50" />

        {/* Min rate T-marker */}
        <line
          x1="calc(50% - 8px)"
          y1={`${minY}%`}
          x2="calc(50% + 8px)"
          y2={`${minY}%`}
          stroke="#f44336"
          strokeWidth="2.5"
        />
        <circle cx="50%" cy={`${minY}%`} r="3" fill="#f44336" />

        {/* Line from previous column to this column center */}
        {hasPrev && prevMyRateY !== null && (
          <line
            x1="0%"
            y1={`${prevMyRateY}%`}
            x2="50%"
            y2={`${myRateY}%`}
            stroke="#2196F3"
            strokeWidth="2.5"
          />
        )}

        {/* Line from this column center to next column (edge of this cell) */}
        {hasNext && nextMyRateY !== null && (
          <line
            x1="50%"
            y1={`${myRateY}%`}
            x2="100%"
            y2={`${myRateY}%`}
            stroke="#2196F3"
            strokeWidth="2.5"
          />
        )}

        {/* My rate dot */}
        <circle
          cx="50%"
          cy={`${myRateY}%`}
          r="4"
          fill="#2196F3"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
  );
}