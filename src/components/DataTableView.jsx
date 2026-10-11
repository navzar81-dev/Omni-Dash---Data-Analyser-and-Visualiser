import React, { useState } from 'react';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Download, Eye, FileSpreadsheet } from 'lucide-react';
import { exportToExcel, exportToCsv } from '../services/exportService';

export function DataTableView({ data, columns, columnProfiles, datasetName }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Search filter
  const filtered = data.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(v => 
      v !== null && v !== undefined && String(v).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (!sortCol) return 0;
    const aVal = a[sortCol];
    const bVal = b[sortCol];
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const currentRows = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  return (
    <div className="glass-panel data-table-container" style={{ margin: '0 20px 24px 20px', padding: '20px' }}>
      {/* Table Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Data Explorer & Tabular Grid</h3>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Showing {sorted.length} of {data.length} records in {datasetName}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} color="var(--text-faint)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search data grid..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              style={{ paddingLeft: '30px', height: '34px', fontSize: '0.8rem' }}
            />
          </div>

          {/* Export Buttons */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => exportToExcel(sorted, datasetName)}
            style={{ gap: '6px' }}
          >
            <FileSpreadsheet size={14} color="#10b981" />
            <span>Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '10px', marginBottom: '14px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
              {columns.map(c => {
                const isMeasure = columnProfiles.find(p => p.name === c)?.type === 'measure';
                return (
                  <th
                    key={c}
                    onClick={() => handleSort(c)}
                    style={{
                      padding: '10px 14px',
                      color: sortCol === c ? '#818cf8' : 'var(--text-muted)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                      textAlign: isMeasure ? 'right' : 'left'
                    }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>{c}</span>
                      <ArrowUpDown size={11} style={{ opacity: sortCol === c ? 1 : 0.4 }} />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {columns.map(c => {
                  const val = row[c];
                  const isNum = typeof val === 'number';
                  return (
                    <td
                      key={c}
                      style={{
                        padding: '8px 14px',
                        textAlign: isNum ? 'right' : 'left',
                        fontFamily: isNum ? 'var(--font-mono)' : 'inherit',
                        color: val === null || val === undefined ? 'var(--text-faint)' : 'var(--text-main)'
                      }}
                    >
                      {formatTableCell(val, c)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <div>
          Page {page} of {totalPages}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            className="form-select"
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            style={{ width: '100px', height: '30px', fontSize: '0.74rem', padding: '2px 8px' }}
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '4px 8px' }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '4px 8px' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTableCell(val, colName = '') {
  if (val === null || val === undefined) return '-';
  if (typeof val !== 'number') return String(val);

  const isPercent = /pct|percent|rate|margin/i.test(colName);
  const isCurrency = /revenue|cost|cogs|income|ebitda|mrr|arr|spend|profit|price/i.test(colName);

  if (isPercent) return `${val.toFixed(1)}%`;
  if (isCurrency) return `$${val.toLocaleString()}`;
  return val.toLocaleString();
}
