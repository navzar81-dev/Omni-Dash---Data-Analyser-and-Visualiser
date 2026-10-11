import React from 'react';
import { Sparkles, X, TrendingUp, AlertTriangle, PieChart, ArrowRight, Zap } from 'lucide-react';

export function SmartInsightsDrawer({
  isOpen,
  onClose,
  insights,
  onApplyInsight
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div
        className="glass-panel drawer-panel"
        style={{
          width: 'min(420px, 100vw)',
          maxWidth: '100vw',
          height: '100vh',
          borderRadius: '16px 0 0 16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.6)',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Automated Smart Insights</h2>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Algorithmic findings, correlations & anomalies
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* List of Insights */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {insights.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-faint)' }}>
              No significant anomalies or correlations detected in the current filtered subset.
            </div>
          ) : (
            insights.map(item => {
              const isWarning = item.severity === 'warning';
              const isGrowth = item.type === 'growth';

              return (
                <div
                  key={item.id}
                  className="glass-panel"
                  style={{
                    padding: '14px 16px',
                    borderLeft: `4px solid ${isWarning ? '#f43f5e' : (isGrowth ? '#10b981' : '#6366f1')}`,
                    background: 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    {isWarning && <AlertTriangle size={15} color="#fb7185" />}
                    {isGrowth && <TrendingUp size={15} color="#34d399" />}
                    {!isWarning && !isGrowth && <Zap size={15} color="#818cf8" />}
                    <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>{item.title}</span>
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '10px' }}>
                    {item.text}
                  </p>

                  {/* Quick Action Button */}
                  {item.dimension && item.metric && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        onApplyInsight(item);
                        onClose();
                      }}
                      style={{ fontSize: '0.72rem', padding: '3px 8px', gap: '5px' }}
                    >
                      <span>Visualize Finding</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
