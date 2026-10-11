import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sliders,
  DollarSign,
  Percent,
  Hash,
  Target,
  Check,
  Maximize2,
  Minimize2
} from 'lucide-react';

export function KpiManagerModal({
  isOpen,
  onClose,
  kpiCards = [],
  columnProfiles = [],
  onSaveKpis
}) {
  const [cards, setCards] = useState(() => JSON.parse(JSON.stringify(kpiCards)));
  const [isMaximized, setIsMaximized] = useState(false);

  if (!isOpen) return null;

  const measureCols = columnProfiles.filter(c => c.type === 'measure').map(c => c.name);

  const handleAddCard = () => {
    const available = measureCols.find(m => !cards.some(c => c.column === m)) || measureCols[0] || 'Metric';
    const newCard = {
      id: `kpi-${Date.now()}`,
      column: available,
      label: available.replace(/_/g, ' '),
      aggregation: 'SUM',
      format: /(revenue|cost|cogs|price|spend|profit|mrr|arr)/i.test(available) ? 'currency' : 'compact',
      target: null
    };
    setCards([...cards, newCard]);
  };

  const handleRemoveCard = (index) => {
    setCards(cards.filter((_, idx) => idx !== index));
  };

  const handleMove = (index, direction) => {
    const newCards = [...cards];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newCards.length) return;
    const temp = newCards[index];
    newCards[index] = newCards[targetIdx];
    newCards[targetIdx] = temp;
    setCards(newCards);
  };

  const handleChange = (index, field, value) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };
    // If column changed, auto-update label if unmodified
    if (field === 'column' && (!newCards[index].label || newCards[index].label === cards[index].column)) {
      newCards[index].label = value.replace(/_/g, ' ');
    }
    setCards(newCards);
  };

  const handleResetDefaults = () => {
    const defaultCards = measureCols.slice(0, 4).map((col, idx) => ({
      id: `kpi-def-${idx}-${Date.now()}`,
      column: col,
      label: col.replace(/_/g, ' '),
      aggregation: 'SUM',
      format: /(revenue|cost|cogs|price|spend|profit|mrr|arr)/i.test(col) ? 'currency' : 'compact',
      target: null
    }));
    setCards(defaultCards);
  };

  const handleSave = () => {
    onSaveKpis(cards);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel"
        onClick={e => e.stopPropagation()}
        style={{
          width: isMaximized ? '98vw' : '750px',
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
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8'
            }}>
              <Sliders size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Customize Executive KPI Cards
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                Select measures, aggregations, custom labels, and benchmark targets
              </span>
            </div>
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

        {/* List of KPI Cards */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              ACTIVE DASHBOARD CARDS ({cards.length})
            </span>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="btn btn-sm"
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                gap: '5px'
              }}
            >
              <RotateCcw size={12} />
              <span>Restore Defaults</span>
            </button>
          </div>

          {cards.length === 0 ? (
            <div style={{
              padding: '36px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '10px',
              border: '1px dashed var(--border-subtle)'
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 12px 0' }}>
                No KPI cards configured. Click below to add metrics to your dashboard header.
              </p>
              <button
                type="button"
                onClick={handleAddCard}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px' }}
              >
                <Plus size={14} />
                <span>Add First KPI Card</span>
              </button>
            </div>
          ) : (
            cards.map((card, idx) => (
              <div
                key={card.id || idx}
                className="glass-panel"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px'
                }}
              >
                {/* Top Row: Reorder, Metric Column, Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  
                  {/* Reorder Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, -1)}
                      className="btn btn-sm"
                      style={{ padding: '2px 4px', height: '18px', opacity: idx === 0 ? 0.3 : 1 }}
                    >
                      <ArrowUp size={11} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === cards.length - 1}
                      onClick={() => handleMove(idx, 1)}
                      className="btn btn-sm"
                      style={{ padding: '2px 4px', height: '18px', opacity: idx === cards.length - 1 ? 0.3 : 1 }}
                    >
                      <ArrowDown size={11} />
                    </button>
                  </div>

                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#818cf8', width: '20px' }}>
                    #{idx + 1}
                  </span>

                  {/* Measure Column Selector */}
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-faint)', display: 'block', marginBottom: '2px' }}>
                      Data Column
                    </label>
                    <select
                      className="form-select"
                      value={card.column}
                      onChange={e => handleChange(idx, 'column', e.target.value)}
                      style={{ fontSize: '0.82rem', padding: '6px 10px', fontWeight: 600 }}
                    >
                      {measureCols.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Label Input */}
                  <div style={{ flex: 1.2 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-faint)', display: 'block', marginBottom: '2px' }}>
                      Card Header Display Name
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={card.label}
                      onChange={e => handleChange(idx, 'label', e.target.value)}
                      placeholder="e.g. Net ARR"
                      style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                    />
                  </div>

                  {/* Remove Card Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveCard(idx)}
                    className="btn btn-sm"
                    style={{
                      background: 'rgba(244, 63, 94, 0.1)',
                      color: '#f43f5e',
                      border: '1px solid rgba(244, 63, 94, 0.2)',
                      padding: '8px',
                      borderRadius: '8px',
                      marginTop: '16px'
                    }}
                    title="Remove this KPI card"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Bottom Row: Aggregation, Format, Target Benchmark */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '10px',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.04)'
                }}>
                  {/* Aggregation */}
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-faint)', display: 'block', marginBottom: '2px' }}>
                      Aggregation
                    </label>
                    <select
                      className="form-select"
                      value={card.aggregation || 'SUM'}
                      onChange={e => handleChange(idx, 'aggregation', e.target.value)}
                      style={{ fontSize: '0.78rem', padding: '5px 8px' }}
                    >
                      <option value="SUM">Sum (Total)</option>
                      <option value="AVG">Average (Mean)</option>
                      <option value="COUNT">Count</option>
                      <option value="MAX">Maximum</option>
                      <option value="MIN">Minimum</option>
                    </select>
                  </div>

                  {/* Format */}
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-faint)', display: 'block', marginBottom: '2px' }}>
                      Number Format
                    </label>
                    <select
                      className="form-select"
                      value={card.format || 'currency'}
                      onChange={e => handleChange(idx, 'format', e.target.value)}
                      style={{ fontSize: '0.78rem', padding: '5px 8px' }}
                    >
                      <option value="currency">Currency ($19.5M)</option>
                      <option value="compact">Compact Number (19.5M)</option>
                      <option value="percent">Percentage (%)</option>
                      <option value="raw">Raw Integer/Float</option>
                    </select>
                  </div>

                  {/* Target Benchmark */}
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-faint)', display: 'block', marginBottom: '2px' }}>
                      Benchmark Target (Optional)
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={card.target ?? ''}
                      onChange={e => handleChange(idx, 'target', e.target.value ? Number(e.target.value) : null)}
                      placeholder="e.g. 20000000"
                      style={{ fontSize: '0.78rem', padding: '5px 8px' }}
                    />
                  </div>
                </div>

              </div>
            ))
          )}

          {/* Add KPI Button */}
          {cards.length > 0 && (
            <button
              type="button"
              onClick={handleAddCard}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px',
                borderStyle: 'dashed'
              }}
            >
              <Plus size={14} />
              <span>Add Another Metric Card</span>
            </button>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
            Changes will be reflected across dashboard and exported reports
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Check size={14} />
              <span>Apply & Save KPI Layout</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
