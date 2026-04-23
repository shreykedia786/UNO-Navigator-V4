import { ChevronDown, ChevronLeft, ChevronRight, Info, X } from 'lucide-react';
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from 'react';
import { createPortal } from 'react-dom';
import { LegendIconMax, LegendIconMin, LegendIconMyRate } from './CompetitorChartLegendIcons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { cn } from './ui/utils';

const DEFAULT_INCLUSION_PLAN_NAMES = [
  'Advance Purchase (Non-Refundable)',
  'Best Available Rate (BAR)',
  'Member Exclusive Rate',
  'Bed & Breakfast Package'
];

const CHANNEL_OTA_OPTIONS = [
  'Booking.com',
  'Expedia',
  'Agoda',
  'Hotels.com',
  'Priceline',
  'Google Hotel Ads',
  'Kayak'
];

/** Max compset rows visible at once (Competitor Rate Analysis tab). */
const MAX_COMPSETS_IN_VIEW = 10;

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initialCompsetSelection(count: number): boolean[] {
  if (count <= MAX_COMPSETS_IN_VIEW) return Array.from({ length: count }, () => true);
  const next = Array.from({ length: count }, () => false);
  for (let i = 0; i < MAX_COMPSETS_IN_VIEW; i++) next[i] = true;
  return next;
}

function formatInsightDate(d: { day: string; date: string; month: string }) {
  return `${d.day}, ${d.date} ${d.month}`;
}

function getScrollableAncestors(el: HTMLElement | null): HTMLElement[] {
  const out: HTMLElement[] = [];
  let p: HTMLElement | null = el?.parentElement ?? null;
  while (p) {
    const st = getComputedStyle(p);
    if (/(auto|scroll|overlay)/.test(st.overflowY) || /(auto|scroll|overlay)/.test(st.overflowX)) {
      out.push(p);
    }
    p = p.parentElement;
  }
  return out;
}

const INSIGHT_TOOLTIP_Z = 100600;

/**
 * Fixed + portaled tooltip so drawer `overflow` does not clip it.
 * Arrow is offset so its tip stays over the hovered column when the card is edge-clamped.
 */
function InsightHoverTooltip({
  title,
  dateLabel,
  body,
  disabled,
  triggerClassName,
  children,
  panelWidth = 260,
  estimatedHeight = 230,
  visual = 'default',
  headerEnd
}: {
  title: string;
  dateLabel: string;
  body: ReactNode;
  disabled?: boolean;
  triggerClassName?: string;
  children: ReactNode;
  /** Tooltip width in px — used for viewport clamping and positioning. */
  panelWidth?: number;
  /** Estimated tooltip height — improves flip above/below when content is tall. */
  estimatedHeight?: number;
  /** Elevated = softer shadow, larger radius (parity / premium tooltips). */
  visual?: 'default' | 'elevated';
  /** Optional right column in the header (e.g. parity rate violation + label). */
  headerEnd?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{
    centerX: number;
    top: number;
    anchorCx: number;
    placement: 'above' | 'below';
  } | null>(null);

  const recalc = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const anchorCx = r.left + r.width / 2;
    const tooltipW = panelWidth;
    const margin = 10;
    const centerX = Math.min(
      window.innerWidth - tooltipW / 2 - margin,
      Math.max(tooltipW / 2 + margin, anchorCx)
    );
    const gap = 8;
    const estH = estimatedHeight;
    const spaceAbove = r.top;
    const spaceBelow = window.innerHeight - r.bottom;
    const preferAbove = spaceAbove >= estH + margin || spaceAbove >= spaceBelow;
    const placement: 'above' | 'below' = preferAbove ? 'above' : 'below';
    const top = placement === 'above' ? r.top - gap : r.bottom + gap;
    setPos({ centerX, top, anchorCx, placement });
  }, [panelWidth, estimatedHeight]);

  useLayoutEffect(() => {
    if (!open || disabled) {
      setPos(null);
      return;
    }
    recalc();
    const el = anchorRef.current;
    const scrollHosts = el ? getScrollableAncestors(el) : [];
    const onMove = () => recalc();
    scrollHosts.forEach((n) => n.addEventListener('scroll', onMove, { passive: true }));
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      scrollHosts.forEach((n) => n.removeEventListener('scroll', onMove));
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open, disabled, recalc]);

  const arrowShift = pos ? pos.anchorCx - pos.centerX : 0;

  return (
    <>
      <div
        ref={anchorRef}
        className={
          triggerClassName ??
          'relative flex min-h-[1.25rem] w-full min-w-0 items-center justify-center py-0.5'
        }
        onMouseEnter={() => !disabled && setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {children}
      </div>
      {open &&
        !disabled &&
        pos &&
        createPortal(
          <div
            className="pointer-events-none fixed max-w-[calc(100vw-16px)]"
            style={{
              zIndex: INSIGHT_TOOLTIP_Z,
              left: pos.centerX,
              top: pos.top,
              width: panelWidth,
              transform: pos.placement === 'above' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)'
            }}
          >
            <div
              className={cn(
                'relative text-left',
                visual === 'elevated'
                  ? 'rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_20px_50px_-16px_rgba(15,23,42,0.28)] ring-1 ring-slate-950/[0.04]'
                  : 'rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-xl'
              )}
            >
              {pos.placement === 'below' && (
                <>
                  <div
                    className="absolute z-10 h-0 w-0"
                    style={{
                      left: `calc(50% + ${arrowShift}px)`,
                      top: 0,
                      transform: 'translate(-50%, -100%)',
                      borderLeft: '7px solid transparent',
                      borderRight: '7px solid transparent',
                      borderBottom: visual === 'elevated' ? '8px solid rgb(226 232 240 / 0.85)' : '8px solid #e5e7eb'
                    }}
                    aria-hidden
                  />
                  <div
                    className="absolute z-10 h-0 w-0"
                    style={{
                      left: `calc(50% + ${arrowShift}px)`,
                      top: 1,
                      transform: 'translate(-50%, -100%)',
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderBottom: '7px solid white'
                    }}
                    aria-hidden
                  />
                </>
              )}
              {headerEnd ? (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 pr-1">
                    <div
                      className={cn(
                        'font-semibold leading-tight',
                        visual === 'elevated'
                          ? 'text-[12px] tracking-tight text-slate-900'
                          : 'text-[11px] text-[#333333]'
                      )}
                    >
                      {title}
                    </div>
                    {dateLabel ? (
                      <div
                        className={cn(
                          'mt-0.5 leading-snug',
                          visual === 'elevated'
                            ? 'text-[10px] font-medium text-slate-500'
                            : 'text-[10px] text-gray-500'
                        )}
                      >
                        {dateLabel}
                      </div>
                    ) : null}
                  </div>
                  <div className="shrink-0 pt-px">{headerEnd}</div>
                </div>
              ) : (
                <>
                  <div
                    className={cn(
                      'font-semibold leading-tight',
                      visual === 'elevated'
                        ? 'text-[12px] tracking-tight text-slate-900'
                        : 'text-[11px] text-[#333333]'
                    )}
                  >
                    {title}
                  </div>
                  {dateLabel ? (
                    <div
                      className={cn(
                        'leading-snug',
                        visual === 'elevated'
                          ? 'mt-0.5 text-[10px] font-medium text-slate-500'
                          : 'mt-0.5 text-[10px] text-gray-500'
                      )}
                    >
                      {dateLabel}
                    </div>
                  ) : null}
                </>
              )}
              {visual === 'elevated' ? (
                <div
                  className="mt-2.5 h-px w-full bg-gradient-to-r from-transparent via-slate-200/90 to-transparent"
                  aria-hidden
                />
              ) : null}
              {body}
              {pos.placement === 'above' && (
                <>
                  <div
                    className="absolute z-10 h-0 w-0"
                    style={{
                      left: `calc(50% + ${arrowShift}px)`,
                      bottom: 0,
                      transform: 'translate(-50%, calc(100% - 1px))',
                      borderLeft: '7px solid transparent',
                      borderRight: '7px solid transparent',
                      borderTop: visual === 'elevated' ? '8px solid rgb(226 232 240 / 0.85)' : '8px solid #e5e7eb'
                    }}
                    aria-hidden
                  />
                  <div
                    className="absolute z-10 h-0 w-0"
                    style={{
                      left: `calc(50% + ${arrowShift}px)`,
                      bottom: 1,
                      transform: 'translate(-50%, 100%)',
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: '7px solid white'
                    }}
                    aria-hidden
                  />
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function parityPillPercent(
  myRate: number,
  channelRate: number,
  status: 'Win' | 'Meet' | 'Loss'
): number {
  if (myRate <= 0 || channelRate <= 0) return 0;
  if (status === 'Loss') return Math.min(999, Math.round(((myRate - channelRate) / channelRate) * 100));
  if (status === 'Win') return Math.min(999, Math.round(((channelRate - myRate) / channelRate) * 100));
  return Math.min(999, Math.round((Math.abs(channelRate - myRate) / myRate) * 100));
}

function ParityRateViolationBadgeIcon({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 12 : 14;
  return (
    <svg width={dim} height={dim} viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden>
      <circle cx="8" cy="8" r="7" stroke="#dc2626" strokeWidth="1.5" fill="none" />
      <text x="8" y="11" textAnchor="middle" fontSize="10" fontWeight="600" fill="#dc2626">
        R
      </text>
    </svg>
  );
}

/** Header chip — flat surface, no gradients (reads cleaner at small sizes). */
function ParityTooltipHeaderRateViolation() {
  return (
    <div
      role="status"
      aria-label="Rate violation"
      title="Channel rate diverges from your benchmark beyond tolerance."
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-rose-200/90 bg-rose-50 py-1 pl-1 pr-2.5 shadow-sm"
    >
      <span
        className="flex size-[15px] shrink-0 items-center justify-center rounded-full bg-rose-600 text-[8px] font-bold leading-none text-white"
        aria-hidden
      >
        R
      </span>
      <span className="text-[10px] font-semibold leading-none tracking-tight text-rose-900">Rate violation</span>
    </div>
  );
}

/** Parity tab OTA cell — two-column rates + outcome strip (rate violation lives in tooltip header). */
function ParityTooltipModernBody({
  myRate,
  channelRate,
  channelSiteLabel,
  yourPlan,
  channelPlan,
  showPlans,
  status,
  gapPct,
  isLoss,
  lossAmount,
  lossPercent,
  isWin,
  winAmount,
  winPercent
}: {
  myRate: number;
  channelRate: number;
  /** Shown under channel price (same role as Brand.com under your rate). */
  channelSiteLabel: string;
  yourPlan: string;
  channelPlan: string;
  showPlans: boolean;
  status: 'Win' | 'Meet' | 'Loss';
  gapPct: number;
  isLoss: boolean;
  lossAmount: number;
  lossPercent: number;
  isWin: boolean;
  /** Channel rate − your rate when Win (favourable spread). */
  winAmount: number;
  winPercent: number;
}) {
  const statusChip =
    status === 'Loss'
      ? 'bg-rose-100 text-rose-900 ring-1 ring-rose-200/80'
      : status === 'Win'
        ? 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80'
        : 'bg-amber-100 text-amber-950 ring-1 ring-amber-200/80';

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-gradient-to-b from-slate-50 to-white p-2.5 shadow-sm ring-1 ring-slate-200/70">
          <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">Your rate</div>
          <div className="mt-0.5 text-[17px] font-semibold tabular-nums tracking-tight text-slate-900">€{myRate}</div>
          <div className="text-[8px] font-medium text-slate-400">Brand.com</div>
          {showPlans ? (
            <p className="m-0 mt-1.5 border-t border-slate-200/70 pt-1.5 text-[10px] leading-snug text-slate-700 line-clamp-2">
              {yourPlan}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl bg-gradient-to-b from-slate-50 to-white p-2.5 shadow-sm ring-1 ring-slate-200/70">
          <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">Channel</div>
          <div className="mt-0.5 text-[17px] font-semibold tabular-nums tracking-tight text-slate-900">€{channelRate}</div>
          <div className="line-clamp-1 text-[8px] font-medium text-slate-400">{channelSiteLabel}</div>
          {showPlans ? (
            <p className="m-0 mt-1.5 border-t border-slate-200/70 pt-1.5 text-[10px] leading-snug text-slate-700 line-clamp-2">
              {channelPlan}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200/70"
        role="status"
      >
        <span className={cn('rounded-lg px-2.5 py-1 text-[11px] font-semibold', statusChip)}>{status}</span>
        <span className="text-[11px] font-medium text-slate-600">
          Gap <span className="tabular-nums font-semibold text-slate-900">{gapPct}%</span>
        </span>
        {isLoss ? (
          <span className="ml-auto text-[12px] font-semibold tabular-nums text-rose-600">
            €{lossAmount}{' '}
            <span className="text-[11px] font-semibold text-rose-500/95">({lossPercent}%)</span>
          </span>
        ) : null}
        {isWin && winAmount > 0 ? (
          <span className="ml-auto text-[12px] font-semibold tabular-nums text-emerald-700">
            €{winAmount}{' '}
            <span className="text-[11px] font-semibold text-emerald-600/95">({winPercent}%)</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Same as main chart panel (`RateCandlestickChart` onboarding blue on logo). */
const NAVIGATOR_LOGO_BRAND_FILTER =
  'brightness(0) saturate(100%) invert(29%) sepia(90%) saturate(6194%) hue-rotate(225deg) brightness(98%) contrast(101%)';

/** Same copy as the chart tooltip (Your rate section). */
function NavigatorYourRatesDisclaimer({ className }: { className?: string }) {
  return (
    <div className={`min-w-0 ${className ?? ''}`}>
      <div className="flex items-start gap-1.5">
        <Info
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400"
          strokeWidth={2.25}
          aria-hidden
        />
        <p className="m-0 text-[11px] leading-snug text-gray-600">
          Your rate here may differ from your UNO (ARI) rate, as it is sourced from{' '}
          <span className="font-medium text-gray-800">Navigator</span>.
        </p>
      </div>
    </div>
  );
}

/** Parity “Your Rates” sticky column — compact glass pill, top-right. */
function ParityBenchmarkChip() {
  return (
    <span
      className="absolute right-2 top-2 z-[1] inline-flex items-center gap-1 rounded-full border border-white/90 bg-gradient-to-br from-white via-white to-sky-50/70 py-1 pl-1.5 pr-2 shadow-[0_2px_12px_rgba(14,116,194,0.14),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-sky-500/20 backdrop-blur-sm"
      role="note"
      title="Your published rates are the benchmark for parity comparison across channels."
    >
      <span
        className="size-1.5 shrink-0 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_0_10px_rgba(56,189,248,0.55)]"
        aria-hidden
      />
      <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-600">
        Benchmark
      </span>
      <span className="sr-only">: your rates are the reference for parity comparison.</span>
    </span>
  );
}

/** Parity tab only — Win/Meet/Loss and violation glyphs; lives in drawer footer next to Navigator branding. */
function ParityStatusLegendFooter({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex min-w-0 max-w-full flex-wrap items-center justify-end gap-x-4 gap-y-1.5 sm:gap-x-5',
        className
      )}
      aria-label="Parity legend"
    >
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-4 shrink-0 rounded-sm bg-[#f97316]" />
        <span className="text-[10px] text-[#666666] sm:text-[11px]">Win</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-4 shrink-0 rounded-sm bg-[#22c55e]" />
        <span className="text-[10px] text-[#666666] sm:text-[11px]">Meet</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-4 shrink-0 rounded-sm bg-[#ef4444]" />
        <span className="text-[10px] text-[#666666] sm:text-[11px]">Loss</span>
      </div>
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 sm:h-4 sm:w-4">
          <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5" fill="none" />
          <text x="8" y="11" textAnchor="middle" fontSize="10" fontWeight="600" fill="#ef4444">
            R
          </text>
        </svg>
        <span className="text-[10px] text-[#666666] sm:text-[11px]">Rate violation</span>
      </div>
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 sm:h-4 sm:w-4">
          <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5" fill="none" />
          <text x="8" y="11" textAnchor="middle" fontSize="10" fontWeight="600" fill="#ef4444">
            A
          </text>
        </svg>
        <span className="text-[10px] text-[#666666] sm:text-[11px]">Availability violation</span>
      </div>
    </div>
  );
}

function CompetitorRateInsightCell({
  compRate,
  inclusionPlanName,
  channelName,
  competitorName,
  dateLabel,
  children
}: {
  compRate: number | null;
  inclusionPlanName: string;
  channelName: string;
  competitorName: string;
  dateLabel: string;
  children: ReactNode;
}) {
  if (compRate === null) {
    return <span className="text-gray-400 text-[13px]">Sold Out</span>;
  }

  return (
    <InsightHoverTooltip
      title={competitorName}
      dateLabel={dateLabel}
      body={
        <dl className="m-0 mt-1.5 space-y-1.5 border-t border-gray-100 pt-1.5 text-[10px] leading-snug text-gray-700">
          <div className="flex gap-3">
            <dt className="shrink-0 text-gray-500">Rate</dt>
            <dd className="min-w-0 flex-1 text-right font-medium tabular-nums text-[#333333]">€{compRate}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="shrink-0 text-gray-500">Inclusion</dt>
            <dd className="min-w-0 flex-1 text-right font-medium text-[#333333]">{inclusionPlanName}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="shrink-0 text-gray-500">Channel</dt>
            <dd className="min-w-0 flex-1 text-right font-medium text-[#333333]">{channelName}</dd>
          </div>
        </dl>
      }
    >
      {children}
    </InsightHoverTooltip>
  );
}

/** Tooltip for the blue "Your Rates" row — rate under hover, inclusion, channel. */
function YourRatesRowTooltipCell({
  roomTitle,
  dateLabel,
  yourRate,
  soldOut,
  inclusionPlanName,
  channelName,
  children
}: {
  roomTitle: string;
  dateLabel: string;
  yourRate: number;
  soldOut: boolean;
  inclusionPlanName: string;
  channelName: string;
  children: ReactNode;
}) {
  return (
    <InsightHoverTooltip
      title={roomTitle}
      dateLabel={dateLabel}
      triggerClassName="relative flex min-h-[1.75rem] w-full min-w-0 items-center justify-center py-0.5"
      body={
        <dl className="m-0 mt-1.5 space-y-1.5 border-t border-gray-100 pt-1.5 text-[10px] leading-snug text-gray-700">
          <div className="flex gap-3">
            <dt className="shrink-0 text-gray-500">Rate</dt>
            <dd className="min-w-0 flex-1 text-right font-medium tabular-nums text-[#333333]">
              {soldOut ? '—' : `€${yourRate}`}
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="shrink-0 text-gray-500">Inclusion</dt>
            <dd className="min-w-0 flex-1 text-right font-medium text-[#333333]">{inclusionPlanName}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="shrink-0 text-gray-500">Channel</dt>
            <dd className="min-w-0 flex-1 text-right font-medium text-[#333333]">{channelName}</dd>
          </div>
        </dl>
      }
    >
      {children}
    </InsightHoverTooltip>
  );
}

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
  /** Rate plan names for the Inclusions filter (after "Any"). */
  inclusionPlanNames?: string[];
  ratePlan?: string;
  events?: Array<EventData | null>;
  /** Suite: editable Your Rates on Competitor tab only; Parity tab always shows read-only rates. */
  editableYourRates?: boolean;
  onYourRateChange?: (globalDateIndex: number, rawValue: string) => void;
  onClose: () => void;
}

/** Compset rows in the Competitor tab table — same list powers the Compsets dropdown (max 10 visible at once). */
const competitors = [
  { name: 'Central Hotel', color: '#4caf50' },
  { name: 'Hotel Palermitano by DecO', color: '#2196F3' },
  { name: 'The Belgrove Hotel', color: '#9c27b0' },
  { name: 'Fairway Hotel', color: '#ff9800' },
  { name: 'Princess Hotel', color: '#f44336' },
  { name: 'Jesmond Dene Hotel', color: '#795548' },
  { name: 'Scandic Stavanger Airport', color: '#607d8b' },
  { name: 'Scandic Flesland Airport', color: '#009688' },
  { name: 'Oceanview Suites', color: '#e91e63' },
  { name: 'Harbor Grand Hotel', color: '#3f51b5' },
  { name: 'City Inn Express', color: '#9e9d24' },
  { name: 'Bayfront Plaza', color: '#00bcd4' },
  { name: 'Marina Bay Resort', color: '#ff5722' },
  { name: 'Old Town Boutique', color: '#673ab7' },
  { name: 'Airport Express Inn', color: '#8bc34a' },
  { name: 'Grand Plaza Suites', color: '#ffc107' }
];

/** Custom portal picker — Radix Popover/Dropdown conflict with the slide-over backdrop + overflow; fixed layer avoids that. */
const COMPSET_PICKER_Z_INDEX = 200000;

type CompsetRowDef = { name: string; color: string };

function CompsetPickerDropdown({
  competitors: compsetRows,
  compsetSelection,
  toggleCompset,
  selectedCompsetCount
}: {
  competitors: CompsetRowDef[];
  compsetSelection: boolean[];
  toggleCompset: (index: number) => void;
  selectedCompsetCount: number;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);

  const place = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 16);
    let left = r.right - width;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    setBox({ top: r.bottom + 6, left, width });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setBox(null);
      return;
    }
    place();
    const t = () => place();
    window.addEventListener('resize', t);
    window.addEventListener('scroll', t, true);
    return () => {
      window.removeEventListener('resize', t);
      window.removeEventListener('scroll', t, true);
    };
  }, [open, place]);

  useLayoutEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      const n = e.target as Node;
      if (wrapRef.current?.contains(n) || panelRef.current?.contains(n)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', down, true);
    return () => document.removeEventListener('mousedown', down, true);
  }, [open]);

  return (
    <div ref={wrapRef} className="inline-flex w-[min(220px,42vw)] max-w-[260px] min-w-0">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 min-w-0 flex-1 justify-between gap-1 border-[#d0d0d0] bg-white px-2 text-[12px] font-semibold text-[#333333]"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <span className="min-w-0 truncate">
          {selectedCompsetCount} selected (max {MAX_COMPSETS_IN_VIEW})
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </Button>
      {open &&
        box &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            className="fixed max-h-[min(320px,55vh)] overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 shadow-xl"
            style={{
              zIndex: COMPSET_PICKER_Z_INDEX,
              top: box.top,
              left: box.left,
              width: box.width
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p className="mb-2.5 text-[11px] leading-snug text-gray-600">
              Pick up to {MAX_COMPSETS_IN_VIEW} compsets; uncheck one to enable another when at the limit.
            </p>
            <ul className="m-0 max-h-[min(260px,45vh)] list-none space-y-2 overflow-y-auto p-0 pr-0.5">
              {compsetRows.map((c, idx) => {
                const atCap = !compsetSelection[idx] && selectedCompsetCount >= MAX_COMPSETS_IN_VIEW;
                return (
                  <li key={c.name} className="flex items-start gap-2">
                    <Checkbox
                      id={`compset-picker-${idx}`}
                      checked={compsetSelection[idx]}
                      onCheckedChange={() => toggleCompset(idx)}
                      disabled={atCap}
                    />
                    <Label
                      htmlFor={`compset-picker-${idx}`}
                      className="cursor-pointer text-left text-[12px] font-normal leading-tight text-[#333333]"
                    >
                      {c.name}
                    </Label>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}

export function DetailedCompetitorModal({
  dates,
  rates,
  chartData,
  roomType = 'Standard Room',
  inclusionPlanNames,
  ratePlan = 'Best Available Rate (BAR)',
  events,
  editableYourRates = false,
  onYourRateChange,
  onClose
}: DetailedCompetitorModalProps) {
  const [dateOffset, setDateOffset] = useState(0);
  const [activeTab, setActiveTab] = useState<'competitor' | 'parity'>('competitor');
  const [isClosing, setIsClosing] = useState(false);
  const [inclusionFilter, setInclusionFilter] = useState('any');
  const [channelFilter, setChannelFilter] = useState('any');
  const [compsetSelection, setCompsetSelection] = useState(() => initialCompsetSelection(competitors.length));

  const inclusionPlans = inclusionPlanNames?.length ? inclusionPlanNames : DEFAULT_INCLUSION_PLAN_NAMES;

  const ratePlanSelectControl = useMemo(
    () => (
      <Select value={inclusionFilter} onValueChange={setInclusionFilter}>
        <SelectTrigger
          size="sm"
          className="h-8 w-[min(220px,42vw)] max-w-[260px] text-[12px] font-semibold text-[#333333] bg-white border-[#d0d0d0]"
        >
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent className="z-[10050]">
          <SelectItem value="any" className="text-[12px]">
            Any (cheapest rate plan)
          </SelectItem>
          {inclusionPlans.map((name) => (
            <SelectItem key={name} value={name} className="text-[12px]">
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
    [inclusionFilter, inclusionPlans]
  );

  /** Tooltip: rate plan driving the subscriber value (specific plan, or simulated cheapest when filter is Any). */
  const resolveTooltipInclusionPlan = useCallback(
    (compIdx: number, globalDateIdx: number) => {
      if (inclusionFilter !== 'any') return inclusionFilter;
      if (inclusionPlans.length === 0) return DEFAULT_INCLUSION_PLAN_NAMES[0];
      const i = (compIdx * 19 + globalDateIdx * 13 + 7) % inclusionPlans.length;
      return inclusionPlans[i];
    },
    [inclusionFilter, inclusionPlans]
  );

  /** Tooltip: channel where the subscriber rate is cheapest (specific OTA when filtered, else simulated per compset/day). */
  const resolveTooltipChannel = useCallback(
    (compIdx: number, globalDateIdx: number) => {
      if (channelFilter !== 'any') return channelFilter;
      const i = (compIdx * 31 + globalDateIdx * 17 + 3) % CHANNEL_OTA_OPTIONS.length;
      return CHANNEL_OTA_OPTIONS[i];
    },
    [channelFilter]
  );

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
  /** Used so stacked header + compset tables share width and one horizontal scroll track. */
  const competitorTableMinWidthPx = 180 + 110 * visibleDates.length;

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

  /**
   * Demo rates: default (Inclusions = Any, Channels = Any) biases toward the cheapest offers across compsets.
   * Specific inclusion/channel shifts rates for apple-to-apple comparison.
   */
  const getCompetitorRateForDate = useCallback(
    (competitorIndex: number, dateIndex: number, _myRate: number) => {
      const seed = competitorIndex * 1000 + dateIndex;
      const dateData = chartData[dateIndex];
      if (!dateData) return null;

      if (seed % 29 === 0) return null;

      const minRate = dateData.min;
      const maxRate = dateData.max;
      const range = maxRate - minRate;
      const variance = (seed % 97) / 97;

      // Parity tab has no channel filter — always use broad (cheapest-channel-style) demo rates.
      const channelKey = activeTab === 'parity' ? 'any' : channelFilter;
      const broadView = inclusionFilter === 'any' && channelKey === 'any';
      const t = broadView ? variance * 0.42 : variance;
      let rate = Math.round(minRate + range * t);

      if (!broadView) {
        const incAdj = inclusionFilter !== 'any' ? (strHash(inclusionFilter) % 11) - 5 : 0;
        const chAdj = channelKey !== 'any' ? (strHash(channelKey) % 9) - 4 : 0;
        rate = Math.round(rate + incAdj + chAdj);
        rate = Math.min(maxRate + 25, Math.max(minRate - 25, rate));
      }

      return rate;
    },
    [chartData, inclusionFilter, channelFilter, activeTab]
  );

  /** Rate plan driving the simulated channel rate for a parity matrix cell. */
  const resolveParityCellRatePlan = useCallback(
    (channelIdx: number, globalDateIdx: number) => {
      if (inclusionFilter !== 'any') return inclusionFilter;
      if (inclusionPlans.length === 0) return DEFAULT_INCLUSION_PLAN_NAMES[0];
      const i = (channelIdx * 19 + globalDateIdx * 13 + 7) % inclusionPlans.length;
      return inclusionPlans[i];
    },
    [inclusionFilter, inclusionPlans]
  );

  /** Same inclusion name as competitor “Your Rates” row tooltips (plan list + per-stay-date when Any). */
  const resolveParityYourRatePlan = useCallback(
    (globalDateIdx: number) => resolveTooltipInclusionPlan(0, globalDateIdx),
    [resolveTooltipInclusionPlan]
  );

  const competitorRatesMatrix = useMemo(() => {
    const matrix: Array<Array<number | null>> = [];
    for (let dateIdx = 0; dateIdx < visibleRates.length; dateIdx++) {
      const row: Array<number | null> = [];
      for (let compIdx = 0; compIdx < competitors.length; compIdx++) {
        row.push(getCompetitorRateForDate(compIdx, dateOffset + dateIdx, visibleRates[dateIdx]));
      }
      matrix.push(row);
    }
    return matrix;
  }, [visibleRates, dateOffset, getCompetitorRateForDate, competitors.length]);

  /** Min/max for highlighting — among selected compsets only. */
  const actualMinMaxPerDate = useMemo(() => {
    return competitorRatesMatrix.map((row) => {
      let actualMin: number | null = null;
      let actualMax: number | null = null;
      for (let compIdx = 0; compIdx < row.length; compIdx++) {
        if (!compsetSelection[compIdx]) continue;
        const rate = row[compIdx];
        if (rate !== null) {
          if (actualMin === null || rate < actualMin) actualMin = rate;
          if (actualMax === null || rate > actualMax) actualMax = rate;
        }
      }
      return { min: actualMin, max: actualMax };
    });
  }, [competitorRatesMatrix, compsetSelection]);

  const avgCompsetPerDate = useMemo(() => {
    return competitorRatesMatrix.map((row) => {
      const vals = row.filter((r, i) => compsetSelection[i] && r !== null) as number[];
      if (vals.length === 0) return null;
      return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    });
  }, [competitorRatesMatrix, compsetSelection]);

  const selectedCompsetCount = useMemo(
    () => compsetSelection.filter(Boolean).length,
    [compsetSelection]
  );

  const toggleCompset = (index: number) => {
    setCompsetSelection((prev) => {
      const count = prev.filter(Boolean).length;
      const next = [...prev];
      if (next[index]) {
        if (count <= 1) return prev;
        next[index] = false;
        return next;
      }
      if (count >= MAX_COMPSETS_IN_VIEW) return prev;
      next[index] = true;
      return next;
    });
  };

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

          {/* Tabs — pr matches close control inset */}
          <div className="flex items-center gap-4 px-6 pt-4 pr-14">
            <div className="flex min-w-0 gap-6 sm:gap-8">
              <button
                onClick={() => {
                  setActiveTab('competitor');
                  setDateOffset(0);
                }}
                className={`shrink-0 pb-3 pt-3 text-[14px] font-medium transition-colors border-b-2 ${
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
                className={`shrink-0 pb-3 pt-3 text-[14px] font-medium transition-colors border-b-2 ${
                  activeTab === 'parity'
                    ? 'text-[#2196F3] border-[#2196F3]'
                    : 'text-[#666666] border-transparent hover:text-[#333333]'
                }`}
              >
                Parity Analysis
              </button>
            </div>
          </div>

          {/* Room name + filters — same layout rules on both tabs so title and controls stay aligned */}
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-3">
              <div className="flex min-w-0 basis-full flex-col gap-1.5 pr-0 sm:basis-0 sm:flex-1 sm:pr-4">
                <h2 className="m-0 text-[16px] font-semibold leading-tight text-[#333333]">
                  {roomType}
                </h2>
                <NavigatorYourRatesDisclaimer />
              </div>
              <div className="flex min-w-0 basis-full flex-wrap items-start justify-end gap-x-4 gap-y-2 sm:basis-auto sm:justify-end">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[10px] font-medium text-[#666666] uppercase tracking-wide">Rate plan</span>
                  {ratePlanSelectControl}
                </div>
                {activeTab === 'competitor' && (
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[10px] font-medium text-[#666666] uppercase tracking-wide">Channels</span>
                    <Select value={channelFilter} onValueChange={setChannelFilter}>
                      <SelectTrigger
                        size="sm"
                        className="h-8 w-[min(220px,42vw)] max-w-[260px] text-[12px] font-semibold text-[#333333] bg-white border-[#d0d0d0]"
                      >
                        <SelectValue placeholder="Any (Cheapest Channel)" />
                      </SelectTrigger>
                      <SelectContent className="z-[10050]">
                        <SelectItem value="any" className="text-[12px]">
                          Any (Cheapest Channel)
                        </SelectItem>
                        {CHANNEL_OTA_OPTIONS.map((name) => (
                          <SelectItem key={name} value={name} className="text-[12px]">
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {activeTab === 'competitor' && (
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[10px] font-medium text-[#666666] uppercase tracking-wide">
                      Compsets
                    </span>
                    <CompsetPickerDropdown
                      competitors={competitors}
                      compsetSelection={compsetSelection}
                      toggleCompset={toggleCompset}
                      selectedCompsetCount={selectedCompsetCount}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content with Navigation Arrows — competitor tab uses inner vertical scroll for compset rows only */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
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
              className={`absolute left-[440px] top-[14.5px] z-20 w-7 h-10 flex items-center justify-center bg-white border border-[#e0e0e0] hover:bg-gray-50 transition-colors ${!canGoPrevious ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              className={`absolute right-[10px] top-[14.5px] z-20 w-7 h-10 flex items-center justify-center bg-white border border-[#e0e0e0] hover:bg-gray-50 transition-colors ${!canGoNext ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <ChevronRight className="w-4 h-4 text-[#999999]" />
            </button>
          )}

          {/* Competitor Rate Analysis: dates / your rates / chart / avg stay fixed; compset rows scroll vertically */}
          {activeTab === 'competitor' && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex min-h-0 flex-1 flex-col overflow-x-auto">
                <div className="shrink-0 bg-white">
                  <table
                    className="w-full border-collapse"
                    style={{ tableLayout: 'fixed', minWidth: competitorTableMinWidthPx }}
                  >
                    <colgroup>
                      <col style={{ width: '180px' }} />
                      {visibleDates.map((_, idx) => (
                        <col key={idx} style={{ width: '110px' }} />
                      ))}
                    </colgroup>
                    {/* Date headers — no vertical scroll in this block */}
                    <thead>
                      <tr className="border-b border-[#e0e0e0]">
                        <th className="px-4 py-3 text-left border-r border-[#e0e0e0] bg-[#f5f5f5]">
                          {/* Empty cell for the first column */}
                        </th>
                        {visibleDates.map((date, idx) => {
                          return (
                            <th key={idx} className="px-3 py-2.5 border-r border-[#e0e0e0] bg-[#f5f5f5]">
                              <div className="text-[12px] font-semibold text-[#333333]">{date.day}</div>
                              <div className="mt-0.5 flex items-center justify-center gap-1">
                                <span className="text-[11px] text-gray-600">
                                  {date.date} {date.month}
                                </span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>

                    <tbody>
                      {/* Your Rates Row */}
                      <tr className="border-b border-[#e0e0e0] bg-[#e3f2fd]">
                        <td className="sticky left-0 z-10 border-r border-[#e0e0e0] bg-[#e3f2fd] px-4 py-3 text-[13px] font-bold text-[#333333]">
                          Your Rates
                        </td>
                {visibleRates.map((rate, idx) => {
                  const globalIdx = dateOffset + idx;
                  const soldOut = rate === 0 || !rate;

                  return (
                    <td key={idx} className="px-3 py-2 text-center text-[13px] font-semibold border-r border-[#e0e0e0]">
                      <YourRatesRowTooltipCell
                        roomTitle={roomType}
                        dateLabel={
                          visibleDates[idx] ? formatInsightDate(visibleDates[idx]) : ''
                        }
                        yourRate={rate}
                        soldOut={soldOut}
                        inclusionPlanName={resolveTooltipInclusionPlan(0, globalIdx)}
                        channelName={resolveTooltipChannel(0, globalIdx)}
                      >
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
                        ) : soldOut ? (
                          <span className="text-gray-400 font-normal">Sold Out</span>
                        ) : (
                          <span className="text-[#333333]">€{rate}</span>
                        )}
                      </YourRatesRowTooltipCell>
                    </td>
                  );
                })}
              </tr>

                      {/* Chart row with legend */}
                      <tr className="border-b border-[#e0e0e0]">
                        <td className="sticky left-0 z-10 border-r border-[#e0e0e0] bg-white px-3 py-3 align-top">
                  <p className="sr-only">
                    Legend — Competitor chart: max and min OTA range, your rate on the spine.
                  </p>
                  <div
                    className="rounded-lg border border-slate-200/70 bg-white px-2.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                    role="group"
                    aria-label="Competitor chart legend"
                  >
                    <div className="mb-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Competitor
                    </div>
                    <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[10px] leading-none text-slate-600">
                      <li className="flex items-center gap-1.5">
                        <LegendIconMax className="h-[18px] w-[14px] shrink-0" />
                        <span className="font-medium text-slate-700">Max</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <LegendIconMyRate className="h-[18px] w-[14px] shrink-0" />
                        <span className="font-medium text-slate-700">My rate</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <LegendIconMin className="h-[18px] w-[14px] shrink-0" />
                        <span className="font-medium text-slate-700">Min</span>
                      </li>
                    </ul>
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
                    <td key={idx} className="px-0 py-2 border-r border-[#e0e0e0] bg-white relative align-middle w-full overflow-visible">
                      <div className="flex items-center justify-center w-full pt-1 pb-2">
                        <ChartCell
                          date={data.date}
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

                      {/* Average competitor rates — selected compsets only */}
                      <tr className="border-b-2 border-[#d4d8de] bg-[#e2e5ea]">
                        <td className="sticky left-0 z-10 border-r border-[#d4d8de] bg-[#e2e5ea] px-4 py-3 text-[13px] font-semibold text-[#333333]">
                          Avg. Compset Rates
                        </td>
                        {visibleRates.map((_myRate, dateIdx) => {
                          const avgRate = avgCompsetPerDate[dateIdx];

                          return (
                            <td
                              key={dateIdx}
                              className="border-r border-[#d4d8de] bg-[#e2e5ea] px-3 py-3 text-center text-[14px] font-semibold"
                            >
                              {avgRate === null ? (
                                <span className="text-[13px] font-normal text-gray-400">N/A</span>
                              ) : (
                                <span className="text-black">€{avgRate}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto border-t border-[#e8eaed] bg-white">
                  <table
                    className="w-full border-collapse"
                    style={{ tableLayout: 'fixed', minWidth: competitorTableMinWidthPx }}
                  >
                    <colgroup>
                      <col style={{ width: '180px' }} />
                      {visibleDates.map((_, idx) => (
                        <col key={`compset-scroll-${idx}`} style={{ width: '110px' }} />
                      ))}
                    </colgroup>
                    <tbody>
                      {/* Competitor rows — shown compsets only (this block scrolls vertically) */}
                      {competitors.map((competitor, compIdx) => {
                        if (!compsetSelection[compIdx]) return null;
                        return (
                          <tr key={compIdx} className="border-b border-[#e0e0e0] hover:bg-gray-50">
                            <td className="sticky left-0 z-20 border-r border-[#e0e0e0] bg-white px-4 py-3 text-[13px] text-[#333333] hover:bg-gray-50">
                              {competitor.name}
                            </td>
                            {visibleRates.map((_myRate, dateIdx) => {
                              const compRate = competitorRatesMatrix[dateIdx][compIdx];
                              const actualMinMax = actualMinMaxPerDate[dateIdx];
                              const isMaxRate =
                                compRate !== null &&
                                actualMinMax.max !== null &&
                                compRate === actualMinMax.max;
                              const isMinRate =
                                compRate !== null &&
                                actualMinMax.min !== null &&
                                compRate === actualMinMax.min;

                              return (
                                <td
                                  key={dateIdx}
                                  className="border-r border-[#e0e0e0] px-2 py-2 text-center text-[14px]"
                                >
                                  <CompetitorRateInsightCell
                                    compRate={compRate}
                                    inclusionPlanName={resolveTooltipInclusionPlan(
                                      compIdx,
                                      dateOffset + dateIdx
                                    )}
                                    channelName={resolveTooltipChannel(compIdx, dateOffset + dateIdx)}
                                    competitorName={competitor.name}
                                    dateLabel={
                                      visibleDates[dateIdx]
                                        ? formatInsightDate(visibleDates[dateIdx])
                                        : ''
                                    }
                                  >
                                    {compRate === null ? null : isMaxRate ? (
                                      <span className="text-[14px] font-bold text-[#f44336]">
                                        €{compRate}
                                      </span>
                                    ) : isMinRate ? (
                                      <span className="text-[14px] font-bold text-[#4caf50]">
                                        €{compRate}
                                      </span>
                                    ) : (
                                      <span className="text-[14px] text-[#333333]">€{compRate}</span>
                                    )}
                                  </CompetitorRateInsightCell>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Parity Analysis Tab Content */}
          {activeTab === 'parity' && (
            <ParityAnalysisContent
              visibleDates={visibleDates}
              visibleRates={visibleRates}
              dateOffset={dateOffset}
              getCompetitorRateForDate={getCompetitorRateForDate}
              resolveParityCellRatePlan={resolveParityCellRatePlan}
              resolveParityYourRatePlan={resolveParityYourRatePlan}
              showTooltipRatePlanNames={inclusionFilter === 'any'}
            />
          )}
        </div>

        {/* Legend (parity only) + Navigator branding — both tabs align to the right for consistency */}
        <footer className="shrink-0 border-t border-gray-200 bg-white px-6 py-3 flex flex-wrap items-center justify-end gap-x-6 gap-y-2">
          {activeTab === 'parity' && <ParityStatusLegendFooter />}
          <div
            className={cn(
              'flex items-center gap-1 shrink-0',
              activeTab === 'parity' && 'border-l border-gray-200 pl-6'
            )}
            aria-label="Powered by Navigator"
          >
            <span className="shrink-0 text-[10px] font-medium leading-none text-slate-400/85">
              Powered by
            </span>
            <img
              src={`${import.meta.env.BASE_URL}navigator-logo.svg`}
              alt="Navigator"
              className="h-[22px] w-auto max-h-[24px] max-w-[min(240px,calc(100%-5rem))] shrink-0 object-contain"
              style={{ filter: NAVIGATOR_LOGO_BRAND_FILTER }}
              loading="lazy"
              decoding="async"
            />
          </div>
        </footer>
      </div>
    </div>
  );
}

// Parity Analysis Component
function ParityAnalysisContent({
  visibleDates,
  visibleRates,
  dateOffset,
  getCompetitorRateForDate,
  resolveParityCellRatePlan,
  resolveParityYourRatePlan,
  showTooltipRatePlanNames
}: {
  visibleDates: Array<{ day: string; date: string; month: string }>;
  visibleRates: number[];
  dateOffset: number;
  getCompetitorRateForDate: (competitorIndex: number, dateIndex: number, myRate: number) => number | null;
  resolveParityCellRatePlan: (channelIdx: number, globalDateIdx: number) => string;
  resolveParityYourRatePlan: (globalDateIdx: number) => string;
  /** When false, OTA rate tooltips omit rate plan names (specific plan filter = apple-to-apple). */
  showTooltipRatePlanNames: boolean;
}) {
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

  /** Win/Meet/Loss mix and parity score (Win% + Meet%) across every channel × visible date with data. */
  const overallParityDistribution = useMemo(() => {
    let winCount = 0;
    let meetCount = 0;
    let lossCount = 0;
    let totalCount = 0;

    const channelCount = channelNames.length;
    for (let channelIdx = 0; channelIdx < channelCount; channelIdx++) {
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
    }

    const winPercent = totalCount > 0 ? (winCount / totalCount) * 100 : 0;
    const meetPercent = totalCount > 0 ? (meetCount / totalCount) * 100 : 0;
    const lossPercent = totalCount > 0 ? (lossCount / totalCount) * 100 : 0;
    const parityScore = Math.round(winPercent + meetPercent);

    return { winPercent, meetPercent, lossPercent, parityScore };
  }, [channelNames.length, visibleRates, dateOffset, getCompetitorRateForDate]);

  // Determine cell display type
  const getCellDisplay = (channelRate: number | null, myRate: number, channelIdx: number, dateIdx: number) => {
    const seed1 = (channelIdx * 17 + dateIdx * 23) % 100;

    if (channelRate === null || myRate === 0) {
      return { type: 'no-data' as const, rate: null, status: null };
    }

    const status = getParityStatus(channelRate, myRate);

    // Simulate OTA sold out on channel (green cell) — not a parity loss row
    if (seed1 < 15) {
      return { type: 'sold-out' as const, rate: channelRate, status };
    }

    // R (rate violation) badge + header chip only on Loss — not Win or Meet
    if (status === 'Loss') {
      return { type: 'rate-variation' as const, rate: channelRate, status };
    }

    return { type: 'normal' as const, rate: channelRate, status };
  };

  const parityTableMinWidthPx = 320 + 90 * visibleDates.length;
  const parityTableStyle: CSSProperties = { tableLayout: 'fixed', minWidth: parityTableMinWidthPx };

  const parityColgroup = (
    <colgroup>
      <col style={{ width: '140px' }} />
      <col style={{ width: '100px' }} />
      <col style={{ width: '80px' }} />
      {visibleDates.map((_, idx) => (
        <col key={idx} style={{ width: '90px' }} />
      ))}
    </colgroup>
  );

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col">
      {/* Same pattern as competitor tab: one horizontal scroll for both bands; channel rows scroll vertically only. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-x-auto">
        <div className="shrink-0 bg-white">
          <table className="w-full border-collapse" style={parityTableStyle}>
            {parityColgroup}

        {/* Date Headers + Overall Parity % + Your Rates — fixed while channel rows scroll */}
        <thead>
          <tr className="border-b border-[#e0e0e0]">
            <th className="sticky left-0 z-[25] border-r border-[#e0e0e0] bg-[#f5f5f5] px-3 py-3 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
              <div className="text-left text-[11px] font-semibold text-[#333333]">Channels</div>
            </th>
            <th className="px-2 py-3 border-r border-[#e0e0e0] bg-[#f5f5f5]">
              <div className="text-[10px] font-semibold text-[#333333]">Win/Meet/Loss</div>
            </th>
            <th className="px-2 py-3 border-r border-[#e0e0e0] bg-[#f5f5f5]">
              <div className="text-[10px] font-semibold text-[#333333]">Parity Score</div>
            </th>
            {visibleDates.map((date, idx) => (
              <th key={idx} className="px-2 py-3 border-r border-[#e0e0e0] bg-[#f5f5f5]">
                <div className="text-[11px] font-bold text-[#333333]">{date.day}</div>
                <div className="text-[11px] font-semibold text-[#333333] mt-0.5">{date.date} {date.month}</div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* Overall parity % — first summary row under date headers */}
          <tr className="border-b border-[#d4d8de] bg-[#e2e5ea]">
            <td className="sticky left-0 z-[24] border-r border-[#d4d8de] bg-[#e2e5ea] px-3 py-3.5 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
              <div className="text-left text-[13px] font-semibold leading-tight text-[#333333]">Overall Parity %</div>
            </td>
            <td className="border-r border-[#d4d8de] bg-[#e2e5ea] px-2 py-3.5">
              <div className="flex h-6 overflow-hidden rounded border border-[#c8ccd2]">
                {overallParityDistribution.winPercent > 0 && (
                  <div
                    className="flex min-w-0 items-center justify-center bg-[#f97316]"
                    style={{ width: `${overallParityDistribution.winPercent}%` }}
                  >
                    {overallParityDistribution.winPercent >= 10 && (
                      <span className="text-[10px] font-semibold tabular-nums text-white">
                        {Math.round(overallParityDistribution.winPercent)}%
                      </span>
                    )}
                  </div>
                )}
                {overallParityDistribution.meetPercent > 0 && (
                  <div
                    className="flex min-w-0 items-center justify-center bg-[#22c55e]"
                    style={{ width: `${overallParityDistribution.meetPercent}%` }}
                  >
                    {overallParityDistribution.meetPercent >= 10 && (
                      <span className="text-[10px] font-semibold tabular-nums text-white">
                        {Math.round(overallParityDistribution.meetPercent)}%
                      </span>
                    )}
                  </div>
                )}
                {overallParityDistribution.lossPercent > 0 && (
                  <div
                    className="flex min-w-0 items-center justify-center bg-[#ef4444]"
                    style={{ width: `${overallParityDistribution.lossPercent}%` }}
                  >
                    {overallParityDistribution.lossPercent >= 10 && (
                      <span className="text-[10px] font-semibold tabular-nums text-white">
                        {Math.round(overallParityDistribution.lossPercent)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </td>
            <td className="border-r border-[#d4d8de] bg-[#e2e5ea] px-2 py-3.5 text-center">
              <div className="text-[13px] font-semibold tabular-nums text-[#333333]">
                {overallParityDistribution.parityScore}%
              </div>
            </td>
            {visibleDates.map((_, idx) => {
              const parityPercent = getDateParityPercentage(idx);
              return (
                <td key={idx} className="px-2 py-3.5 border-r border-[#d4d8de] bg-[#e2e5ea]">
                  <div className="text-center text-[13px] font-semibold tabular-nums text-[#333333]">
                    {parityPercent}%
                  </div>
                </td>
              );
            })}
          </tr>

          {/* Your Rates — below overall parity; blue band before channel rows */}
          <tr className="border-b-2 border-[#2196F3] bg-[#E3F2FD]">
            <td className="relative sticky left-0 z-[24] align-top border-r border-[#e0e0e0] bg-[#E3F2FD] px-3 py-3 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
              <ParityBenchmarkChip />
              <div className="min-w-0 max-w-[min(100%,14rem)] pr-[5.25rem]">
                <div className="text-[13px] font-bold leading-tight text-[#333333]">Your Rates</div>
                <p className="m-0 mt-0.5 text-[10px] font-normal leading-snug text-[#5c6c7c]">Brand.com</p>
              </div>
            </td>
            <td className="px-2 py-3.5 border-r border-[#e0e0e0] bg-[#E3F2FD]" colSpan={2}>
              {/* Empty cells for Win/Meet/Loss and Parity Score columns */}
            </td>
            {visibleRates.map((rate, idx) => {
              return (
                <td
                  key={idx}
                  className="px-2 py-3.5 text-center text-[13px] font-semibold border-r border-[#e0e0e0] bg-[#E3F2FD]"
                >
                  {rate === 0 || !rate ? (
                    <span className="text-gray-400 font-normal">Sold Out</span>
                  ) : (
                    <span className="text-[#333333]">€{rate}</span>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
          </table>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-[#e8eaed] bg-white">
          <table className="w-full border-collapse" style={parityTableStyle}>
            {parityColgroup}
            <tbody>
          {/* Channel Rows */}
          {channelNames.map((channelName, channelIdx) => {
            const distribution = getChannelParityDistribution(channelIdx);

            return (
              <tr key={channelIdx} className="border-b border-[#e0e0e0]">
                {/* Channel Name */}
                <td className="sticky left-0 z-[23] border-r border-[#e0e0e0] bg-white px-3 py-4 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] hover:bg-gray-50">
                  <div className="text-[12px] font-medium text-[#333333]">
                    {channelName}
                  </div>
                </td>

                {/* Win/Meet/Loss — flat colors, single row; % inside segment when wide enough */}
                <td className="border-r border-[#e0e0e0] bg-white px-2 py-4">
                  <div className="flex h-6 overflow-hidden rounded border border-[#e8e8e8]">
                    {distribution.winPercent > 0 && (
                      <div
                        className="flex min-w-0 items-center justify-center bg-[#f97316]"
                        style={{ width: `${distribution.winPercent}%` }}
                      >
                        {distribution.winPercent >= 10 && (
                          <span className="text-[10px] font-semibold tabular-nums text-white">
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
                          <span className="text-[10px] font-semibold tabular-nums text-white">
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
                          <span className="text-[10px] font-semibold tabular-nums text-white">
                            {Math.round(distribution.lossPercent)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </td>

                {/* Parity Score */}
                <td className="px-2 py-4 text-center border-r border-[#e0e0e0] bg-white">
                  <div className="text-[11px] font-semibold text-[#333333]">{distribution.parityScore}%</div>
                </td>

                {/* Date Cells */}
                {visibleRates.map((myRate, dateIdx) => {
                  const channelRate = getCompetitorRateForDate(channelIdx, dateOffset + dateIdx, myRate);
                  const cellDisplay = getCellDisplay(channelRate, myRate, channelIdx, dateIdx);

                  const globalDateIdx = dateOffset + dateIdx;
                  const dateLabel = visibleDates[dateIdx] ? formatInsightDate(visibleDates[dateIdx]) : '';
                  const channelRatePlan = resolveParityCellRatePlan(channelIdx, globalDateIdx);

                  // No data available
                  if (cellDisplay.type === 'no-data') {
                    return (
                      <td
                        key={dateIdx}
                        className="px-2 py-4 text-center border-r border-[#e0e0e0] bg-gray-50"
                      >
                        <span className="text-[11px] text-gray-400">—</span>
                      </td>
                    );
                  }

                  // Sold out - green background, special text
                  if (cellDisplay.type === 'sold-out') {
                    return (
                      <td
                        key={dateIdx}
                        className="px-2 py-4 text-center border-r border-[#e0e0e0] bg-[#dcfce7]"
                      >
                        <span className="text-[12px] font-semibold text-[#166534]">Sold Out</span>
                      </td>
                    );
                  }

                  // rate-variation (R) only when parity status is Loss
                  const isWin = cellDisplay.status === 'Win';
                  const isMeet = cellDisplay.status === 'Meet';
                  const isLoss = cellDisplay.status === 'Loss';
                  const bgColor = isWin ? '#dcfce7' : (isMeet ? '#fff7ed' : '#fee2e2');
                  const textColor = isWin ? '#166534' : (isMeet ? '#9a3412' : '#991b1b');

                  const lossAmount = isLoss && cellDisplay.rate ? myRate - cellDisplay.rate : 0;
                  const lossPercent =
                    isLoss && cellDisplay.rate ? Math.round(((myRate - cellDisplay.rate) / cellDisplay.rate) * 100) : 0;

                  const winAmount =
                    isWin && cellDisplay.rate != null ? Math.max(0, cellDisplay.rate - myRate) : 0;
                  const winPercent =
                    isWin && cellDisplay.rate && cellDisplay.rate > 0
                      ? Math.min(
                          999,
                          Math.round(((cellDisplay.rate - myRate) / cellDisplay.rate) * 100)
                        )
                      : 0;

                  const status = cellDisplay.status as 'Win' | 'Meet' | 'Loss';
                  const pillPct =
                    cellDisplay.rate != null ? parityPillPercent(myRate, cellDisplay.rate, status) : 0;

                  const showRateViolationNote = cellDisplay.type === 'rate-variation';

                  return (
                    <td
                      key={dateIdx}
                      className="px-2 py-4 text-center border-r border-[#e0e0e0]"
                      style={{ backgroundColor: bgColor }}
                    >
                      <InsightHoverTooltip
                        title={channelName}
                        dateLabel={dateLabel}
                        panelWidth={300}
                        estimatedHeight={220}
                        visual="elevated"
                        headerEnd={showRateViolationNote ? <ParityTooltipHeaderRateViolation /> : undefined}
                        triggerClassName="relative flex min-h-[1.5rem] w-full min-w-0 items-center justify-center py-0.5"
                        body={
                          <ParityTooltipModernBody
                            myRate={myRate}
                            channelRate={cellDisplay.rate}
                            channelSiteLabel={channelName}
                            yourPlan={resolveParityYourRatePlan(globalDateIdx)}
                            channelPlan={channelRatePlan}
                            showPlans={showTooltipRatePlanNames}
                            status={status}
                            gapPct={pillPct}
                            isLoss={isLoss}
                            lossAmount={lossAmount}
                            lossPercent={lossPercent}
                            isWin={isWin}
                            winAmount={winAmount}
                            winPercent={winPercent}
                          />
                        }
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[13px] font-semibold" style={{ color: textColor }}>
                            €{cellDisplay.rate}
                          </span>
                          {cellDisplay.type === 'rate-variation' ? <ParityRateViolationBadgeIcon /> : null}
                        </div>
                      </InsightHoverTooltip>
                    </td>
                  );
                })}
              </tr>
            );
          })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChartCell({
  date,
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
  date: { day: string; date: string; month: string };
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
  const [isHovered, setIsHovered] = useState(false);
  const chartHeight = 112;

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Competitor-only tooltip (no parity — Parity lives on the other tab) */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 z-[100] -mb-2 -translate-x-1/2 pointer-events-none">
          <div className="rounded-lg bg-[#1a1d2e] px-3 py-2 text-[10px] whitespace-nowrap text-white shadow-xl">
            <div className="mb-1.5 border-b border-gray-700 pb-1.5 font-semibold">
              {date.day}, {date.date} {date.month}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-400">My Rate:</span>
                <span className="font-semibold text-[#60a5fa]">€{myRate}</span>
              </div>
              <div className="my-1.5 h-px bg-gray-700" />
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-400">Max (Comp):</span>
                <span className="text-red-400">€{maxRate}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-400">Min (Comp):</span>
                <span className="text-green-400">€{minRate}</span>
              </div>
            </div>
            <div className="absolute left-1/2 top-full -mt-px -translate-x-1/2">
              <div className="h-0 w-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#1a1d2e]" />
            </div>
          </div>
        </div>
      )}
      <svg
        width="100%"
        height={chartHeight}
        className="block max-w-full overflow-hidden"
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
          stroke="#f44336"
          strokeWidth="2.5"
        />
        <circle cx="50%" cy={`${maxY}%`} r="3" fill="#f44336" />

        {/* Min rate T-marker */}
        <line
          x1="calc(50% - 8px)"
          y1={`${minY}%`}
          x2="calc(50% + 8px)"
          y2={`${minY}%`}
          stroke="#4caf50"
          strokeWidth="2.5"
        />
        <circle cx="50%" cy={`${minY}%`} r="3" fill="#4caf50" />

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
    </div>
  );
}