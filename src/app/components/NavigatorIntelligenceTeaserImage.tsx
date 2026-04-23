import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BarChart3, Check, Scale } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/app/components/ui/dialog';
import { cn } from '@/app/components/ui/utils';

const DEMO_THANKS_AUTO_CLOSE_MS = 3600;

const PREVIEW_SRC = `${import.meta.env.BASE_URL}navigator-competitor-intelligence-preview.png`;

function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(n);
}

type HotspotStat = { label: string; value: string };

type GraphPricing = {
  yourCheapest: number;
  yourRatePlan: string;
  competitorMin: number;
  competitorMinPlan: string;
  competitorMax: number;
  competitorMaxPlan: string;
};

type HotspotConfig = {
  id: string;
  leftPct: number;
  topPct: number;
  title?: string;
  summary?: string;
  benefit: string;
  stats?: HotspotStat[];
  statsSectionTitle?: string;
  graphPricing?: GraphPricing;
};

/** Parity tints — same palette as onboarding parity grid + subscriber legend. */
const PARITY_WIN = '#f97316';
const PARITY_MEET = '#22c55e';
const PARITY_LOSS = '#ef4444';

const DRAWER_TAB_ACTIVE = '#2196F3';

/** Mini preview of DetailedCompetitorModal: competitor vs parity tabs + how users compare data. */
function DetailsDrawerExplainer({ withTopMargin = true }: { withTopMargin?: boolean }) {
  const parityMatrix = [
    [PARITY_MEET, PARITY_WIN, PARITY_LOSS, PARITY_MEET],
    [PARITY_WIN, PARITY_MEET, PARITY_MEET, PARITY_LOSS],
    [PARITY_MEET, PARITY_LOSS, PARITY_WIN, PARITY_MEET]
  ] as const;
  const parityChannels = ['BK', 'Exp', 'Hg'] as const;

  return (
    <div
      className={cn('space-y-1.5', withTopMargin && 'mt-2')}
      aria-label="Subscriber drawer: competitor and parity analysis tabs"
    >
      <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0c0f14] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <p className="border-b border-white/10 bg-white/[0.04] px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Same layout as live drawer
        </p>
        <div className="flex border-b border-white/10">
          <div
            className="flex flex-1 items-center justify-center gap-0.5 border-b-2 px-1 py-1.5 text-[10px] font-semibold leading-tight text-blue-300"
            style={{ borderBottomColor: DRAWER_TAB_ACTIVE }}
          >
            <BarChart3 className="size-3 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
            <span className="text-center">Competitor</span>
          </div>
          <div className="flex flex-1 items-center justify-center gap-0.5 border-b-2 border-transparent px-1 py-1.5 text-[10px] font-medium leading-tight text-slate-500">
            <Scale className="size-3 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
            <span className="text-center">Parity</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-2">
          <div className="min-w-0 rounded-md border border-white/10 bg-white/[0.03] p-1.5">
            <p className="text-[11px] font-semibold leading-snug text-slate-200">Competitor price comparison</p>
            <p className="mt-0.5 text-[10px] leading-snug text-slate-400">
              See how your rates compare with competitors for each date, based on similar room and plan types.
            </p>
            <div className="mt-1.5 flex h-9 items-end justify-between gap-1 px-0.5">
              {[
                { lo: 22, hi: 78, you: 52 },
                { lo: 18, hi: 72, you: 58 },
                { lo: 28, hi: 88, you: 44 },
                { lo: 20, hi: 80, you: 66 }
              ].map((col, i) => (
                <div key={i} className="relative h-full w-4 shrink-0">
                  <div
                    className="absolute bottom-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-slate-700/60"
                    style={{ height: '100%' }}
                  />
                  <div
                    className="absolute left-1/2 w-1.5 -translate-x-1/2 rounded-sm bg-slate-500/30"
                    style={{
                      bottom: `${col.lo}%`,
                      height: `${col.hi - col.lo}%`
                    }}
                  />
                  <div
                    className="absolute left-1/2 size-[5px] -translate-x-1/2 rounded-full border border-white bg-[#2196F3] shadow-sm"
                    style={{ bottom: `${col.you}%` }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-1 text-center text-[9px] tabular-nums text-slate-500">Thu · Fri · Sat · Sun</p>
          </div>

          <div className="min-w-0 rounded-md border border-white/10 bg-white/[0.03] p-1.5">
            <p className="text-[11px] font-semibold leading-snug text-slate-200">Rate parity insights</p>
            <p className="mt-0.5 text-[10px] leading-snug text-slate-400">
              Understand whether you&apos;re winning, matching, or losing against each channel&apos;s price for every
              date.
            </p>
            <div className="mt-1.5 space-y-0.5">
              {parityMatrix.map((row, ri) => (
                <div
                  key={parityChannels[ri]}
                  className="grid grid-cols-[0.95rem_1fr_1fr_1fr_1fr] items-center gap-0.5"
                >
                  <span className="text-[9px] font-medium text-slate-500">{parityChannels[ri]}</span>
                  {row.map((tint, ci) => (
                    <div
                      key={`${ri}-${ci}`}
                      className="h-3 rounded-[2px]"
                      style={{
                        backgroundColor: `${tint}40`,
                        boxShadow: `inset 0 0 0 1px ${tint}66`
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const HOTSPOTS: HotspotConfig[] = [
  {
    id: 'details',
    leftPct: 18.5,
    topPct: 25,
    title: 'View details — subscriber drawer',
    summary:
      'Slide-over with two tabs: competitor pricing by date (filters keep comparisons apple-to-apple) and parity by channel vs your direct rate.',
    benefit:
      'See who undercuts you by night and channel, then fix the worst gaps without leaving UNO.'
  },
  {
    id: 'parity',
    leftPct: 31,
    topPct: 24,
    title: 'Parity analysis',
    summary:
      'The background color behind each date shows how your rate compares with OTA prices.',
    benefit: 'Scan the week for mismatches without opening each date.'
  },
  {
    id: 'graph',
    leftPct: 25.5,
    topPct: 42,
    graphPricing: {
      yourCheapest: 400,
      yourRatePlan: 'Member exclusive · Brand.com',
      competitorMin: 300,
      competitorMinPlan: 'Advance purchase · Booking.com',
      competitorMax: 600,
      competitorMaxPlan: 'Flexible BAR · Expedia'
    },
    benefit: 'Spot overshoot or underpricing in a second — then tune only the dates that need it.'
  }
];

function ParityTintExplainer({ withTopMargin = true }: { withTopMargin?: boolean }) {
  return (
    <div
      className={cn('space-y-2', withTopMargin && 'mt-2')}
      aria-label="Parity analysis: your direct rate vs OTA, background colors"
    >
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
        <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Parity grid
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-emerald-500/35 bg-emerald-500/[0.12] px-2 py-2.5 text-center">
            <div className="mx-auto h-1.5 w-full max-w-[52px] rounded-full bg-emerald-400" />
            <p className="mt-2 text-[12px] font-bold text-emerald-200">Meet</p>
            <p className="mt-1 text-[11px] leading-snug text-slate-400">Rates match</p>
          </div>
          <div
            className="rounded-lg border px-2 py-2.5 text-center"
            style={{ borderColor: `${PARITY_WIN}55`, background: `${PARITY_WIN}18` }}
          >
            <div className="mx-auto h-1.5 w-full max-w-[52px] rounded-full bg-orange-400" />
            <p className="mt-2 text-[12px] font-bold text-orange-200">Win</p>
            <p className="mt-1 text-[11px] leading-snug text-slate-400">OTA higher</p>
          </div>
          <div className="rounded-lg border border-red-500/35 bg-red-500/[0.12] px-2 py-2.5 text-center">
            <div className="mx-auto h-1.5 w-full max-w-[52px] rounded-full bg-red-400" />
            <p className="mt-2 text-[12px] font-bold text-red-200">Loss</p>
            <p className="mt-1 text-[11px] leading-snug text-slate-400">OTA lower</p>
          </div>
        </div>
        <p className="mt-2.5 border-t border-white/10 pt-2.5 text-center text-[11px] leading-snug text-slate-500">
          These colors appear behind each date in the grid.
        </p>
      </div>

      <div
        className="overflow-hidden rounded-lg border"
        style={{ borderColor: `${PARITY_WIN}50` }}
      >
        <p
          className="border-b border-white/10 px-2.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500"
          style={{ background: `${PARITY_WIN}10` }}
        >
          Sample data · illustrative
        </p>
        <div
          className="flex items-center justify-between gap-2 px-2.5 py-2.5"
          style={{ background: `${PARITY_WIN}12` }}
        >
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500">Example outcome</p>
            <span
              className="mt-1 inline-block rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: PARITY_WIN }}
            >
              Win
            </span>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Parity score</p>
            <p className="text-[22px] font-bold tabular-nums leading-none text-white">76%</p>
            <p className="mt-0.5 text-[11px] text-slate-500">for demo only</p>
          </div>
        </div>
      </div>

      <p className="text-[12px] leading-relaxed text-slate-400">
        <span className="text-orange-200/95">Win</span> means one or more OTAs are priced higher than your rate.
      </p>
    </div>
  );
}

function GraphPricingRows({ gp, withTopMargin = true }: { gp: GraphPricing; withTopMargin?: boolean }) {
  const above = gp.yourCheapest - gp.competitorMin;
  const below = gp.competitorMax - gp.yourCheapest;

  const rows = [
    {
      key: 'you',
      label: 'Your rate',
      plan: gp.yourRatePlan,
      amount: gp.yourCheapest,
      accent: 'border-blue-400/35 bg-blue-500/[0.12]',
      bar: 'bg-blue-400'
    },
    {
      key: 'min',
      label: 'Competitor low',
      plan: gp.competitorMinPlan,
      amount: gp.competitorMin,
      accent: 'border-emerald-500/35 bg-emerald-500/[0.12]',
      bar: 'bg-emerald-400'
    },
    {
      key: 'max',
      label: 'Competitor high',
      plan: gp.competitorMaxPlan,
      amount: gp.competitorMax,
      accent: 'border-red-400/35 bg-red-500/[0.12]',
      bar: 'bg-red-400'
    }
  ] as const;

  return (
    <div className={cn('space-y-2', withTopMargin && 'mt-2')} aria-label="Example rates and rate plans">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Sample rates &amp; plans</p>
      {rows.map((r) => (
        <div key={r.key} className={cn('flex gap-2.5 rounded-lg border p-2.5', r.accent)}>
          <div className={cn('mt-0.5 h-9 w-1 shrink-0 rounded-full', r.bar)} aria-hidden />
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{r.label}</div>
            <p className="mt-0.5 break-words text-[11px] leading-snug text-slate-300">{r.plan}</p>
            <p className="mt-1 text-[16px] font-bold tabular-nums leading-none tracking-tight text-white">
              {formatUsd(r.amount)}
            </p>
          </div>
        </div>
      ))}
      <p className="rounded-md bg-white/[0.04] px-2 py-2 text-center text-[11px] font-semibold tabular-nums text-slate-300">
        <span className="text-emerald-300/90">+{formatUsd(above)}</span>
        <span className="mx-1 text-slate-600">vs low</span>
        <span className="text-slate-600">·</span>
        <span className="mx-1 text-red-300/90">−{formatUsd(below)}</span>
        <span className="text-slate-500">vs high</span>
      </p>
    </div>
  );
}

function HotspotTooltipBody({ h }: { h: HotspotConfig }) {
  const gp = h.graphPricing;
  return (
    <>
      {h.title ? (
        <p className="text-[13px] font-semibold leading-snug tracking-tight text-white">{h.title}</p>
      ) : null}
      {h.summary ? <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{h.summary}</p> : null}
      {gp ? (
        <GraphPricingRows gp={gp} withTopMargin={Boolean(h.title || h.summary)} />
      ) : h.id === 'details' ? (
        <DetailsDrawerExplainer withTopMargin={Boolean(h.title || h.summary)} />
      ) : h.id === 'parity' ? (
        <ParityTintExplainer withTopMargin={Boolean(h.title || h.summary)} />
      ) : h.stats ? (
        <div
          className="mt-2.5 rounded-lg border border-sky-400/20 bg-gradient-to-b from-sky-950/30 to-slate-950/80 px-2.5 py-2.5"
          aria-label="Example data"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-300/90">
            {h.statsSectionTitle ?? 'Snapshot'}
          </p>
          <dl className="mt-2 space-y-2">
            {h.stats.map((row) => (
              <div key={row.label} className="grid gap-0.5 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{row.label}</dt>
                <dd className="break-words text-[12px] font-medium leading-snug text-slate-100">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
      {h.id !== 'details' ? (
        <p className="mt-2.5 border-t border-white/10 pt-2 text-[12px] font-medium leading-snug text-emerald-200/95">
          <span className="text-emerald-400/90">Why it matters · </span>
          {h.benefit}
        </p>
      ) : null}
    </>
  );
}

function hotspotAriaLabel(h: HotspotConfig): string {
  const prefix = h.title ? `${h.title}. ` : '';
  if (h.graphPricing) {
    const g = h.graphPricing;
    return `${prefix}Your ${g.yourRatePlan} ${formatUsd(g.yourCheapest)}. Competitor low ${formatUsd(g.competitorMin)}, high ${formatUsd(g.competitorMax)}. ${h.benefit}`;
  }
  if (h.id === 'parity') {
    return `${prefix}${h.summary ?? ''} Parity grid: Meet rates match, Win OTA higher than your rate, Loss OTA lower. Win means one or more OTAs are priced higher than your rate. Illustrative sample: Win with parity score 76 percent. ${h.benefit}`;
  }
  if (h.id === 'details') {
    return `${prefix}${h.summary ?? ''} Competitor price comparison: your rates vs competitors per date, similar room and plan types. Rate parity insights: win, match, or lose against each channel price per date. ${h.benefit}`;
  }
  return `${prefix}${h.summary ?? ''} ${h.benefit}`;
}

const TOOLTIP_ARROW_W = 14;
const TOOLTIP_ARROW_H = 8;
const TOOLTIP_ARROW_HALF = TOOLTIP_ARROW_W / 2;
const TOOLTIP_Z = 2147483000;

type TipBox = {
  left: number;
  top: number;
  placement: 'above' | 'below';
  arrowLeft: number;
};

function layoutTipNearAnchor(ar: DOMRect, tipW: number, tipH: number): TipBox {
  const m = 10;
  /** Keep the portaled tooltip from covering the anchor; otherwise Chrome moves hit-testing to the tooltip,
   *  the dot gets `mouseleave` immediately, and hover feels "dead" unless the tooltip receives enter in the same tick. */
  const anchorGap = 14;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tw = Math.min(Math.max(tipW, 200), Math.min(360, vw - 2 * m));
  const th = Math.max(tipH, 80);
  const cx = ar.left + ar.width / 2;
  let left = cx - tw / 2;
  left = Math.max(m, Math.min(left, vw - tw - m));

  const overlapsAnchor = (topPx: number) => {
    const tipLeft = left;
    const tipRight = left + tw;
    const tipTop = topPx;
    const tipBottom = topPx + th;
    const xOverlap = tipRight > ar.left - 2 && tipLeft < ar.right + 2;
    const yOverlap = tipBottom > ar.top - 2 && tipTop < ar.bottom + 2;
    return xOverlap && yOverlap;
  };

  let placement: 'above' | 'below' = 'below';
  let top = ar.bottom + anchorGap;
  if (top + th > vh - m) {
    placement = 'above';
    top = ar.top - th - anchorGap;
  }
  if (top < m) {
    placement = 'below';
    top = ar.bottom + anchorGap;
    if (top + th > vh - m) {
      top = Math.max(m, vh - th - m);
    }
  }

  if (overlapsAnchor(top)) {
    const belowTop = ar.bottom + anchorGap;
    const aboveTop = ar.top - th - anchorGap;
    const fitsBelow = belowTop + th <= vh - m;
    const fitsAbove = aboveTop >= m;
    if (fitsBelow && (!fitsAbove || belowTop + th / 2 <= vh / 2)) {
      placement = 'below';
      top = belowTop;
    } else if (fitsAbove) {
      placement = 'above';
      top = aboveTop;
    } else {
      placement = 'below';
      top = Math.max(m, Math.min(belowTop, vh - th - m));
    }
  }

  const arrowLeft = Math.round(
    Math.min(Math.max(cx - left - TOOLTIP_ARROW_HALF, 10), tw - 10 - TOOLTIP_ARROW_W)
  );
  return { left, top, placement, arrowLeft };
}

/** Pointer toward the hotspot; placement = tooltip above anchor (arrow below card) or below anchor (arrow above card). */
function HotspotTooltipArrow({
  direction,
  className
}: {
  direction: 'down' | 'up';
  className?: string;
}) {
  const stroke = 'rgba(71, 85, 105, 0.45)';
  if (direction === 'down') {
    return (
      <svg
        width={TOOLTIP_ARROW_W}
        height={TOOLTIP_ARROW_H}
        viewBox={`0 0 ${TOOLTIP_ARROW_W} ${TOOLTIP_ARROW_H}`}
        className={cn('shrink-0 text-[#0f1419]', className)}
        aria-hidden
      >
        <path
          d={`M0 0.5 L${TOOLTIP_ARROW_HALF} ${TOOLTIP_ARROW_H} L${TOOLTIP_ARROW_W} 0.5 Z`}
          fill="currentColor"
          stroke={stroke}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width={TOOLTIP_ARROW_W}
      height={TOOLTIP_ARROW_H}
      viewBox={`0 0 ${TOOLTIP_ARROW_W} ${TOOLTIP_ARROW_H}`}
      className={cn('shrink-0 text-[#0f1419]', className)}
      aria-hidden
    >
      <path
        d={`M0 ${TOOLTIP_ARROW_H - 0.5} L${TOOLTIP_ARROW_HALF} 0.5 L${TOOLTIP_ARROW_W} ${TOOLTIP_ARROW_H - 0.5} Z`}
        fill="currentColor"
        stroke={stroke}
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

type SetPinned = (value: string | null | ((prev: string | null) => string | null)) => void;

/**
 * Each hotspot owns hover + portaled tooltip so position is set synchronously from the anchor rect
 * (avoids parent/tipRef timing bugs). Tooltip body content is unchanged (HotspotTooltipBody).
 */
function HotspotWithTooltip({
  h,
  pinnedId,
  setPinnedId
}: {
  h: HotspotConfig;
  pinnedId: string | null;
  setPinnedId: SetPinned;
}) {
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const tipRafRef = useRef({ outer: 0, inner: 0 });
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [hovering, setHovering] = useState(false);
  const [tipBox, setTipBox] = useState<TipBox | null>(null);

  const pinned = pinnedId === h.id;
  const showTip = hovering || pinned;

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const scheduleLeave = useCallback(() => {
    clearLeaveTimer();
    leaveTimerRef.current = setTimeout(() => setHovering(false), 600);
  }, [clearLeaveTimer]);

  const placeFromAnchor = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const ar = el.getBoundingClientRect();
    const tip = tipRef.current;
    if (!tip) {
      setTipBox(layoutTipNearAnchor(ar, 340, 280));
      return;
    }
    const tr = tip.getBoundingClientRect();
    const w = tr.width > 4 ? tr.width : 340;
    const hgt = tr.height > 4 ? tr.height : 280;
    setTipBox(layoutTipNearAnchor(ar, w, hgt));
  }, []);

  const onOpenHover = useCallback(() => {
    clearLeaveTimer();
    setPinnedId((p) => (p !== null && p !== h.id ? null : p));
    setHovering(true);
    const el = anchorRef.current;
    if (el) {
      setTipBox(layoutTipNearAnchor(el.getBoundingClientRect(), 340, 280));
    }
  }, [clearLeaveTimer, h.id, setPinnedId]);

  useLayoutEffect(() => {
    if (!showTip) {
      setTipBox(null);
      return;
    }
    placeFromAnchor();
    tipRafRef.current.outer = requestAnimationFrame(() => {
      tipRafRef.current.inner = requestAnimationFrame(() => placeFromAnchor());
    });
    const onScrollOrResize = () => placeFromAnchor();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    const tip = tipRef.current;
    const ro =
      typeof ResizeObserver !== 'undefined' && tip ? new ResizeObserver(onScrollOrResize) : null;
    if (tip) ro?.observe(tip);
    return () => {
      cancelAnimationFrame(tipRafRef.current.outer);
      cancelAnimationFrame(tipRafRef.current.inner);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
      ro?.disconnect();
    };
  }, [showTip, h.id, placeFromAnchor]);

  useEffect(() => () => clearLeaveTimer(), [clearLeaveTimer]);

  const portal =
    showTip &&
    tipBox &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={(node) => {
          tipRef.current = node;
          if (node) requestAnimationFrame(() => placeFromAnchor());
        }}
        role="tooltip"
        id={`navigator-hotspot-tip-${h.id}`}
        className="fixed flex w-[min(360px,calc(100vw-20px))] max-w-[calc(100vw-20px)] flex-col items-stretch text-left text-[13px] text-white opacity-100"
        style={{ left: tipBox.left, top: tipBox.top, zIndex: TOOLTIP_Z }}
        onPointerEnter={() => {
          clearLeaveTimer();
          setHovering(true);
        }}
        onPointerLeave={scheduleLeave}
        onMouseEnter={() => {
          clearLeaveTimer();
          setHovering(true);
        }}
        onMouseLeave={scheduleLeave}
      >
        {tipBox.placement === 'below' ? (
          <div className="shrink-0 leading-none" style={{ marginLeft: tipBox.arrowLeft }}>
            <HotspotTooltipArrow direction="up" className="-mb-px" />
          </div>
        ) : null}
        <div className="rounded-xl border border-slate-600/40 bg-[#0f1419] px-3.5 py-3.5 shadow-2xl ring-1 ring-white/[0.08]">
          <HotspotTooltipBody h={h} />
        </div>
        {tipBox.placement === 'above' ? (
          <div className="shrink-0 leading-none" style={{ marginLeft: tipBox.arrowLeft }}>
            <HotspotTooltipArrow direction="down" className="-mt-px" />
          </div>
        ) : null}
      </div>,
      document.body
    );

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={cn(
          'absolute z-[200] flex size-12 cursor-pointer items-center justify-center rounded-full outline-none touch-manipulation',
          'focus-visible:ring-2 focus-visible:ring-[#2753eb] focus-visible:ring-offset-2',
          showTip && 'ring-2 ring-white/90 ring-offset-2 ring-offset-transparent'
        )}
        style={{
          left: `${h.leftPct}%`,
          top: `${h.topPct}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'auto',
          backgroundColor: 'rgba(255,255,255,0.001)'
        }}
        aria-label={hotspotAriaLabel(h)}
        aria-expanded={showTip}
        aria-controls={`navigator-hotspot-tip-${h.id}`}
        onMouseEnter={onOpenHover}
        onMouseLeave={scheduleLeave}
        onPointerEnter={onOpenHover}
        onPointerLeave={scheduleLeave}
        onFocus={onOpenHover}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          clearLeaveTimer();
          setPinnedId((cur) => (cur === h.id ? null : h.id));
          setHovering(true);
          const el = anchorRef.current;
          if (el) setTipBox(layoutTipNearAnchor(el.getBoundingClientRect(), 340, 280));
        }}
      >
        <span
          className="pointer-events-none absolute inline-flex size-7 animate-ping rounded-full bg-[#2753eb]/40 opacity-55"
          aria-hidden
        />
        <span
          className="pointer-events-none relative inline-flex size-4 rounded-full border-2 border-white bg-[#2753eb] shadow-md"
          aria-hidden
        />
      </button>
      {portal}
    </>
  );
}

type NavigatorIntelligenceTeaserImageProps = {
  className?: string;
  onRequestTrial: () => void;
  /** When true, a slim bar above the preview image states the user is not subscribed (limited / preview experience). */
  notSubscribedLead?: boolean;
  /** Limited flow: hide the whole preview block; copy references the top Navigator banner. */
  onDismissPreview?: () => void;
};

export function NavigatorIntelligenceTeaserImage({
  className,
  onRequestTrial,
  notSubscribedLead = false,
  onDismissPreview
}: NavigatorIntelligenceTeaserImageProps) {
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [demoThanksOpen, setDemoThanksOpen] = useState(false);

  useEffect(() => {
    if (pinnedId === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPinnedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pinnedId]);

  useEffect(() => {
    if (!demoThanksOpen) return;
    const t = window.setTimeout(() => setDemoThanksOpen(false), DEMO_THANKS_AUTO_CLOSE_MS);
    return () => window.clearTimeout(t);
  }, [demoThanksOpen]);

  return (
    <div
      className={cn(
        'relative w-full rounded-lg border border-[#e2e8f0] bg-[#fafafa] shadow-[0_1px_3px_rgba(15,23,42,0.06)]',
        notSubscribedLead ? 'overflow-visible' : 'overflow-hidden',
        className
      )}
    >
      {notSubscribedLead ? (
        <div className="relative z-[1] border-b border-slate-200/90 bg-gradient-to-r from-slate-100 via-white to-[#eff6ff] px-3 py-2 text-center sm:px-4 sm:py-2.5">
          <p className="text-[11px] leading-snug text-slate-600 sm:text-[12px]">
            The data below is illustrative and shows how competitor pricing and parity insights will appear after
            subscribing.
          </p>
        </div>
      ) : null}
      {/* Hotspot % positions are relative to this box only so a lead strip above does not shift dots. */}
      <div
        className={cn(
          'relative w-full',
          notSubscribedLead && 'overflow-visible rounded-b-lg'
        )}
      >
        {/* Tight to image height (no padding below); overlay centered in snapshot via inset-0 flex. */}
        <div className="relative w-full leading-none">
          <img
            src={PREVIEW_SRC}
            alt="Preview of Navigator competitor and parity analysis in UNO — same layout as subscribed users"
            className={cn(
              'relative z-0 block h-auto w-full align-top select-none object-contain object-left-top pointer-events-none',
              notSubscribedLead ? 'rounded-none' : 'rounded-lg'
            )}
            width={2900}
            height={438}
            loading="eager"
            decoding="async"
            draggable={false}
          />

          <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center px-2 py-2 sm:px-3 sm:py-2.5">
            <div
              className={cn(
                'pointer-events-auto flex w-[min(380px,calc(100%-0.5rem))] max-w-[min(400px,calc(100%-1rem))] flex-col items-stretch gap-2 rounded-xl border border-white/25',
                'bg-slate-900/78 px-3 py-3 shadow-[0_8px_28px_rgba(0,0,0,0.38)] backdrop-blur-md sm:px-3.5 sm:py-3'
              )}
            >
          <div className="flex w-full gap-2">
            <Button
              type="button"
              aria-label="Start your 30-day free trial to unlock competitor insights"
              onClick={(e) => {
                e.stopPropagation();
                onRequestTrial();
              }}
              className="inline-flex h-9 min-h-9 flex-1 min-w-0 items-center justify-center bg-[#2753eb] px-2 py-1.5 text-center text-[10px] font-semibold leading-tight text-white shadow-md hover:bg-[#1e45c7] sm:h-10 sm:text-[11px]"
            >
              <span className="min-w-0 px-0.5">Start 30 days free trial</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              aria-label="Request a demo"
              onClick={(e) => {
                e.stopPropagation();
                setDemoThanksOpen(true);
              }}
              className="inline-flex h-9 min-h-9 flex-1 min-w-0 items-center justify-center whitespace-nowrap border-white/35 bg-white/[0.06] px-2 py-1.5 text-center text-[11px] font-semibold leading-tight text-white shadow-none hover:bg-white/[0.12] hover:text-white sm:h-10 sm:text-[12px]"
            >
              Request demo
            </Button>
          </div>
          <p className="text-center text-[11px] leading-snug text-white/90 sm:text-[12px]">
            Snapshot of competitor pricing &amp; parity — your live UNO rates stay as they are.
          </p>
          {onDismissPreview ? (
            <div className="pointer-events-auto border-t border-white/15 pt-2">
              <button
                type="button"
                className="w-full rounded-md py-0.5 text-center text-[10px] font-semibold leading-snug text-white/90 underline decoration-white/40 underline-offset-2 transition-colors hover:text-white hover:decoration-white/75 sm:text-[11px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismissPreview();
                }}
              >
                Hide preview
              </button>
              <p className="mt-1 text-center text-[9px] leading-snug text-white/60 sm:text-[10px]">
                Subscribe or request a demo anytime from the blue banner at the top.
              </p>
            </div>
          ) : null}
            </div>
          </div>

        <Dialog open={demoThanksOpen} onOpenChange={setDemoThanksOpen}>
        <DialogContent
          hideClose
          onPointerDownOutside={() => setDemoThanksOpen(false)}
          onEscapeKeyDown={() => setDemoThanksOpen(false)}
          className="max-w-[min(400px,calc(100%-2rem))] gap-0 border border-emerald-100/80 bg-white p-0 shadow-2xl sm:max-w-md"
          aria-describedby="demo-request-success-desc"
        >
          <div className="flex flex-col items-center px-6 pb-7 pt-8 text-center">
            <div
              className="flex size-16 shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_0_10px_rgba(16,185,129,0.12)]"
              aria-hidden
            >
              <Check className="size-9 text-white" strokeWidth={3} />
            </div>
            <DialogHeader className="mt-6 space-y-2 sm:text-center">
              <DialogTitle className="text-lg font-semibold tracking-tight text-slate-900">
                Request received
              </DialogTitle>
              <DialogDescription
                id="demo-request-success-desc"
                className="text-[15px] leading-relaxed text-slate-600"
              >
                We have successfully taken your request for demo.
              </DialogDescription>
            </DialogHeader>
            <p className="mt-4 text-xs text-slate-400">This window will close in a few seconds.</p>
          </div>
        </DialogContent>
        </Dialog>

        {HOTSPOTS.map((h) => (
          <HotspotWithTooltip key={h.id} h={h} pinnedId={pinnedId} setPinnedId={setPinnedId} />
        ))}
        </div>
      </div>
    </div>
  );
}
