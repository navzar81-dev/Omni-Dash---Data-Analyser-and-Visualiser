import React from 'react';
import { Filter, X, RotateCcw, Search, SlidersHorizontal, Sparkles } from 'lucide-react';

export function GlobalFilterBar({
  columns,
  columnProfiles,
  data,
  filteredData,
  activeFilters,
  onFilterChange,
  onResetFilters,
  searchTerm,
  onSearchChange,
  activeCompoundRules = [],
  activeLogicOperator = 'AND',
  onOpenAdvancedFilter,
  onClearCompoundRules
}) {
  const dimensions = columnProfiles.filter(c => c.type === 'dimension').slice(0, 4);
  const hasCompoundRules = activeCompoundRules.length > 0;

  return (
    <div className="glass-panel global-filter-bar" style={{
      margin: '0 20px 18px 20px',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
          <Filter size={15} color="#818cf8" />
          <span>Filters:</span>
        </div>

        {/* Global Search Filter */}
        <div className="global-filter-search-box" style={{ position: 'relative', width: '200px' }}>
          <Search size={14} color="var(--text-faint)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Quick search..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            style={{ paddingLeft: '30px', height: '34px', fontSize: '0.8rem' }}
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              style={{ position: 'absolute', right: '8px', top: '9px', background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dynamic Dimension Dropdowns */}
        {dimensions.map(dim => {
          const distinctValues = Array.from(new Set(data.map(r => r[dim.name]).filter(Boolean))).sort();
          if (distinctValues.length <= 1) return null;

          return (
            <div key={dim.name} style={{ display: 'flex', alignItems: 'center' }}>
              <select
                className="form-select"
                style={{ height: '34px', fontSize: '0.8rem', minWidth: '120px', padding: '4px 10px' }}
                value={activeFilters[dim.name] || 'ALL'}
                onChange={e => onFilterChange(dim.name, e.target.value === 'ALL' ? null : e.target.value)}
              >
                <option value="ALL">All {dim.name}s</option>
                {distinctValues.map(val => (
                  <option key={String(val)} value={String(val)}>
                    {String(val)}
                  </option>
                ))}
              </select>
            </div>
          );
        })}

        {/* Advanced SQL / Compound Filter Trigger Button */}
        <button
          className={`btn btn-sm ${hasCompoundRules ? 'btn-primary' : 'btn-secondary'}`}
          onClick={onOpenAdvancedFilter}
          style={{ height: '34px', gap: '6px' }}
          title="Open advanced multi-condition filter builder"
        >
          <SlidersHorizontal size={14} />
          <span>Advanced SQL Filter</span>
          {hasCompoundRules && (
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                borderRadius: '10px',
                padding: '0 6px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}
            >
              {activeCompoundRules.length} ({activeLogicOperator})
            </span>
          )}
        </button>

        {/* Active Compound Badge with remove */}
        {hasCompoundRules && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '0.75rem',
              color: '#a5b4fc'
            }}
          >
            <span>{activeCompoundRules.length} Custom Rule{activeCompoundRules.length > 1 ? 's' : ''} Active</span>
            <button
              onClick={onClearCompoundRules}
              style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Remove compound rules"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Reset All Filters Button */}
        {(Object.keys(activeFilters).some(k => activeFilters[k]) || searchTerm || hasCompoundRules) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onResetFilters}
            style={{ height: '34px', gap: '5px' }}
            title="Clear all active filters"
          >
            <RotateCcw size={13} />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* Record Counter Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <span>Active Scope:</span>
        <span className="badge badge-indigo" style={{ fontFamily: 'var(--font-mono)' }}>
          {filteredData.length.toLocaleString()} of {data.length.toLocaleString()} records ({data.length > 0 ? Math.round((filteredData.length / data.length) * 100) : 0}%)
        </span>
      </div>
    </div>
  );
}
