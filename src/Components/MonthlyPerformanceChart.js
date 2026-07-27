import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';

/**
 * Monthly earnings (bars) with workshops added (line) on a shared month axis.
 *
 * Mirrors the chart the owner sees in the web app. Hand-drawn SVG rather than a
 * charting library: this is the only chart in the console, and the owner app and
 * this one sit on different MUI minor versions, so a shared dependency would
 * have to satisfy both.
 *
 * Sized from a measured container width instead of a scaling viewBox, so labels
 * stay legible at every width, and colours come from the active theme so the
 * console's dark mode is handled without a second copy of the component.
 */

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Indian short-scale money for axis ticks: 1,57,728 reads as ₹1.6L. */
export const formatInrCompact = (value) => {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(abs >= 1e8 ? 0 : 1)}Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(abs >= 1e6 ? 0 : 1)}L`;
  if (abs >= 1000) return `₹${(n / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  return `₹${Math.round(n)}`;
};

export const formatInr = (value) =>
  `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;

const monthLabel = (key) => {
  const [y, m] = String(key || '').split('-');
  const idx = Number(m) - 1;
  if (!MONTH_LABELS[idx]) return key || '';
  return { short: MONTH_LABELS[idx], year: y, isJan: idx === 0 };
};

/**
 * Round a maximum up to a friendly axis top (1/2/5 × 10^n) so gridline labels
 * land on readable numbers.
 */
const niceCeil = (value) => {
  if (value <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(value));
  const norm = value / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
};

const useElementWidth = (ref) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // ResizeObserver rather than a window listener: the card layout can change
    // this element's width without the window ever resizing.
    if (typeof ResizeObserver === 'undefined') {
      setWidth(el.clientWidth);
      return undefined;
    }
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setWidth(Math.round(w));
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [ref]);
  return width;
};

const MonthlyPerformanceChart = ({
  data = [],
  height = 260,
  showWorkshops = true,
  emptyMessage = 'No activity in this period yet.',
}) => {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const palette = useMemo(() => ({
    bar: dark ? '#9d8bd1' : '#735EAB',
    barHover: dark ? '#b8a9e0' : '#5b4a89',
    line: dark ? '#4ade80' : '#0f9d58',
    grid: dark ? 'rgba(255,255,255,0.10)' : '#eceaf3',
    axis: dark ? '#94a3b8' : '#94a3b8',
    tooltipBg: dark ? '#0f172a' : '#1f2937',
    tooltipText: '#f9fafb',
    subtext: theme.palette.text.secondary,
  }), [dark, theme.palette.text.secondary]);

  const wrapRef = useRef(null);
  const width = useElementWidth(wrapRef);
  const [hover, setHover] = useState(null);

  const maxRevenue = useMemo(
    () => Math.max(0, ...data.map(d => Number(d.revenue) || 0)), [data]);
  const maxWorkshops = useMemo(
    () => Math.max(0, ...data.map(d => Number(d.workshops_added) || 0)), [data]);
  const hasAnything = maxRevenue > 0 || maxWorkshops > 0;

  const padL = 52;
  const padR = showWorkshops && maxWorkshops > 0 ? 34 : 12;
  const padT = 14;
  const padB = 30;
  const plotW = Math.max(0, width - padL - padR);
  const plotH = Math.max(0, height - padT - padB);

  const revTop = niceCeil(maxRevenue);
  const wsTop = Math.max(1, niceCeil(maxWorkshops));
  const bandW = data.length ? plotW / data.length : 0;
  // Cap bar width so a 1–2 month window doesn't render two enormous slabs.
  const barW = Math.min(38, Math.max(4, bandW * 0.55));

  const xOf = useCallback((i) => padL + bandW * i + bandW / 2, [padL, bandW]);
  const yRev = useCallback(
    (v) => padT + plotH - (plotH * (Number(v) || 0)) / revTop, [padT, plotH, revTop]);
  const yWs = useCallback(
    (v) => padT + plotH - (plotH * (Number(v) || 0)) / wsTop, [padT, plotH, wsTop]);

  const ticks = useMemo(() => {
    const count = 4;
    return Array.from({ length: count + 1 }, (_, i) => (revTop / count) * i);
  }, [revTop]);

  const linePath = useMemo(() => {
    if (!showWorkshops || maxWorkshops <= 0 || !plotW) return '';
    return data
      .map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yWs(d.workshops_added).toFixed(1)}`)
      .join(' ');
  }, [data, showWorkshops, maxWorkshops, plotW, xOf, yWs]);

  // Only label every other month when the axis gets crowded.
  const labelEvery = bandW < 34 ? 2 : 1;

  const tooltip = hover != null ? data[hover] : null;
  const tipW = 150;
  const tipH = showWorkshops ? 82 : 62;
  const tipX = tooltip
    ? Math.min(Math.max(xOf(hover) - tipW / 2, 2), Math.max(2, width - tipW - 2))
    : 0;

  if (!data.length || !hasAnything) {
    return (
      <div ref={wrapRef} style={{ width: '100%' }}>
        <div style={{
          height, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: palette.subtext, fontSize: 13, textAlign: 'center', padding: '0 16px',
        }}>
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label="Monthly earnings and workshops added"
          onMouseLeave={() => setHover(null)}
          style={{ display: 'block', overflow: 'visible' }}
        >
          {ticks.map((t, i) => (
            <g key={`t-${i}`}>
              <line
                x1={padL} x2={padL + plotW} y1={yRev(t)} y2={yRev(t)}
                stroke={palette.grid} strokeWidth={1}
              />
              <text
                x={padL - 8} y={yRev(t) + 4} textAnchor="end"
                fontSize={11} fill={palette.axis}
              >
                {i === 0 ? '0' : formatInrCompact(t)}
              </text>
            </g>
          ))}

          {showWorkshops && maxWorkshops > 0 && [0, wsTop].map((v) => (
            <text
              key={`w-${v}`} x={padL + plotW + 8} y={yWs(v) + 4}
              textAnchor="start" fontSize={11} fill={palette.line}
            >
              {v}
            </text>
          ))}

          {data.map((d, i) => {
            const revenue = Number(d.revenue) || 0;
            const h = revenue > 0 ? Math.max(2, padT + plotH - yRev(revenue)) : 0;
            const isHover = hover === i;
            return (
              <g key={d.month}>
                {/* Full-height target so the tooltip responds anywhere in the
                    column, not only on a short bar. */}
                <rect
                  x={padL + bandW * i} y={padT} width={bandW || 1} height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  style={{ cursor: 'pointer' }}
                />
                {isHover && (
                  <rect
                    x={padL + bandW * i} y={padT} width={bandW || 1} height={plotH}
                    fill={palette.bar} opacity={0.10} pointerEvents="none"
                  />
                )}
                {h > 0 && (
                  <rect
                    x={xOf(i) - barW / 2} y={yRev(revenue)} width={barW} height={h}
                    rx={3} fill={isHover ? palette.barHover : palette.bar}
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}

          {linePath && (
            <>
              <path
                d={linePath} fill="none" stroke={palette.line}
                strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
                pointerEvents="none"
              />
              {data.map((d, i) => (Number(d.workshops_added) > 0 ? (
                <circle
                  key={`p-${d.month}`} cx={xOf(i)} cy={yWs(d.workshops_added)} r={3}
                  fill={theme.palette.background.paper} stroke={palette.line}
                  strokeWidth={2} pointerEvents="none"
                />
              ) : null))}
            </>
          )}

          {data.map((d, i) => {
            if (i % labelEvery !== 0 && i !== data.length - 1) return null;
            const lbl = monthLabel(d.month);
            if (typeof lbl === 'string') return null;
            return (
              <text
                key={`l-${d.month}`} x={xOf(i)} y={height - 10} textAnchor="middle"
                fontSize={11} fill={palette.axis} pointerEvents="none"
              >
                {lbl.short}
                {(lbl.isJan || i === 0) && (
                  <tspan fontSize={9} fill={palette.axis}> ’{String(lbl.year).slice(-2)}</tspan>
                )}
              </text>
            );
          })}

          {tooltip && (
            <g pointerEvents="none">
              <rect
                x={tipX} y={2} width={tipW} height={tipH} rx={6}
                fill={palette.tooltipBg} opacity={0.97}
                stroke={palette.grid}
              />
              <text x={tipX + 10} y={20} fontSize={11} fill={palette.tooltipText} opacity={0.75}>
                {(() => {
                  const l = monthLabel(tooltip.month);
                  return typeof l === 'string' ? l : `${l.short} ${l.year}`;
                })()}
              </text>
              <text x={tipX + 10} y={40} fontSize={13} fontWeight="700" fill={palette.tooltipText}>
                {formatInr(tooltip.revenue)}
              </text>
              <text x={tipX + 10} y={57} fontSize={11} fill={palette.tooltipText} opacity={0.8}>
                {tooltip.bookings || 0} booking{tooltip.bookings === 1 ? '' : 's'}
                {' · '}{tooltip.seats_sold || 0} seat{tooltip.seats_sold === 1 ? '' : 's'}
              </text>
              {showWorkshops && (
                <text x={tipX + 10} y={73} fontSize={11} fill={palette.line}>
                  {tooltip.workshops_added || 0} workshop
                  {tooltip.workshops_added === 1 ? '' : 's'} added
                </text>
              )}
            </g>
          )}
        </svg>
      )}
    </div>
  );
};

export default MonthlyPerformanceChart;
