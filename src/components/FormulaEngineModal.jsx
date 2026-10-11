import React, { useState } from 'react';
import { Calculator, X, Plus, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { evaluateCustomFormula } from '../services/calculationEngine';

export function FormulaEngineModal({
  isOpen,
  onClose,
  data,
  columns,
  columnProfiles,
  onFormulaAdded
}) {
  const [formulaName, setFormulaName] = useState('');
  const [expression, setExpression] = useState('');
  const [previewError, setPreviewError] = useState(null);

  if (!isOpen) return null;

  const measures = columnProfiles.filter(c => c.type === 'measure').map(c => c.name);

  // Preset quick templates
  const presets = [
    {
      name: 'Profit_Margin_Pct',
      expr: '(([Gross_Profit] / [Revenue]) * 100)',
      desc: 'Calculates Gross Margin Percentage'
    },
    {
      name: 'Annual_Run_Rate',
      expr: '([MRR] * 12)',
      desc: 'Annualized recurring revenue from MRR'
    },
    {
      name: 'Net_Operating_Spread',
      expr: '([Revenue] - [COGS] - [OPEX])',
      desc: 'EBITDA / Operating surplus after expenses'
    },
    {
      name: 'Efficiency_Ratio',
      expr: '([Revenue] / [Headcount])',
      desc: 'Revenue generated per employee'
    }
  ];

  // Insert column token into formula
  const insertToken = (token) => {
    setExpression(prev => `${prev}${token}`);
  };

  // Test evaluation on first 3 rows
  let samplePreview = [];
  try {
    if (expression.trim() && formulaName.trim()) {
      const computed = evaluateCustomFormula(data.slice(0, 3), formulaName.trim(), expression.trim());
      samplePreview = computed.map(r => r[formulaName.trim()]);
    }
  } catch (err) {
    // syntax error
  }

  const handleApply = (e) => {
    e.preventDefault();
    if (!formulaName.trim() || !expression.trim()) return;

    onFormulaAdded(formulaName.trim(), expression.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel"
        style={{ width: '750px', padding: '26px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981'
            }}>
              <Calculator size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Custom Calculated Field & Formula Builder</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                Create virtual metric columns dynamically with arithmetic, margins, and ratios.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Quick Presets */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Quick Business Calculation Formulas:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {presets.map(p => (
              <button
                key={p.name}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFormulaName(p.name);
                  setExpression(p.expr);
                }}
                style={{ fontSize: '0.74rem', padding: '4px 10px' }}
              >
                <Sparkles size={12} color="#fbbf24" />
                <span>{p.name.replace(/_/g, ' ')}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Field Name */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Calculated Column Name
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. EBITDA_Margin_Pct, Net_Revenue, Cost_Per_Unit"
              value={formulaName}
              onChange={e => setFormulaName(e.target.value.replace(/\s+/g, '_'))}
              required
            />
          </div>

          {/* Interactive Available Measures */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Click to Insert Column into Formula:
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '90px', overflowY: 'auto' }}>
              {measures.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => insertToken(`[${m}]`)}
                  style={{
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    color: '#818cf8',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  [{m}]
                </button>
              ))}
            </div>
          </div>

          {/* Operator Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[' + ', ' - ', ' * ', ' / ', '(', ')', 'IF([Val] > 0, 1, 0)', 'ROUND(', 'SQRT(', 'LOG('].map(op => (
              <button
                key={op}
                type="button"
                onClick={() => insertToken(op)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '3px 9px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
              >
                {op.trim()}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setExpression('')}
              className="btn btn-secondary btn-sm"
              style={{ color: '#fb7185', fontSize: '0.72rem' }}
            >
              Clear
            </button>
          </div>

          {/* Formula Expression Textarea */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Formula Expression
            </label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. ([Revenue] - [COGS]) / [Revenue] * 100"
              value={expression}
              onChange={e => setExpression(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.86rem' }}
              required
            />
          </div>

          {/* Live Preview Calculation */}
          {samplePreview.length > 0 && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CheckCircle2 size={16} color="#10b981" />
              <div>
                <span style={{ color: '#34d399', fontWeight: 600 }}>Valid Formula: </span>
                <span>Sample evaluation on first records: </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  [{samplePreview.map(v => v !== null ? v : 'null').join(', ')}]
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ gap: '6px' }} disabled={!formulaName || !expression}>
              <Plus size={16} />
              <span>Register Calculated Column</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
