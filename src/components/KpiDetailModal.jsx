import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Activity,
  Layers,
  Target,
  Maximize2,
  Minimize2,
  PlusCircle,
  HelpCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  calculateColumnStats,
  aggregateData,
  calculateKpiDelta
} from '../services/calculationEngine';

export function KpiDetailModal({
  isOpen,
  onClose,
  kpiConfig,
  data = [],
  columnProfiles = [],
  dateColumn = null,
  theme = 'dark',
  onPinWidget = null
}) {
  const [chartMode, setChartMode] = useState('area'); // 'area' | 'bar' | 'cumulative'
  const [breakdownDim, setBreakdownDim] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);

  const dimensions = useMemo(() => {
    return columnProfiles.filter(c => c.type !== 'measure').map(c => c.name);
  }, [columnProfiles]);

  // Set default breakdown dimension if none selected
  const activeBreakdownDim = breakdownDim || dimensions[0] || '';

  // Stats and calculation
  const stats = useMemo(() => {
    if (!kpiConfig?.column || !data.length) return null;
    return calculateColumnStats(data, kpiConfig.column);
  }, [data, kpiConfig]);

  const deltaStats = useMemo(() => {
    if (!kpiConfig?.column || !data.length) return null;
    return calculateKpiDelta(data, kpiConfig.column, dateColumn, kpiConfig.aggregation || 'SUM');
  }, [data, kpiConfig, dateColumn]);

  // Primary Time-Series Trend Data
  const primaryDim = dateColumn || dimensions[0];
  const trendAgg = useMemo(() => {
    if (!primaryDim || !kpiConfig?.column) return { labels: [], datasets: [] };
    const mod = chartMode === 'cumulative' ? 'CUMULATIVE' : 'RAW';
    return aggregateData({
      rows: data,
      dimension: primaryDim,
      measure: kpiConfig.column,
      aggregation: kpiConfig.aggregation || 'SUM',
      modifier: mod,
      sortBy: 'none'
    });
  }, [data, primaryDim, kpiConfig, chartMode]);

  // Secondary Categorical Breakdown Data
  const breakdownAgg = useMemo(() => {
    if (!activeBreakdownDim || !kpiConfig?.column) return { labels: [], datasets: [] };
    return aggregateData({
      rows: data,
      dimension: activeBreakdownDim,
      measure: kpiConfig.column,
      aggregation: kpiConfig.aggregation || 'SUM',
      modifier: 'RAW',
      sortBy: 'desc'
    });
  }, [data, activeBreakdownDim, kpiConfig]);

  if (!isOpen || !kpiConfig) return null;

  const isPositive = (deltaStats?.deltaPct || 0) >= 0;
  const formattedTotal = formatKpiValue(deltaStats?.total ?? 0, kpiConfig);

  // Target Achievement calculation
  const hasTarget = typeof kpiConfig.target === 'number' && kpiConfig.target > 0;
  const targetPct = hasTarget ? Math.min(100, Math.round(((deltaStats?.total || 0) / kpiConfig.target) * 100)) : null;

  const isLight = theme === 'light';
  const axisTextColor = isLight ? '#0f172a' : '#ffffff';
  const axisGridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.16)';
  const axisBorderColor = isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.35)';

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4
      },
      customDataLabels: {
        display: true,
        metricName: kpiConfig.column
      }
    },
    layout: {
      padding: {
        top: 16,
        right: 16,
        bottom: 4
      }
    },
    scales: {
      x: {
        grid: { color: axisGridColor },
        border: { color: axisBorderColor, width: 1 },
        ticks: { color: axisTextColor, font: { size: 11, weight: '600' }, maxRotation: 45 }
      },
      y: {
        grid: { color: axisGridColor },
        border: { color: axisBorderColor, width: 1 },
        ticks: { color: axisTextColor, font: { size: 11, weight: '600' } }
      }
    }
  };

  const trendChartData = {
    labels: trendAgg.labels,
    datasets: [
      {
        label: `${kpiConfig.label || kpiConfig.column} (${kpiConfig.aggregation || 'SUM'})`,
        data: trendAgg.datasets[0]?.data || [],
        borderColor: '#6366f1',
        backgroundColor: chartMode === 'bar' ? 'rgba(99, 102, 241, 0.75)' : 'rgba(99, 102, 241, 0.15)',
        fill: chartMode === 'area' || chartMode === 'cumulative',
        tension: chartMode === 'bar' ? 0 : 0.35,
        borderRadius: 4
      }
    ]
  };

  const breakdownChartData = {
    labels: breakdownAgg.labels.slice(0, 10),
    datasets: [
      {
        label: `${kpiConfig.label || kpiConfig.column} by ${activeBreakdownDim}`,
        data: (breakdownAgg.datasets[0]?.data || []).slice(0, 10),
        backgroundColor: [
          'rgba(99, 102, 241, 0.85)',
          'rgba(16, 185, 129, 0.85)',
          'rgba(245, 158, 11, 0.85)',
          'rgba(236, 72, 153, 0.85)',
          'rgba(20, 184, 166, 0.85)',
          'rgba(168, 85, 247, 0.85)',
          'rgba(59, 130, 246, 0.85)',
          'rgba(244, 63, 94, 0.85)'
        ],
        borderRadius: 4
      }
    ]
  };

  const handlePinAsWidget = () => {
    if (!onPinWidget) return;
    onPinWidget({
      id: `w-kpi-${Date.now()}`,
      title: `${kpiConfig.label || kpiConfig.column} Trend & Analysis`,
      chartType: chartMode === 'bar' ? 'bar' : 'line',
      dimension: primaryDim,
      measure: kpiConfig.column,
      aggregation: kpiConfig.aggregation || 'SUM',
      modifier: chartMode === 'cumulative' ? 'CUMULATIVE' : 'RAW',
      colorTheme: 'indigo',
      width: 'half'
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel"
        onClick={e => e.stopPropagation()}
        style={{
          width: isMaximized ? '98vw' : '880px',
          maxWidth: isMaximized ? '98vw' : '95%',
          height: isMaximized ? '96vh' : 'auto',
          maxHeight: isMaximized ? '96vh' : '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>
                KPI Deep-Dive Studio
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                Measure: {kpiConfig.column} • Aggregation: {kpiConfig.aggregation || 'SUM'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              {kpiConfig.label || kpiConfig.column}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="btn btn-sm"
              title={isMaximized ? "Restore Window Size" : "Maximize Window Fullscreen"}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                padding: '6px 8px',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm"
              title="Close (Esc)"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                padding: '6px 8px',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Top Metric Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {/* Primary Value Card */}
            <div className="glass-panel" style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.07)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                AGGREGATED TOTAL
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                {formattedTotal}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <span className={`badge ${isPositive ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                  {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span>{isPositive ? '+' : ''}{deltaStats?.deltaPct}%</span>
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>vs prior period</span>
              </div>
            </div>

            {/* Benchmark / Target Card */}
            {hasTarget ? (
              <div className="glass-panel" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    BENCHMARK TARGET
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700 }}>
                    {targetPct}% achieved
                  </span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {formatKpiValue(kpiConfig.target, kpiConfig)}
                </div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', marginTop: '10px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${targetPct}%`,
                    height: '100%',
                    background: targetPct >= 100 ? '#10b981' : '#6366f1',
                    borderRadius: '999px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '16px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  AVERAGE PER RECORD
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {formatKpiValue(stats?.mean ?? 0, kpiConfig)}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                  Across {stats?.count ?? 0} data points
                </span>
              </div>
            )}

            {/* Range Card */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                MIN - MAX SPAN
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {formatKpiValue(stats?.min ?? 0, kpiConfig)} — {formatKpiValue(stats?.max ?? 0, kpiConfig)}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                Spread: {formatKpiValue((stats?.max ?? 0) - (stats?.min ?? 0), kpiConfig)}
              </span>
            </div>
          </div>

          {/* Primary Visualization: Timeline Trend */}
          <div className="glass-panel" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="#818cf8" />
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                  Temporal Progression ({primaryDim})
                </span>
              </div>

              {/* Chart Mode Controls */}
              <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setChartMode('area')}
                  className="btn btn-sm"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    background: chartMode === 'area' ? '#6366f1' : 'transparent',
                    color: chartMode === 'area' ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '6px'
                  }}
                >
                  Area Trend
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('bar')}
                  className="btn btn-sm"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    background: chartMode === 'bar' ? '#6366f1' : 'transparent',
                    color: chartMode === 'bar' ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '6px'
                  }}
                >
                  Bar Histogram
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('cumulative')}
                  className="btn btn-sm"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    background: chartMode === 'cumulative' ? '#6366f1' : 'transparent',
                    color: chartMode === 'cumulative' ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '6px'
                  }}
                >
                  Cumulative Walk
                </button>
              </div>
            </div>

            <div style={{ height: isMaximized ? '380px' : '240px', position: 'relative' }}>
              {chartMode === 'bar' ? (
                <Bar data={trendChartData} options={chartOptions} />
              ) : (
                <Line data={trendChartData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Secondary Visualization: Dimension Breakdown */}
          {dimensions.length > 0 && (
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} color="#34d399" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    Categorical Distribution Breakdown
                  </span>
                </div>

                {/* Dimension Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Break down by:</span>
                  <select
                    className="form-select"
                    value={activeBreakdownDim}
                    onChange={e => setBreakdownDim(e.target.value)}
                    style={{ fontSize: '0.76rem', padding: '4px 10px', width: 'auto' }}
                  >
                    {dimensions.map(dim => (
                      <option key={dim} value={dim}>{dim}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ height: isMaximized ? '280px' : '180px', position: 'relative' }}>
                <Bar
                  data={breakdownChartData}
                  options={{
                    ...chartOptions,
                    indexAxis: 'y'
                  }}
                />
              </div>
            </div>
          )}

          {/* Statistical Distribution Profile Grid */}
          {stats && (
            <div className="glass-panel" style={{ padding: '18px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>
                STATISTICAL DISTRIBUTION PROFILE
              </span>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px'
              }}>
                <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>Mean (Avg)</span>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{stats.mean}</div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>Median</span>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{stats.median}</div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>Std Deviation</span>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{stats.stdDev}</div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>Outlier Count</span>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: stats.outlierCount > 0 ? '#fbbf24' : 'inherit' }}>
                    {stats.outlierCount}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
            Dataset contains {data.length.toLocaleString()} row records
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
            >
              Close
            </button>
            {onPinWidget && (
              <button
                type="button"
                onClick={handlePinAsWidget}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <PlusCircle size={14} />
                <span>Pin as Dashboard Widget</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function formatKpiValue(val, config = {}) {
  if (typeof val !== 'number') return String(val);

  const format = config.format || (/(revenue|cost|cogs|price|spend|profit|mrr|arr)/i.test(config.column || '') ? 'currency' : 'compact');

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
