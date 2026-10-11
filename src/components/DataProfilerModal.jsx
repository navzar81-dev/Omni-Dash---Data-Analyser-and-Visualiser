import React from 'react';
import { Layers, X, AlertTriangle, CheckCircle2, Hash, Calendar, Type } from 'lucide-react';
import { calculateColumnStats } from '../services/calculationEngine';

export function DataProfilerModal({
  isOpen,
  onClose,
  data,
  columns,
  columnProfiles,
  datasetName
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel"
        style={{ width: '900px', padding: '28px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={22} color="#60a5fa" />
              <span>Data Profiler & Schema Intelligence</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
              Structural health, data distribution, and statistical profiling for: <strong>{datasetName}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Dataset Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div className="glass-panel" style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Records</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{data.length}</div>
          </div>
          <div className="glass-panel" style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Columns</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{columns.length}</div>
          </div>
          <div className="glass-panel" style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Numeric Measures</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
              {columnProfiles.filter(c => c.type === 'measure').length}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dimensions & Dates</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#818cf8' }}>
              {columnProfiles.filter(c => c.type !== 'measure').length}
            </div>
          </div>
        </div>

        {/* Detailed Column Profiling Table */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Column Name</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Semantic Type</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-muted)', textAlign: 'right' }}>Distinct Values</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-muted)', textAlign: 'right' }}>Mean / Summary</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-muted)', textAlign: 'right' }}>Min - Max Range</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-muted)', textAlign: 'right' }}>StdDev</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-muted)', textAlign: 'center' }}>Outliers</th>
              </tr>
            </thead>
            <tbody>
              {columnProfiles.map(col => {
                const stats = col.type === 'measure' ? calculateColumnStats(data, col.name) : null;

                return (
                  <tr key={col.name} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px 14px', fontWeight: 600 }}>
                      {col.name}
                    </td>
                    <td style={{ padding: '8px 14px' }}>
                      <span className={`badge ${col.type === 'measure' ? 'badge-emerald' : (col.type === 'date' ? 'badge-amber' : 'badge-indigo')}`}>
                        {col.type === 'measure' && <Hash size={11} />}
                        {col.type === 'date' && <Calendar size={11} />}
                        {col.type === 'dimension' && <Type size={11} />}
                        <span>{col.type}</span>
                      </span>
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {col.distinctCount}
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {stats ? stats.mean.toLocaleString() : '-'}
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {stats ? `${stats.min} ... ${stats.max}` : '-'}
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {stats ? stats.stdDev : '-'}
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                      {stats && stats.outlierCount > 0 ? (
                        <span className="badge badge-rose" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                          <AlertTriangle size={11} /> {stats.outlierCount}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
