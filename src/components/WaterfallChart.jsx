import React from 'react';

/**
 * Custom High-Fidelity SVG Waterfall Chart for Financial P&L Walks and Variance Analysis
 */
export function WaterfallChart({ labels = [], values = [], title = 'Waterfall Breakdown', theme = 'dark' }) {
  if (!labels || labels.length === 0 || !values || values.length === 0) {
    return <div style={{ color: 'var(--text-faint)', textAlign: 'center', padding: '20px' }}>Insufficient data for Waterfall walk.</div>;
  }

  // Calculate cumulative steps
  let currentRunning = 0;
  const steps = labels.map((lbl, idx) => {
    const rawVal = values[idx] || 0;
    const isTotal = idx === labels.length - 1; // Last element treated as final subtotal
    const startVal = isTotal ? 0 : currentRunning;
    const endVal = isTotal ? currentRunning : currentRunning + rawVal;
    const isPositive = rawVal >= 0;

    if (!isTotal) {
      currentRunning += rawVal;
    }

    return {
      label: lbl,
      rawVal,
      startVal,
      endVal,
      isTotal,
      isPositive
    };
  });

  const allBounds = steps.flatMap(s => [s.startVal, s.endVal, 0]);
  let minBound = 0;
  let maxBound = 1;
  for (let i = 0; i < allBounds.length; i++) {
    const v = allBounds[i];
    if (typeof v === 'number' && !isNaN(v)) {
      if (v < minBound) minBound = v;
      if (v > maxBound) maxBound = v;
    }
  }
  const boundRange = maxBound - minBound || 1;

  const chartHeight = 220;
  const paddingBottom = 40;
  const usableHeight = chartHeight - paddingBottom;

  const getY = (val) => {
    return usableHeight - ((val - minBound) / boundRange) * usableHeight;
  };

  const isLight = theme === 'light';
  const textColor = isLight ? '#0f172a' : '#ffffff';
  const baselineColor = isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.3)';
  const connectorColor = isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.35)';

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: `${chartHeight}px`, position: 'relative' }}>
        <svg width="100%" height={chartHeight} style={{ overflow: 'visible' }}>
          {/* Zero baseline */}
          <line
            x1="0"
            y1={getY(0)}
            x2="100%"
            y2={getY(0)}
            stroke={baselineColor}
            strokeDasharray="4 4"
          />

          {steps.map((step, idx) => {
            const stepWidthPct = 100 / steps.length;
            const barWidthPct = stepWidthPct * 0.65;
            const xOffsetPct = stepWidthPct * idx + (stepWidthPct - barWidthPct) / 2;

            const yTop = Math.min(getY(step.startVal), getY(step.endVal));
            const yBottom = Math.max(getY(step.startVal), getY(step.endVal));
            const barHeight = Math.max(yBottom - yTop, 3);

            let barColor = step.isPositive ? '#10b981' : '#f43f5e';
            if (step.isTotal) barColor = '#6366f1';

            return (
              <g key={idx}>
                {/* Bar rectangle */}
                <rect
                  x={`${xOffsetPct}%`}
                  y={yTop}
                  width={`${barWidthPct}%`}
                  height={barHeight}
                  fill={barColor}
                  rx="4"
                  opacity="0.9"
                />

                {/* Connector line to next step */}
                {idx < steps.length - 1 && (
                  <line
                    x1={`${xOffsetPct + barWidthPct}%`}
                    y1={getY(step.endVal)}
                    x2={`${stepWidthPct * (idx + 1) + (stepWidthPct - barWidthPct) / 2}%`}
                    y2={getY(step.endVal)}
                    stroke={connectorColor}
                    strokeDasharray="2 2"
                  />
                )}

                {/* Value label */}
                <text
                  x={`${xOffsetPct + barWidthPct / 2}%`}
                  y={yTop - 6}
                  fill={textColor}
                  fontSize="11.5"
                  fontWeight="700"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  {step.rawVal >= 0 && !step.isTotal ? '+' : ''}{formatCompact(step.rawVal)}
                </text>

                {/* Dimension label */}
                <text
                  x={`${xOffsetPct + barWidthPct / 2}%`}
                  y={chartHeight - 12}
                  fill={textColor}
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {truncateText(step.label, 12)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function formatCompact(val) {
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toFixed(0);
}

function truncateText(str, max = 10) {
  if (!str) return '';
  return str.length > max ? `${str.slice(0, max)}...` : str;
}
