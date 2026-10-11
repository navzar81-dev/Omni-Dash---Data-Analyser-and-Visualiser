import React, { useState, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Sliders,
  Plus,
  ArrowUpRight,
  X,
  Target,
  Sparkles,
  RotateCcw,
  Save,
  Download,
  Upload,
  Check
} from 'lucide-react';
import { calculateKpiDelta } from '../services/calculationEngine';

export function ExecutiveKpis({
  data,
  columnProfiles,
  dateColumn,
  kpiCards = null,
  onSelectKpi = null,
  onOpenKpiManager = null,
  onRemoveKpi = null,
  onResetLayout = null,
  onSaveView = null,
  onExportView = null,
  onImportView = null
}) {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef(null);
  // If no custom kpiCards configured, fallback to first 4 measure columns
  const activeCards = kpiCards && kpiCards.length > 0
    ? kpiCards
    : columnProfiles
        .filter(c => c.type === 'measure')
        .slice(0, 4)
        .map((col, idx) => ({
          id: `kpi-def-${idx}`,
          column: col.name,
          label: col.name.replace(/_/g, ' '),
          aggregation: 'SUM',
          format: /(revenue|cost|cogs|price|spend|profit|mrr|arr)/i.test(col.name) ? 'currency' : 'compact',
          target: null
        }));

  if (activeCards.length === 0 || !data || data.length === 0) return null;

  const handleSaveClick = () => {
    if (onSaveView) {
      onSaveView();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (file && onImportView) {
      onImportView(file);
    }
    if (e.target) e.target.value = '';
  };

  return (
    <div style={{ margin: '0 20px 20px 20px' }}>
      
      {/* Top Controls Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Executive Performance KPIs
          </span>
          <span className="badge badge-indigo" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
            {activeCards.length} Active
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '2px 8px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600
            }}
            title="Customizations for this dataset are automatically preserved in local storage across refreshes"
          >
            <Sparkles size={11} color="#34d399" />
            <span>Setup Preserved</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Hidden File Input for JSON View Import */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />

          {/* Explicit Save View Button */}
          {onSaveView && (
            <button
              type="button"
              onClick={handleSaveClick}
              className="btn btn-sm"
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                background: saveSuccess ? 'rgba(16, 185, 129, 0.18)' : 'rgba(99, 102, 241, 0.12)',
                border: saveSuccess ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(99, 102, 241, 0.3)',
                color: saveSuccess ? '#34d399' : '#818cf8',
                gap: '5px',
                transition: 'all 0.2s ease'
              }}
              title="Explicitly save the customized view (KPIs, widgets, filters) for this dataset to browser storage"
            >
              {saveSuccess ? <Check size={12} color="#34d399" /> : <Save size={12} color="#818cf8" />}
              <span style={{ fontWeight: 600 }}>{saveSuccess ? 'View Saved!' : 'Save View'}</span>
            </button>
          )}

          {/* Export View JSON */}
          {onExportView && (
            <button
              type="button"
              onClick={onExportView}
              className="btn btn-sm"
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                gap: '5px'
              }}
              title="Export this customized dashboard configuration as a portable JSON file"
            >
              <Download size={12} />
              <span>Export View</span>
            </button>
          )}

          {/* Import View JSON */}
          {onImportView && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-sm"
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                gap: '5px'
              }}
              title="Import a previously saved dashboard configuration (.json) for this dataset"
            >
              <Upload size={12} />
              <span>Import View</span>
            </button>
          )}

          {/* Reset Setup */}
          {onResetLayout && (
            <button
              type="button"
              onClick={onResetLayout}
              className="btn btn-sm"
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                gap: '5px'
              }}
              title="Reset KPIs and widgets to default setup for this dataset"
            >
              <RotateCcw size={12} />
              <span>Reset Setup</span>
            </button>
          )}

          {/* Customize Cards */}
          {onOpenKpiManager && (
            <>
              <button
                type="button"
                onClick={onOpenKpiManager}
                className="btn btn-sm"
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  gap: '5px'
                }}
              >
                <Sliders size={13} />
                <span>Customize Cards</span>
              </button>
              <button
                type="button"
                onClick={onOpenKpiManager}
                className="btn btn-sm btn-primary"
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  gap: '5px'
                }}
              >
                <Plus size={13} />
                <span>Add Metric</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        className="executive-kpis-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}
      >
        {activeCards.map((card, idx) => {
          const stats = calculateKpiDelta(data, card.column, dateColumn, card.aggregation || 'SUM');
          const isPositive = stats.deltaPct >= 0;
          const formattedTotal = formatMetricValue(stats.total, card);

          // Target Progress if configured
          const hasTarget = typeof card.target === 'number' && card.target > 0;
          const targetPct = hasTarget ? Math.min(100, Math.round((stats.total / card.target) * 100)) : null;

          // Normalize sparkline points for SVG polygon
          const trend = stats.trend;
          let minVal = 0;
          let maxVal = 1;
          for (let t = 0; t < trend.length; t++) {
            const tv = trend[t];
            if (typeof tv === 'number' && !isNaN(tv)) {
              if (tv < minVal) minVal = tv;
              if (tv > maxVal) maxVal = tv;
            }
          }
          const range = maxVal - minVal || 1;
          const width = 80;
          const height = 28;

          const points = trend.map((v, i) => {
            const x = (i / (trend.length - 1 || 1)) * width;
            const y = height - ((v - minVal) / range) * (height - 6) - 3;
            return `${x},${y}`;
          }).join(' ');

          return (
            <div
              key={card.id || card.column || idx}
              className="glass-panel kpi-card-panel"
              onClick={() => onSelectKpi && onSelectKpi(card)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectKpi && onSelectKpi(card);
                }
              }}
              style={{
                padding: '16px 20px',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Quick Remove Button (hover/visible) */}
              {onRemoveKpi && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveKpi(idx);
                  }}
                  className="btn btn-sm"
                  title="Remove this KPI"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    padding: '3px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-faint)',
                    opacity: 0.6,
                    cursor: 'pointer',
                    zIndex: 2
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#f43f5e'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--text-faint)'; }}
                >
                  <X size={13} />
                </button>
              )}

              {/* Top Row: Metric Name & Icon + Explore indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', paddingRight: onRemoveKpi ? '20px' : '0' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                    {card.label || card.column.replace(/_/g, ' ')}
                  </span>
                  {card.aggregation && card.aggregation !== 'SUM' && (
                    <span style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: 600 }}>
                      {card.aggregation}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: idx % 3 === 0 ? 'rgba(99, 102, 241, 0.15)' : (idx % 3 === 1 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: idx % 3 === 0 ? '#818cf8' : (idx % 3 === 1 ? '#34d399' : '#fbbf24')
                  }}>
                    {card.format === 'currency' ? <DollarSign size={15} /> : <Activity size={15} />}
                  </div>
                  <ArrowUpRight size={14} color="var(--text-faint)" className="kpi-hover-arrow" />
                </div>
              </div>

              {/* Middle Row: Primary Aggregated Value & Sparkline */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)' }}>
                  {formattedTotal}
                </div>

                {/* Sparkline */}
                {trend.length > 1 && (
                  <svg width={width} height={height} style={{ overflow: 'visible' }}>
                    <polyline
                      fill="none"
                      stroke={isPositive ? '#10b981' : '#f43f5e'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points}
                    />
                  </svg>
                )}
              </div>

              {/* Target Benchmark Progress Bar (if configured) */}
              {hasTarget && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-faint)', marginBottom: '3px' }}>
                    <span>Goal: {formatMetricValue(card.target, card)}</span>
                    <span style={{ color: targetPct >= 100 ? '#10b981' : '#818cf8', fontWeight: 700 }}>
                      {targetPct}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${targetPct}%`,
                      height: '100%',
                      background: targetPct >= 100 ? '#10b981' : '#6366f1',
                      borderRadius: '999px'
                    }} />
                  </div>
                </div>
              )}

              {/* Bottom Row: Delta & Comparison Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${isPositive ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.72rem', padding: '2px 7px' }}>
                    {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    <span>{isPositive ? '+' : ''}{stats.deltaPct}%</span>
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                    vs prior timeline
                  </span>
                </div>

                <span style={{ fontSize: '0.68rem', color: '#818cf8', fontWeight: 600, opacity: 0.85 }}>
                  Explore ↗
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatMetricValue(val, card = {}) {
  if (typeof val !== 'number') return String(val);

  const colName = card.column || '';
  const format = card.format || (/(revenue|cost|cogs|price|spend|profit|mrr|arr)/i.test(colName) ? 'currency' : 'compact');

  if (format === 'percent') {
    return `${val.toFixed(1)}%`;
  }

  let formatted = '';
  if (Math.abs(val) >= 1_000_000) {
    formatted = `${(val / 1_000_000).toFixed(2)}M`;
  } else if (Math.abs(val) >= 1_000) {
    formatted = `${(val / 1_000).toFixed(1)}K`;
  } else {
    formatted = val.toLocaleString();
  }

  if (format === 'currency') {
    return `$${formatted}`;
  }
  return formatted;
}
