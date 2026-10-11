import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  Layers,
  Table,
  Check,
  Target,
  Calculator,
  Info,
  ChevronDown
} from 'lucide-react';

const CHART_TYPES = [
  { id: 'bar', label: 'Bar Chart', icon: BarChart3, desc: 'Compare categories or dimensions' },
  { id: 'stackedBar', label: 'Stacked Bar', icon: Layers, desc: 'Part-to-whole segment breakdown' },
  { id: 'line', label: 'Line Chart', icon: TrendingUp, desc: 'Track trends and trajectory over time' },
  { id: 'area', label: 'Area Chart', icon: Activity, desc: 'Volume and cumulative momentum' },
  { id: 'donut', label: 'Donut Chart', icon: PieChart, desc: 'Proportions and market share' },
  { id: 'waterfall', label: 'Waterfall Walk', icon: BarChart3, desc: 'P&L step bridges and deductions' },
  { id: 'radar', label: 'Radar Chart', icon: Activity, desc: 'Multi-dimensional scorecard' },
  { id: 'gauge', label: 'Radial Gauge', icon: Target, desc: 'Target achievement and SLAs' },
  { id: 'pivot', label: 'Pivot Matrix', icon: Table, desc: 'Cross-tabulation with heatmap colors' }
];

import { COMPLEX_MODIFIERS } from '../services/calculationEngine';

const ALL_MODIFIERS = COMPLEX_MODIFIERS.flatMap(c => c.options);

function CustomModifierDropdown({ value, onChange, groups }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleToggle = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 280);
    }
    setIsOpen(!isOpen);
  };

  const allOptions = groups.flatMap(g => g.options);
  const currentOption = allOptions.find(o => o.id === value) || allOptions[0];
  const currentGroup = groups.find(g => g.options.some(o => o.id === value)) || groups[0];

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: '9px',
          background: 'var(--bg-input)',
          border: `1px solid ${isOpen ? '#6366f1' : (value !== 'RAW' ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-subtle)')}`,
          color: 'var(--text-main)',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 2px var(--accent-indigo-glow)' : 'none',
          transition: 'all 0.2s ease',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: value !== 'RAW' ? '#818cf8' : 'var(--text-faint)',
            boxShadow: value !== 'RAW' ? '0 0 8px #818cf8' : 'none'
          }} />
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{currentOption?.label}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginLeft: '4px' }}>
            ({currentGroup?.category})
          </span>
        </div>
        <ChevronDown
          size={16}
          color="var(--text-muted)"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease'
          }}
        />
      </button>

      {/* Popover Menu - Themed in Executive Dark Glassmorphism */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            ...(openUpward
              ? { bottom: 'calc(100% + 6px)' }
              : { top: 'calc(100% + 6px)' }),
            left: 0,
            right: 0,
            background: '#0a0e18',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            zIndex: 1000,
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '6px'
          }}
        >
          {groups.map((group, gIdx) => (
            <div key={group.category} style={{ marginBottom: gIdx < groups.length - 1 ? '8px' : '0' }}>
              <div style={{
                fontSize: '0.67rem',
                fontWeight: 800,
                color: '#818cf8',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '6px 10px 4px 10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>{group.category}</span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-faint)', fontWeight: 500 }}>
                  {group.options.length} options
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                {group.options.map(opt => {
                  const isSelected = opt.id === value;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        onChange(opt.id);
                        setIsOpen(false);
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.22)' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div>
                        <div style={{
                          fontSize: '0.82rem',
                          fontWeight: isSelected ? 700 : 600,
                          color: isSelected ? '#ffffff' : 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {opt.label}
                        </div>
                        <div style={{
                          fontSize: '0.72rem',
                          color: isSelected ? 'rgba(255, 255, 255, 0.75)' : 'var(--text-muted)',
                          marginTop: '2px',
                          lineHeight: 1.35
                        }}>
                          {opt.desc}
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={16} color="#818cf8" style={{ marginTop: '2px', flexShrink: 0 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WidgetBuilderModal({
  isOpen,
  onClose,
  onSave,
  editingWidget = null,
  columnProfiles = []
}) {
  const [title, setTitle] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [dimension, setDimension] = useState('');
  const [measure, setMeasure] = useState('');
  const [secondaryDimension, setSecondaryDimension] = useState('');
  const [aggregation, setAggregation] = useState('SUM');
  const [modifier, setModifier] = useState('RAW');
  const [colorTheme, setColorTheme] = useState('indigo');
  const [width, setWidth] = useState('half');
  const [targetValue, setTargetValue] = useState(100);
  const [isMaximized, setIsMaximized] = useState(false);

  const measures = columnProfiles.filter(c => c.type === 'measure').map(c => c.name);
  const dimensions = columnProfiles.filter(c => c.type !== 'measure').map(c => c.name);

  useEffect(() => {
    if (editingWidget) {
      setTitle(editingWidget.title || '');
      setChartType(editingWidget.chartType || 'bar');
      setDimension(editingWidget.dimension || dimensions[0] || '');
      setMeasure(editingWidget.measure || measures[0] || '');
      setSecondaryDimension(editingWidget.secondaryDimension || '');
      setAggregation(editingWidget.aggregation || 'SUM');
      setModifier(editingWidget.modifier || 'RAW');
      setColorTheme(editingWidget.colorTheme || 'indigo');
      setWidth(editingWidget.width || 'half');
      setTargetValue(editingWidget.targetValue || 100);
    } else {
      setTitle('');
      setChartType('bar');
      setDimension(dimensions[0] || '');
      setMeasure(measures[0] || '');
      setSecondaryDimension('');
      setAggregation('SUM');
      setModifier('RAW');
      setColorTheme('indigo');
      setWidth('half');
      setTargetValue(100);
    }
  }, [editingWidget, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalTitle = title.trim() || `${measure} by ${dimension}`;
    onSave({
      id: editingWidget?.id || `widget-${Date.now()}`,
      title: finalTitle,
      chartType,
      dimension,
      measure,
      secondaryDimension: secondaryDimension || null,
      aggregation,
      modifier,
      colorTheme,
      width,
      targetValue: Number(targetValue) || 100
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel"
        style={{
          width: isMaximized ? '96vw' : '820px',
          maxWidth: isMaximized ? '96vw' : '90vw',
          height: isMaximized ? '92vh' : 'auto',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {editingWidget ? 'Configure Dashboard Widget' : 'Add Custom Business Widget'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
              Pair dimensions and measures with business calculation modifiers.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s'
              }}
              title={isMaximized ? "Restore size" : "Maximize window"}
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'var(--text-faint)',
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {/* Widget Title */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Widget Title
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={`Auto: ${measure || 'Metric'} by ${dimension || 'Dimension'}`}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Chart Type Selector */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>
              Select Visualization Format
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {CHART_TYPES.map(ct => {
                const Icon = ct.icon;
                const isSelected = chartType === ct.id;
                return (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => setChartType(ct.id)}
                    style={{
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isSelected ? '#6366f1' : 'var(--border-subtle)'}`,
                      borderRadius: '10px',
                      padding: '10px 12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: isSelected ? 'var(--text-main)' : 'var(--text-muted)'
                    }}
                  >
                    <Icon size={18} color={isSelected ? '#818cf8' : 'var(--text-faint)'} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{ct.label}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-faint)' }}>{ct.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimension & Measure Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Primary Dimension (X-Axis / Category)
              </label>
              <select
                className="form-select"
                value={dimension}
                onChange={e => setDimension(e.target.value)}
                required
              >
                {dimensions.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Primary Measure (Y-Axis / Numeric Metric)
              </label>
              <select
                className="form-select"
                value={measure}
                onChange={e => setMeasure(e.target.value)}
                required
              >
                {measures.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Secondary Grouping & Aggregation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Secondary Dimension (Optional Breakdown / Series)
              </label>
              <select
                className="form-select"
                value={secondaryDimension}
                onChange={e => setSecondaryDimension(e.target.value)}
              >
                <option value="">(None - Single Series)</option>
                {dimensions.filter(d => d !== dimension).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Aggregation Function
              </label>
              <select
                className="form-select"
                value={aggregation}
                onChange={e => setAggregation(e.target.value)}
              >
                <option value="SUM">Sum (Total)</option>
                <option value="AVG">Average (Mean)</option>
                <option value="MEDIAN">Median</option>
                <option value="MIN">Minimum</option>
                <option value="MAX">Maximum</option>
                <option value="COUNT">Count of Records</option>
              </select>
            </div>
          </div>

          {/* Complex Calculation Modifier - Extended Categorized Dropdown */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calculator size={13} color="#818cf8" />
                <span>Complex Calculation Modifier</span>
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                {ALL_MODIFIERS.length} analytical modes
              </span>
            </div>

            <CustomModifierDropdown
              value={modifier}
              onChange={setModifier}
              groups={COMPLEX_MODIFIERS}
            />

            {/* Dynamic Formula & Business Meaning Card */}
            {(() => {
              const currentMod = ALL_MODIFIERS.find(m => m.id === modifier) || ALL_MODIFIERS[0];
              return (
                <div style={{
                  marginTop: '8px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: modifier !== 'RAW' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${modifier !== 'RAW' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.06)'}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <Info size={14} color={modifier !== 'RAW' ? '#818cf8' : 'var(--text-muted)'} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    <strong style={{ color: modifier !== 'RAW' ? '#a5b4fc' : 'var(--text-main)', marginRight: '4px' }}>
                      {currentMod?.label}:
                    </strong>
                    {currentMod?.desc}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Width & Palette Settings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Grid Card Span
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['third', 'half', 'full'].map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWidth(w)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      background: width === w ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                      borderColor: width === w ? '#6366f1' : 'var(--border-subtle)'
                    }}
                  >
                    {w === 'third' ? '1/3 Compact' : (w === 'half' ? '1/2 Balanced' : 'Full Width')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Aesthetic Color Theme
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['indigo', 'emerald', 'amber', 'rose', 'cyan'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColorTheme(c)}
                    title={c}
                    style={{
                      flex: 1,
                      height: '32px',
                      borderRadius: '6px',
                      border: colorTheme === c ? '2px solid #ffffff' : '1px solid transparent',
                      background: c === 'indigo' ? '#6366f1' : (c === 'emerald' ? '#10b981' : (c === 'amber' ? '#f59e0b' : (c === 'rose' ? '#f43f5e' : '#06b6d4'))),
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Target Value (if gauge) */}
          {chartType === 'gauge' && (
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                Gauge Target Baseline
              </label>
              <input
                type="number"
                className="form-input"
                value={targetValue}
                onChange={e => setTargetValue(e.target.value)}
              />
            </div>
          )}

          {/* Submit Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ gap: '6px' }}>
              <Check size={16} />
              <span>{editingWidget ? 'Save Widget Changes' : 'Pin Widget to Dashboard'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
