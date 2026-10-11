import React, { useState, useMemo } from 'react';
import {
  Filter,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Code,
  Sliders,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { evaluateCompoundFilters } from '../services/dataModelingService';

const OPERATORS = [
  { value: 'EQUALS', label: '= (Equals)' },
  { value: 'NOT_EQUALS', label: '!= (Not Equals)' },
  { value: 'GREATER', label: '> (Greater Than)' },
  { value: 'GREATER_EQUAL', label: '>= (Greater or Equal)' },
  { value: 'LESS', label: '< (Less Than)' },
  { value: 'LESS_EQUAL', label: '<= (Less or Equal)' },
  { value: 'BETWEEN', label: 'BETWEEN (Range)' },
  { value: 'CONTAINS', label: 'CONTAINS' },
  { value: 'NOT_CONTAINS', label: 'NOT CONTAINS' },
  { value: 'STARTS_WITH', label: 'STARTS WITH' },
  { value: 'IN', label: 'IN (Comma separated)' },
  { value: 'IS_NOT_EMPTY', label: 'IS NOT EMPTY' },
  { value: 'IS_EMPTY', label: 'IS EMPTY' }
];

export function AdvancedFilterModal({
  isOpen,
  onClose,
  data,
  columns,
  columnProfiles,
  activeCompoundRules,
  activeLogicOperator = 'AND',
  onApplyRules
}) {
  const [logicOperator, setLogicOperator] = useState(activeLogicOperator || 'AND');
  const [rules, setRules] = useState(() => {
    if (activeCompoundRules && activeCompoundRules.length > 0) {
      return activeCompoundRules;
    }
    return [
      {
        id: `rule-${Date.now()}-1`,
        column: columns[0] || '',
        operator: 'GREATER',
        value: '',
        value2: ''
      }
    ];
  });

  // Calculate live matching count
  const matchingData = useMemo(() => {
    return evaluateCompoundFilters(data, rules, logicOperator);
  }, [data, rules, logicOperator]);

  const matchPct = data.length > 0 ? Math.round((matchingData.length / data.length) * 100) : 0;

  const handleAddRule = () => {
    const defaultCol = columns[0] || '';
    const prof = columnProfiles.find(c => c.name === defaultCol);
    const op = prof?.type === 'measure' ? 'GREATER' : 'EQUALS';
    setRules([
      ...rules,
      {
        id: `rule-${Date.now()}-${rules.length + 1}`,
        column: defaultCol,
        operator: op,
        value: '',
        value2: ''
      }
    ]);
  };

  const handleUpdateRule = (idx, field, val) => {
    const next = [...rules];
    next[idx] = { ...next[idx], [field]: val };
    // If column changed, auto-suggest good operator
    if (field === 'column') {
      const prof = columnProfiles.find(c => c.name === val);
      if (prof?.type === 'measure') {
        next[idx].operator = 'GREATER';
      } else {
        next[idx].operator = 'EQUALS';
      }
    }
    setRules(next);
  };

  const handleRemoveRule = (idx) => {
    setRules(rules.filter((_, i) => i !== idx));
  };

  const handleClearAll = () => {
    setRules([]);
  };

  const handleApply = () => {
    const valid = rules.filter(r => r && r.column && r.operator);
    onApplyRules(valid, logicOperator);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel"
        style={{
          width: '780px',
          maxWidth: '92vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                padding: '6px',
                borderRadius: '8px',
                color: '#fff',
                display: 'flex'
              }}>
                <Filter size={18} />
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Advanced Multi-Clause Predicate Filter
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
              Build compound SQL-like filtering expressions with logical AND/OR conditions across dimensions and measures.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px 8px'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Logic Mode Toggle & Stats */}
        <div className="glass-panel" style={{ padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Match Mode:
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                className={`btn btn-xs ${logicOperator === 'AND' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLogicOperator('AND')}
              >
                ALL conditions (AND)
              </button>
              <button
                type="button"
                className={`btn btn-xs ${logicOperator === 'OR' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLogicOperator('OR')}
              >
                ANY condition (OR)
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Matching Scope:</span>
            <span className="badge badge-indigo" style={{ fontFamily: 'var(--font-mono)' }}>
              {matchingData.length.toLocaleString()} of {data.length.toLocaleString()} ({matchPct}%)
            </span>
          </div>
        </div>

        {/* Rules Container */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', paddingRight: '4px' }}>
          {rules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No active compound rules. Click "Add Condition Rule" to begin.
            </div>
          ) : (
            rules.map((rule, idx) => {
              const selectedProfile = columnProfiles.find(c => c.name === rule.column);
              const isBetween = rule.operator === 'BETWEEN';
              const noValNeeded = rule.operator === 'IS_EMPTY' || rule.operator === 'IS_NOT_EMPTY';

              return (
                <div
                  key={rule.id || idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isBetween ? '2fr 2fr 1.5fr 1.5fr 36px' : (noValNeeded ? '2fr 2.5fr 36px' : '2fr 2fr 3fr 36px'),
                    gap: '8px',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    padding: '10px 14px',
                    borderRadius: '8px'
                  }}
                >
                  {/* Column Picker */}
                  <select
                    className="form-select"
                    value={rule.column}
                    onChange={e => handleUpdateRule(idx, 'column', e.target.value)}
                    style={{ height: '34px', fontSize: '0.8rem' }}
                  >
                    {columns.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  {/* Operator Picker */}
                  <select
                    className="form-select"
                    value={rule.operator}
                    onChange={e => handleUpdateRule(idx, 'operator', e.target.value)}
                    style={{ height: '34px', fontSize: '0.8rem' }}
                  >
                    {OPERATORS.map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>

                  {/* Value Input */}
                  {!noValNeeded && (
                    <input
                      type={selectedProfile?.type === 'measure' ? 'number' : 'text'}
                      className="form-input"
                      value={rule.value}
                      onChange={e => handleUpdateRule(idx, 'value', e.target.value)}
                      placeholder={isBetween ? 'Min value' : 'Filter value...'}
                      style={{ height: '34px', fontSize: '0.8rem' }}
                    />
                  )}

                  {/* Second Value Input for BETWEEN */}
                  {isBetween && (
                    <input
                      type="number"
                      className="form-input"
                      value={rule.value2 || ''}
                      onChange={e => handleUpdateRule(idx, 'value2', e.target.value)}
                      placeholder="Max value"
                      style={{ height: '34px', fontSize: '0.8rem' }}
                    />
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                    title="Remove rule"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAddRule}
              style={{ gap: '6px' }}
            >
              <Plus size={14} />
              <span>Add Condition Rule</span>
            </button>
            {rules.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClearAll}
                style={{ gap: '6px' }}
              >
                <RotateCcw size={14} />
                <span>Clear All Rules</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApply}
            style={{ gap: '6px' }}
          >
            <CheckCircle2 size={16} />
            <span>Apply Compound Filters ({matchingData.length} records)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
