import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, CornerDownLeft, Plus } from 'lucide-react';
import { parseNaturalLanguageQuery } from '../services/smartInsights';

export function SmartQueryBar({ columnProfiles, onAddWidget }) {
  const [query, setQuery] = useState('');
  const [interpretedConfig, setInterpretedConfig] = useState(null);

  // Suggestions based on available columns
  const measures = columnProfiles.filter(c => c.type === 'measure').map(c => c.name);
  const dimensions = columnProfiles.filter(c => c.type !== 'measure').map(c => c.name);

  const sampleQueries = [
    measures[0] && dimensions[0] ? `${measures[0]} by ${dimensions[0]}` : null,
    measures[0] ? `Cumulative ${measures[0]} over time` : null,
    measures[1] && dimensions[0] ? `Share of total ${measures[1]} by ${dimensions[0]}` : null,
    measures[0] ? `${measures[0]} growth rate %` : null
  ].filter(Boolean);

  useEffect(() => {
    if (query.trim().length > 3) {
      const parsed = parseNaturalLanguageQuery(query, columnProfiles);
      setInterpretedConfig(parsed);
    } else {
      setInterpretedConfig(null);
    }
  }, [query, columnProfiles]);

  const handleApply = (e) => {
    e?.preventDefault();
    if (interpretedConfig) {
      onAddWidget({
        id: `widget-${Date.now()}`,
        ...interpretedConfig,
        colorTheme: 'indigo',
        width: 'half'
      });
      setQuery('');
      setInterpretedConfig(null);
    }
  };

  return (
    <div className="glass-panel smart-query-bar" style={{ margin: '0 20px 18px 20px', padding: '14px 20px' }}>
      <form className="smart-query-form" onSubmit={handleApply} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
          <Sparkles size={18} />
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Ask or command the dashboard (e.g. 'Show Revenue by Region', 'Cumulative MRR', 'Defect rate by Supplier')..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              paddingLeft: '14px',
              paddingRight: '80px',
              background: 'rgba(0, 0, 0, 0.25)',
              fontSize: '0.88rem'
            }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={!interpretedConfig}
          style={{ gap: '6px' }}
        >
          <Plus size={15} />
          <span>Add Widget</span>
          <CornerDownLeft size={13} style={{ opacity: 0.7 }} />
        </button>
      </form>

      {/* Suggested Quick Prompt Pills */}
      {!interpretedConfig && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', fontWeight: 600 }}>Quick Prompts:</span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(q)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '9999px',
                padding: '3px 10px',
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.borderColor = '#6366f1'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Live Interpretation Preview Banner */}
      {interpretedConfig && (
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem'
        }}>
          <div>
            <span style={{ color: '#818cf8', fontWeight: 600 }}>Smart Interpretation: </span>
            <span>Create <strong>{interpretedConfig.chartType.toUpperCase()}</strong> chart showing <strong>{interpretedConfig.measure}</strong> grouped by <strong>{interpretedConfig.dimension}</strong></span>
            {interpretedConfig.modifier !== 'RAW' && (
              <span className="badge badge-amber" style={{ marginLeft: '8px' }}>
                Modifier: {interpretedConfig.modifier}
              </span>
            )}
          </div>
          <button
            onClick={handleApply}
            className="btn btn-sm btn-primary"
            style={{ padding: '3px 10px', fontSize: '0.74rem' }}
          >
            Confirm & Pin Widget
          </button>
        </div>
      )}
    </div>
  );
}
