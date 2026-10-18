import React, { useState, useEffect, useMemo } from 'react';
import {
  Bar,
  Line,
  Doughnut,
  Radar
} from 'react-chartjs-2';
import {
  X,
  Minimize2,
  Camera,
  Download,
  FileSpreadsheet,
  Edit2,
  Table,
  BarChart3,
  TrendingUp,
  Search,
  ArrowUpDown,
  Sparkles,
  Info
} from 'lucide-react';
import { aggregateData } from '../services/calculationEngine';
import { exportWidgetToPng, exportToCsv } from '../services/exportService';
import { WaterfallChart } from './WaterfallChart';
import { GaugeWidget } from './GaugeWidget';
import { PivotTableWidget } from './PivotTableWidget';
import { PALETTES } from './WidgetCard';

export function WidgetZoomModal({
  widget,
  data,
  theme,
  customPalette,
  onClose,
  onEdit
}) {
  const [activeView, setActiveView] = useState('chart'); // 'chart' | 'table'
  const [tableSearch, setTableSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!widget) return null;

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
    targetValue = 100
  } = widget;

  const currentPalette = customPalette || PALETTES[colorTheme] || PALETTES.indigo;

  // Aggregate data for this widget
  const aggregated = useMemo(() => {
    return aggregateData({
      rows: data,
      dimension,
      measure,
      aggregation,
      modifier,
      groupBy: secondaryDimension
    });
  }, [data, dimension, measure, aggregation, modifier, secondaryDimension]);

  // Compute summary metrics (Total, Average, Max, Min, Data Points)
  const summaryMetrics = useMemo(() => {
    const values = [];
    const valWithLabel = [];

    aggregated.datasets.forEach(ds => {
      ds.data.forEach((val, idx) => {
        if (typeof val === 'number' && !isNaN(val)) {
          values.push(val);
          valWithLabel.push({
            label: aggregated.labels[idx] || `Item ${idx + 1}`,
            series: ds.label,
            value: val
          });
        }
      });
    });

    if (values.length === 0) {
      return { total: 0, avg: 0, max: { value: 0, label: '-' }, min: { value: 0, label: '-' }, count: 0 };
    }

    const total = values.reduce((sum, v) => sum + v, 0);
    const avg = total / values.length;

    let maxObj = valWithLabel[0];
    let minObj = valWithLabel[0];
    for (let i = 1; i < valWithLabel.length; i++) {
      if (valWithLabel[i].value > maxObj.value) maxObj = valWithLabel[i];
      if (valWithLabel[i].value < minObj.value) minObj = valWithLabel[i];
    }

    return {
      total,
      avg,
      max: maxObj,
      min: minObj,
      count: aggregated.labels.length
    };
  }, [aggregated]);

  const isCurrency = /(revenue|cost|cogs|price|spend|profit|mrr|arr|income|expense|ebitda|gmv)/i.test(measure);
  const isPercent = /(rate|margin|pct|percentage|ratio|growth|share)/i.test(measure) || modifier === 'SHARE_OF_TOTAL' || modifier === 'GROWTH_PCT';

  const formatVal = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '-';
    if (isCurrency) {
      if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
      if (Math.abs(val) >= 1e3) return `$${(val / 1e3).toFixed(1)}k`;
      return `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
    if (isPercent) {
      return `${val.toFixed(2)}%`;
    }
    if (Math.abs(val) >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
    if (Math.abs(val) >= 1e3) return `${(val / 1e3).toFixed(1)}k`;
    return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  // Build rows for underlying data table
  const tableRows = useMemo(() => {
    const rows = [];
    const totalVal = summaryMetrics.total || 1;

    aggregated.labels.forEach((lbl, idx) => {
      aggregated.datasets.forEach(ds => {
        const val = ds.data[idx];
        const numVal = typeof val === 'number' && !isNaN(val) ? val : 0;
        const share = (numVal / totalVal) * 100;

        rows.push({
          category: lbl,
          series: ds.label || 'Default',
          value: numVal,
          formattedValue: formatVal(numVal),
          shareOfTotal: `${share.toFixed(2)}%`
        });
      });
    });

    return rows;
  }, [aggregated, summaryMetrics.total, formatVal]);

  // Filtered & sorted table rows
  const filteredTableRows = useMemo(() => {
    let result = tableRows;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      result = result.filter(r =>
        String(r.category).toLowerCase().includes(q) ||
        String(r.series).toLowerCase().includes(q) ||
        String(r.value).includes(q)
      );
    }
    if (sortCol) {
      result = [...result].sort((a, b) => {
        let va = a[sortCol];
        let vb = b[sortCol];
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [tableRows, tableSearch, sortCol, sortDir]);

  const handleDownloadImage = async () => {
    setIsExporting(true);
    try {
      await exportWidgetToPng('zoomed-widget-lightbox-canvas', title || 'Chart');
    } catch (e) {
      console.error('Failed to export enlarged chart image:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTableCsv = () => {
    const exportData = filteredTableRows.map(r => ({
      [dimension || 'Dimension']: r.category,
      ...(secondaryDimension ? { [secondaryDimension]: r.series } : {}),
      [measure || 'Value']: r.value,
      'Share of Total': r.shareOfTotal
    }));
    exportToCsv(exportData, `${(title || 'Widget_Data').replace(/\s+/g, '_')}`);
  };

  const handleSort = (colKey) => {
    if (sortCol === colKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colKey);
      setSortDir('asc');
    }
  };

  // High-Resolution Chart.js configuration
  const chartJsData = {
    labels: aggregated.labels,
    datasets: aggregated.datasets.map((ds, idx) => {
      const isDonut = chartType === 'donut';
      const isArea = chartType === 'area';
      return {
        label: ds.label,
        data: ds.data,
        backgroundColor: isDonut
          ? currentPalette.gradient
          : (isArea
              ? 'rgba(99, 102, 241, 0.22)'
              : (aggregated.datasets.length > 1
                  ? currentPalette.gradient[idx % currentPalette.gradient.length]
                  : currentPalette.primary)),
        borderColor: isDonut ? '#07090e' : currentPalette.border,
        borderWidth: 2.5,
        borderRadius: chartType.includes('bar') ? 8 : 0,
        fill: isArea ? 'origin' : false,
        tension: chartType === 'line' || isArea ? 0.35 : 0,
        pointRadius: chartType === 'line' || isArea ? 5 : 0,
        pointHoverRadius: 8,
        pointBackgroundColor: currentPalette.border
      };
    })
  };

  const isLight = theme === 'light';
  const textColor = isLight ? '#000000' : '#f8fafc';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: aggregated.datasets.length > 1 || chartType === 'donut',
        position: 'top',
        labels: {
          color: textColor,
          font: { size: 12, weight: '600', family: 'Inter, sans-serif' },
          boxWidth: 14,
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)',
        titleColor: isLight ? '#000000' : '#ffffff',
        bodyColor: isLight ? '#1e293b' : '#cbd5e1',
        borderColor: isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 12,
        titleFont: { size: 13, weight: '700' },
        bodyFont: { size: 12 },
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw;
            return ` ${ctx.dataset.label || measure}: ${formatVal(val)}`;
          }
        }
      }
    },
    scales: chartType === 'donut' || chartType === 'radar' ? {} : {
      x: {
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          font: { size: 11, weight: '600' },
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          font: { size: 11, weight: '600' },
          callback: (val) => formatVal(val)
        }
      }
    }
  };

  const renderEnlargedChart = () => {
    if (chartType === 'waterfall') {
      const firstSeries = aggregated.datasets[0]?.data || [];
      return <WaterfallChart labels={aggregated.labels} values={firstSeries} title={title} theme={theme} />;
    }

    if (chartType === 'gauge') {
      const firstVal = aggregated.datasets[0]?.data[0] || 0;
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ transform: 'scale(1.35)' }}>
            <GaugeWidget
              value={firstVal}
              target={targetValue || 100}
              label={`${measure} (${aggregation})`}
              unit={modifier === 'SHARE_OF_TOTAL' || modifier === 'GROWTH_PCT' ? '%' : ''}
            />
          </div>
        </div>
      );
    }

    if (chartType === 'pivot') {
      return (
        <div style={{ overflow: 'auto', height: '100%', maxHeight: '540px' }}>
          <PivotTableWidget
            data={data}
            rowDim={dimension}
            colDim={secondaryDimension || dimension}
            valMeasure={measure}
            agg={aggregation}
          />
        </div>
      );
    }

    if (chartType === 'line' || chartType === 'area') {
      return <Line key={`zoom-line-${theme}`} data={chartJsData} options={chartOptions} redraw={true} />;
    }

    if (chartType === 'donut') {
      return <Doughnut key={`zoom-donut-${theme}`} data={chartJsData} options={{ ...chartOptions, cutout: '65%' }} redraw={true} />;
    }

    if (chartType === 'radar') {
      return <Radar key={`zoom-radar-${theme}`} data={chartJsData} options={chartOptions} redraw={true} />;
    }

    return (
      <Bar
        key={`zoom-bar-${theme}`}
        data={chartJsData}
        redraw={true}
        options={{
          ...chartOptions,
          scales: {
            ...chartOptions.scales,
            x: { ...chartOptions.scales?.x, stacked: chartType === 'stackedBar' },
            y: { ...chartOptions.scales?.y, stacked: chartType === 'stackedBar' }
          }
        }}
      />
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100, backdropFilter: 'blur(16px)' }}>
      <div
        className="modal-content glass-panel"
        onClick={e => e.stopPropagation()}
        style={{
          width: '94vw',
          maxWidth: '1380px',
          height: '90vh',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 28px',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Top Header Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '16px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-main)' }}>
                {title}
              </h2>
              {modifier !== 'RAW' && (
                <span className="badge badge-amber" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                  {modifier.replace(/_/g, ' ')}
                </span>
              )}
              <span className="badge badge-indigo" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                {chartType.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {measure} ({aggregation}) grouped by <strong>{dimension}</strong>
              {secondaryDimension ? ` & ${secondaryDimension}` : ''} · Spotlight Zoom View
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* View Mode Segmented Pill */}
            <div style={{
              display: 'flex',
              background: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
              padding: '3px',
              borderRadius: '9px',
              border: '1px solid var(--border-subtle)',
              gap: '3px'
            }}>
              <button
                onClick={() => setActiveView('chart')}
                className="btn btn-sm"
                style={{
                  background: activeView === 'chart' ? '#6366f1' : 'transparent',
                  color: activeView === 'chart' ? '#ffffff' : 'var(--text-main)',
                  border: 'none',
                  fontSize: '0.76rem',
                  gap: '5px',
                  fontWeight: 700,
                  padding: '5px 12px'
                }}
              >
                <BarChart3 size={14} />
                <span>Chart View</span>
              </button>
              <button
                onClick={() => setActiveView('table')}
                className="btn btn-sm"
                style={{
                  background: activeView === 'table' ? '#6366f1' : 'transparent',
                  color: activeView === 'table' ? '#ffffff' : 'var(--text-main)',
                  border: 'none',
                  fontSize: '0.76rem',
                  gap: '5px',
                  fontWeight: 700,
                  padding: '5px 12px'
                }}
              >
                <Table size={14} />
                <span>Underlying Data ({tableRows.length})</span>
              </button>
            </div>

            {/* Direct Snapshot PNG */}
            <button
              onClick={handleDownloadImage}
              className="btn btn-secondary btn-sm"
              disabled={isExporting}
              title="Download High-Resolution Chart PNG (2x Retina)"
              style={{ gap: '6px' }}
            >
              <Camera size={14} color="#34d399" />
              <span>Snapshot</span>
            </button>

            {/* Direct Export CSV */}
            <button
              onClick={handleExportTableCsv}
              className="btn btn-secondary btn-sm"
              title="Export Underlying Aggregated Data as CSV"
              style={{ gap: '6px' }}
            >
              <Download size={14} color="#818cf8" />
              <span>Export CSV</span>
            </button>

            {/* Edit Widget Configuration */}
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(widget);
                }}
                className="btn btn-secondary btn-sm"
                title="Edit Chart Parameters & Dimensions"
                style={{ gap: '6px' }}
              >
                <Edit2 size={14} />
                <span>Edit</span>
              </button>
            )}

            {/* Close / Minimize Button */}
            <button
              onClick={onClose}
              title="Minimize & Return to Dashboard Grid (ESC)"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                padding: '7px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s'
              }}
            >
              <Minimize2 size={16} />
            </button>
          </div>
        </div>

        {/* Executive Summary Metrics Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
          flexShrink: 0
        }}>
          {/* Total Metric */}
          <div style={{
            background: isLight ? 'rgba(99, 102, 241, 0.06)' : 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
              Series Total
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {formatVal(summaryMetrics.total)}
            </div>
          </div>

          {/* Average Metric */}
          <div style={{
            background: isLight ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
              Category Average
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {formatVal(summaryMetrics.avg)}
            </div>
          </div>

          {/* Peak / Highest Metric */}
          <div style={{
            background: isLight ? 'rgba(245, 158, 11, 0.06)' : 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
              Peak ({summaryMetrics.max.label})
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {formatVal(summaryMetrics.max.value)}
            </div>
          </div>

          {/* Lowest Metric */}
          <div style={{
            background: isLight ? 'rgba(244, 63, 94, 0.06)' : 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase' }}>
              Trough ({summaryMetrics.min.label})
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {formatVal(summaryMetrics.min.value)}
            </div>
          </div>

          {/* Data Points Count */}
          <div style={{
            background: isLight ? 'rgba(6, 182, 212, 0.06)' : 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: '10px',
            padding: '10px 14px'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase' }}>
              Categories / Points
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {summaryMetrics.count}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          {/* Chart View */}
          {activeView === 'chart' && (
            <div
              id="zoomed-widget-lightbox-canvas"
              style={{
                width: '100%',
                height: '100%',
                minHeight: '380px',
                padding: '12px',
                borderRadius: '12px',
                background: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(10, 14, 23, 0.6)',
                border: '1px solid var(--border-subtle)',
                position: 'relative'
              }}
            >
              {renderEnlargedChart()}
            </div>
          )}

          {/* Underlying Data Table View */}
          {activeView === 'table' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              background: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(10, 14, 23, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '14px',
              overflow: 'hidden'
            }}>
              {/* Table Search & Meta Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
                <div style={{ position: 'relative', width: '280px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    value={tableSearch}
                    onChange={e => setTableSearch(e.target.value)}
                    placeholder="Search dimension / values..."
                    style={{ paddingLeft: '32px', fontSize: '0.8rem', height: '34px' }}
                  />
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Showing <strong>{filteredTableRows.length}</strong> of <strong>{tableRows.length}</strong> records
                </div>
              </div>

              {/* Scrollable Table */}
              <div style={{ flex: 1, overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{
                      background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--border-subtle)',
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <th style={{ padding: '10px 14px', width: '50px', color: 'var(--text-muted)' }}>#</th>
                      <th
                        onClick={() => handleSort('category')}
                        style={{ padding: '10px 14px', cursor: 'pointer', userSelect: 'none', color: 'var(--text-main)', fontWeight: 700 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{dimension || 'Category'}</span>
                          <ArrowUpDown size={12} />
                        </div>
                      </th>
                      {secondaryDimension && (
                        <th
                          onClick={() => handleSort('series')}
                          style={{ padding: '10px 14px', cursor: 'pointer', userSelect: 'none', color: 'var(--text-main)', fontWeight: 700 }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{secondaryDimension}</span>
                            <ArrowUpDown size={12} />
                          </div>
                        </th>
                      )}
                      <th
                        onClick={() => handleSort('value')}
                        style={{ padding: '10px 14px', textAlign: 'right', cursor: 'pointer', userSelect: 'none', color: 'var(--text-main)', fontWeight: 700 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <span>{measure} ({aggregation})</span>
                          <ArrowUpDown size={12} />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('shareOfTotal')}
                        style={{ padding: '10px 14px', textAlign: 'right', cursor: 'pointer', userSelect: 'none', color: 'var(--text-main)', fontWeight: 700 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <span>Share of Total</span>
                          <ArrowUpDown size={12} />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTableRows.map((row, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: idx % 2 === 1 ? (isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)') : 'transparent',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '9px 14px', color: 'var(--text-faint)', fontSize: '0.75rem' }}>{idx + 1}</td>
                        <td style={{ padding: '9px 14px', fontWeight: 600, color: 'var(--text-main)' }}>{row.category}</td>
                        {secondaryDimension && (
                          <td style={{ padding: '9px 14px', color: 'var(--text-muted)' }}>{row.series}</td>
                        )}
                        <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-main)' }}>
                          {row.formattedValue}
                        </td>
                        <td style={{ padding: '9px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#818cf8', fontWeight: 600 }}>
                          {row.shareOfTotal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
