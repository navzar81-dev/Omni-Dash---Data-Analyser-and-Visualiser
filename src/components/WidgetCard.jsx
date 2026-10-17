import React, { useState } from 'react';
import {
  Bar,
  Line,
  Doughnut,
  Radar,
  Scatter
} from 'react-chartjs-2';
import {
  MoreVertical,
  Maximize2,
  Trash2,
  Edit2,
  Copy,
  Download,
  Camera,
  Layers,
  Activity,
  PieChart,
  GripVertical
} from 'lucide-react';
import { aggregateData } from '../services/calculationEngine';
import { exportWidgetToPng } from '../services/exportService';
import { WaterfallChart } from './WaterfallChart';
import { GaugeWidget } from './GaugeWidget';
import { PivotTableWidget } from './PivotTableWidget';

const PALETTES = {
  indigo: {
    primary: 'rgba(99, 102, 241, 0.85)',
    border: '#6366f1',
    gradient: ['rgba(99, 102, 241, 0.9)', 'rgba(168, 85, 247, 0.9)', 'rgba(59, 130, 246, 0.9)', 'rgba(236, 72, 153, 0.9)', 'rgba(20, 184, 166, 0.9)', 'rgba(245, 158, 11, 0.9)']
  },
  emerald: {
    primary: 'rgba(16, 185, 129, 0.85)',
    border: '#10b981',
    gradient: ['rgba(16, 185, 129, 0.9)', 'rgba(5, 150, 105, 0.9)', 'rgba(52, 211, 153, 0.9)', 'rgba(110, 231, 183, 0.9)', 'rgba(6, 95, 70, 0.9)']
  },
  amber: {
    primary: 'rgba(245, 158, 11, 0.85)',
    border: '#f59e0b',
    gradient: ['rgba(245, 158, 11, 0.9)', 'rgba(217, 119, 6, 0.9)', 'rgba(251, 191, 36, 0.9)', 'rgba(252, 211, 77, 0.9)', 'rgba(180, 83, 9, 0.9)']
  },
  rose: {
    primary: 'rgba(244, 63, 94, 0.85)',
    border: '#f43f5e',
    gradient: ['rgba(244, 63, 94, 0.9)', 'rgba(225, 29, 72, 0.9)', 'rgba(251, 113, 133, 0.9)', 'rgba(253, 164, 175, 0.9)', 'rgba(159, 18, 57, 0.9)']
  },
  cyan: {
    primary: 'rgba(6, 182, 212, 0.85)',
    border: '#06b6d4',
    gradient: ['rgba(6, 182, 212, 0.9)', 'rgba(8, 145, 178, 0.9)', 'rgba(34, 211, 238, 0.9)', 'rgba(103, 232, 249, 0.9)', 'rgba(21, 94, 117, 0.9)']
  }
};

export function WidgetCard({
  widget,
  data,
  theme,
  customPalette,
  onEdit,
  onDuplicate,
  onDelete,
  onResize,
  draggable = false,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging = false,
  isDropTarget = false,
  hideControls = false,
  idOverride = null
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const {
    id,
    title,
    chartType = 'bar',
    dimension,
    measure,
    secondaryDimension,
    aggregation = 'SUM',
    modifier = 'RAW',
    colorTheme = 'indigo',
    width = 'half',
    targetValue = 100
  } = widget;

  const currentPalette = customPalette || PALETTES[colorTheme] || PALETTES.indigo;
  const domId = idOverride || `widget-card-${id}`;

  const aggregated = aggregateData({
    rows: data,
    dimension,
    measure,
    aggregation,
    modifier,
    groupBy: secondaryDimension
  });

  const getWidthStyle = () => {
    if (width === 'full') return 'span 12';
    if (width === 'two-thirds') return 'span 8';
    if (width === 'third') return 'span 4';
    if (width === 'quarter') return 'span 3';
    return 'span 6';
  };

  const handleDownloadImage = async () => {
    setIsExporting(true);
    try {
      await exportWidgetToPng(domId, title || 'Chart');
    } catch (e) {
      console.error('Failed to export chart image:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const chartJsData = {
    labels: aggregated.labels,
    datasets: aggregated.datasets.map((ds, idx) => {
      const isDonut = chartType === 'donut';
      const isArea = chartType === 'area';
      const isLine = chartType === 'line' || isArea;

      return {
        label: ds.label,
        data: ds.data,
        backgroundColor: isDonut
          ? currentPalette.gradient
          : (isArea ? 'rgba(99, 102, 241, 0.15)' : (aggregated.datasets.length > 1 ? currentPalette.gradient[idx % currentPalette.gradient.length] : currentPalette.primary)),
        borderColor: isDonut ? '#07090e' : currentPalette.border,
        borderWidth: isDonut ? 2 : 2,
        borderRadius: chartType.includes('bar') ? 6 : 0,
        fill: isArea,
        tension: 0.35,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: currentPalette.border,
        pointRadius: isLine ? 3 : 0,
        pointHoverRadius: 6
      };
    })
  };

  const isLight = theme === 'light';
  const axisTextColor = isLight ? '#0f172a' : '#ffffff';
  const axisGridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.16)';
  const axisBorderColor = isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.35)';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: aggregated.datasets.length > 1 || chartType === 'donut',
        position: 'top',
        align: 'end',
        labels: {
          color: axisTextColor,
          boxWidth: 8,
          boxHeight: 8,
          font: { size: 11, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        padding: 10,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      },
      customDataLabels: {
        display: chartType === 'bar' || chartType === 'stackedBar' || chartType === 'line' || chartType === 'area',
        metricName: measure,
        modifier: modifier
      }
    },
    layout: {
      padding: {
        top: chartType === 'bar' || chartType === 'stackedBar' || chartType === 'line' || chartType === 'area' ? 18 : 6,
        bottom: 4
      }
    },
    scales: chartType === 'donut' ? {} : (chartType === 'radar' ? {
      r: {
        ticks: { color: axisTextColor, backdropColor: 'transparent', font: { size: 10, weight: '600' } },
        grid: { color: axisGridColor },
        pointLabels: { color: axisTextColor, font: { size: 11, weight: '600' } },
        angleLines: { color: axisGridColor }
      }
    } : {
      x: {
        grid: { display: false },
        border: { color: axisBorderColor, width: 1 },
        ticks: {
          color: axisTextColor,
          font: { size: 10.5, weight: '600', family: 'Inter, sans-serif' },
          maxRotation: 45
        }
      },
      y: {
        grid: { color: axisGridColor },
        border: { color: axisBorderColor, width: 1 },
        ticks: {
          color: axisTextColor,
          font: { size: 11, weight: '600', family: 'Inter, sans-serif' },
          callback: (v) => {
            if (modifier === 'GROWTH_PCT' || modifier === 'SHARE_OF_TOTAL') return `${v}%`;
            if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
            if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
            return v;
          }
        }
      }
    })
  };

  const renderChartBody = () => {
    if (chartType === 'waterfall') {
      const firstSeries = aggregated.datasets[0]?.data || [];
      return <WaterfallChart labels={aggregated.labels} values={firstSeries} title={title} theme={theme} />;
    }

    if (chartType === 'gauge') {
      const firstVal = aggregated.datasets[0]?.data[0] || 0;
      return (
        <GaugeWidget
          value={firstVal}
          target={targetValue || 100}
          label={`${measure} (${aggregation})`}
          unit={modifier === 'SHARE_OF_TOTAL' || modifier === 'GROWTH_PCT' ? '%' : ''}
        />
      );
    }

    if (chartType === 'pivot') {
      return (
        <PivotTableWidget
          data={data}
          rowDim={dimension}
          colDim={secondaryDimension || dimension}
          valMeasure={measure}
          agg={aggregation}
        />
      );
    }

    if (chartType === 'line' || chartType === 'area') {
      return <Line key={`${id}-${theme || 'dark'}`} data={chartJsData} options={chartOptions} redraw={true} />;
    }

    if (chartType === 'donut') {
      return <Doughnut key={`${id}-${theme || 'dark'}`} data={chartJsData} options={{ ...chartOptions, cutout: '70%' }} redraw={true} />;
    }

    if (chartType === 'radar') {
      return <Radar key={`${id}-${theme || 'dark'}`} data={chartJsData} options={chartOptions} redraw={true} />;
    }

    return (
      <Bar
        key={`${id}-${theme || 'dark'}`}
        data={chartJsData}
        redraw={true}
        options={{
          ...chartOptions,
          scales: {
            ...chartOptions.scales,
            x: { ...chartOptions.scales.x, stacked: chartType === 'stackedBar' },
            y: { ...chartOptions.scales.y, stacked: chartType === 'stackedBar' }
          }
        }}
      />
    );
  };

  return (
    <div
      id={domId}
      className={`glass-panel widget-card-panel widget-card-draggable ${isDragging ? 'widget-card-dragging' : ''} ${isDropTarget ? 'widget-drop-target-active' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        gridColumn: getWidthStyle(),
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '340px',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: hideControls ? '8px' : '14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          {/* Drag Handle (hidden in slide embeds / presentation capture) */}
          {!hideControls && (
            <div
              className="widget-drag-handle"
              title="Drag to reorder widget on the dashboard"
              style={{ marginTop: '2px' }}
            >
              <GripVertical size={16} />
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: hideControls ? '1.05rem' : '0.98rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-main)' }}>
                {title}
              </h3>
              {modifier !== 'RAW' && (
                <span className="badge badge-amber" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                  {modifier.replace('_', ' ')}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {measure} · {aggregation} by {dimension} {secondaryDimension ? `& ${secondaryDimension}` : ''}
            </div>
          </div>
        </div>

        {/* Action Buttons: Quick Download Image & More Options (hidden in slide embeds / presentation capture) */}
        {!hideControls && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Direct Download Image Button */}
            <button
              onClick={handleDownloadImage}
              title="Download Chart as PNG Image"
              disabled={isExporting}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#34d399'; e.currentTarget.style.borderColor = '#10b981'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              <Camera size={14} />
            </button>

            {/* More Options Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-faint)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px'
                }}
              >
                <MoreVertical size={16} />
              </button>

            {showMenu && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  width: '190px',
                  padding: '6px',
                  zIndex: 40,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
                onMouseLeave={() => setShowMenu(false)}
              >
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
                  onClick={() => { handleDownloadImage(); setShowMenu(false); }}
                >
                  <Download size={13} color="#34d399" />
                  <span>Download Image (PNG)</span>
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
                  onClick={() => { onEdit(widget); setShowMenu(false); }}
                >
                  <Edit2 size={13} />
                  <span>Edit Configuration</span>
                </button>

                {/* Submenu for custom widths */}
                <div style={{ padding: '4px 6px', fontSize: '0.7rem', color: 'var(--text-faint)', fontWeight: 600 }}>
                  WIDTH SPAN:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px', padding: '0 4px 4px 4px' }}>
                  {[
                    { id: 'quarter', label: '1/4' },
                    { id: 'third', label: '1/3' },
                    { id: 'half', label: '1/2' },
                    { id: 'two-thirds', label: '2/3' },
                    { id: 'full', label: 'Full' }
                  ].map(wOpt => (
                    <button
                      key={wOpt.id}
                      type="button"
                      className={`btn btn-xs ${width === wOpt.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '2px 0', fontSize: '0.68rem', justifyContent: 'center' }}
                      onClick={() => {
                        onResize(id, wOpt.id);
                        setShowMenu(false);
                      }}
                    >
                      {wOpt.label}
                    </button>
                  ))}
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
                  onClick={() => { onDuplicate(widget); setShowMenu(false); }}
                >
                  <Copy size={13} />
                  <span>Duplicate Widget</span>
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', border: 'none', color: '#fb7185' }}
                  onClick={() => { onDelete(id); setShowMenu(false); }}
                >
                  <Trash2 size={13} />
                  <span>Remove Widget</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

      {/* Main Chart Body */}
      <div className="widget-card-chart-container" style={{ flex: 1, minHeight: '230px', position: 'relative' }}>
        {renderChartBody()}
      </div>
    </div>
  );
}
