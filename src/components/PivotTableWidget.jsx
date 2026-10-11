import React, { useState } from 'react';
import { computePivotMatrix } from '../services/calculationEngine';
import { Table, ArrowUpDown } from 'lucide-react';

export function PivotTableWidget({ data, rowDim, colDim, valMeasure, agg = 'SUM' }) {
  const [currentAgg, setCurrentAgg] = useState(agg);
  const matrixData = computePivotMatrix(data, rowDim, colDim, valMeasure, currentAgg);

  const { rowHeaders, colHeaders, matrix, rowTotals, colTotals, grandTotal } = matrixData;

  if (rowHeaders.length === 0 || colHeaders.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)' }}>
        Configure Row Dimension, Column Dimension, and Value Measure to render Pivot Matrix.
      </div>
    );
  }

  // Find max cell value for heatmap intensity via safe iteration (avoids RangeError: Maximum call stack size exceeded)
  let maxVal = 1;
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    for (let c = 0; c < row.length; c++) {
      const v = row[c];
      if (typeof v === 'number' && !isNaN(v) && v > maxVal) {
        maxVal = v;
      }
    }
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header / Aggregation Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          Matrix: <strong>{rowDim}</strong> (rows) × <strong>{colDim}</strong> (columns)
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['SUM', 'AVG'].map(a => (
            <button
              key={a}
              onClick={() => setCurrentAgg(a)}
              className="btn btn-secondary btn-sm"
              style={{
                padding: '2px 8px',
                fontSize: '0.7rem',
                background: currentAgg === a ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                borderColor: currentAgg === a ? '#6366f1' : 'var(--border-subtle)'
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderRadius: '8px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-faint)', fontWeight: 700 }}>
                {rowDim} \ {colDim}
              </th>
              {colHeaders.map(ch => (
                <th key={ch} style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {ch}
                </th>
              ))}
              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#818cf8', fontWeight: 700, background: 'rgba(99, 102, 241, 0.05)' }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rowHeaders.map((rh, rIdx) => (
              <tr key={rh} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '7px 12px', fontWeight: 600, color: 'var(--text-main)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  {rh}
                </td>
                {colHeaders.map((ch, cIdx) => {
                  const val = matrix[rIdx][cIdx];
                  const intensity = Math.min((val / maxVal) * 0.45, 0.45);
                  return (
                    <td
                      key={ch}
                      style={{
                        padding: '7px 12px',
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        background: val > 0 ? `rgba(99, 102, 241, ${intensity})` : 'transparent'
                      }}
                    >
                      {val > 0 ? formatNumber(val) : '-'}
                    </td>
                  );
                })}
                <td style={{
                  padding: '7px 12px',
                  textAlign: 'right',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  background: 'rgba(99, 102, 241, 0.05)'
                }}>
                  {formatNumber(rowTotals[rIdx])}
                </td>
              </tr>
            ))}
            {/* Grand Totals Row */}
            <tr style={{ background: 'rgba(255, 255, 255, 0.05)', fontWeight: 700, borderTop: '2px solid var(--border-subtle)' }}>
              <td style={{ padding: '8px 12px', color: '#818cf8' }}>
                Summary Total
              </td>
              {colTotals.map((ct, idx) => (
                <td key={idx} style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {formatNumber(ct)}
                </td>
              ))}
              <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)' }}>
                {formatNumber(grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatNumber(val) {
  if (typeof val !== 'number') return String(val);
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toLocaleString();
}
