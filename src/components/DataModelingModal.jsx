import React, { useState, useMemo } from 'react';
import {
  GitMerge,
  Layers,
  FolderPlus,
  ArrowRight,
  Database,
  X,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Sliders,
  Table,
  Plus,
  Trash2,
  Sparkles,
  Info
} from 'lucide-react';
import {
  performTableJoin,
  createNumericBins,
  createCategoricalGroups,
  generateAutoIntervalBins
} from '../services/dataModelingService';
import { SAMPLE_DATASETS } from '../services/sampleDatasets';
import { parseUploadedFile } from '../services/fileParsers';

export function DataModelingModal({
  isOpen,
  onClose,
  activeDataset,
  onApplyMergedDataset,
  onApplyGroupedColumn
}) {
  const [activeTab, setActiveTab] = useState('join'); // 'join' | 'bucket'
  const [isMaximized, setIsMaximized] = useState(false);

  // -------------------------------------------------------------
  // TAB 1: Multi-Table Joins State
  // -------------------------------------------------------------
  const [secondarySourceType, setSecondarySourceType] = useState('sample'); // 'sample' | 'upload'
  const [selectedSampleKey, setSelectedSampleKey] = useState('saas');
  const [uploadedSecondary, setUploadedSecondary] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const [keyA, setKeyA] = useState('');
  const [keyB, setKeyB] = useState('');
  const [joinType, setJoinType] = useState('LEFT');
  const [prefixB, setPrefixB] = useState('B_');
  const [mergedResult, setMergedResult] = useState(null);
  const [joinError, setJoinError] = useState(null);

  // Table A (Primary active dataset)
  const tableA = activeDataset?.data || [];
  const colsA = activeDataset?.columns || (tableA[0] ? Object.keys(tableA[0]) : []);

  // Table B (Secondary dataset)
  const tableB = useMemo(() => {
    if (secondarySourceType === 'upload' && uploadedSecondary) {
      return uploadedSecondary.data || [];
    }
    const sample = SAMPLE_DATASETS[selectedSampleKey];
    return sample?.data || [];
  }, [secondarySourceType, selectedSampleKey, uploadedSecondary]);

  const colsB = useMemo(() => {
    if (tableB && tableB.length > 0) {
      return Object.keys(tableB[0]);
    }
    return [];
  }, [tableB]);

  // Set default keys when cols change
  React.useEffect(() => {
    if (colsA.length > 0 && !keyA) {
      const match = colsA.find(c => /id|key|code|date|region|quarter/i.test(c)) || colsA[0];
      setKeyA(match);
    }
  }, [colsA, keyA]);

  React.useEffect(() => {
    if (colsB.length > 0) {
      const match = colsB.find(c => c.toLowerCase() === (keyA || '').toLowerCase()) ||
        colsB.find(c => /id|key|code|date|region|quarter/i.test(c)) || colsB[0];
      setKeyB(match);
    }
  }, [colsB, keyA]);

  const handleFileUploadSecondary = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadLoading(true);
      setUploadError(null);
      try {
        const parsed = await parseUploadedFile(e.target.files[0]);
        setUploadedSecondary(parsed);
      } catch (err) {
        setUploadError(err.message || 'Failed to parse file.');
      } finally {
        setUploadLoading(false);
      }
    }
  };

  const handleSimulateJoin = () => {
    setJoinError(null);
    try {
      const res = performTableJoin({
        tableA,
        tableB,
        keyA,
        keyB,
        joinType,
        prefixB
      });
      setMergedResult(res);
    } catch (err) {
      setJoinError(err.message);
      setMergedResult(null);
    }
  };

  const handleConfirmJoin = () => {
    if (!mergedResult || !mergedResult.data || mergedResult.data.length === 0) return;
    const secondaryName = secondarySourceType === 'upload' && uploadedSecondary
      ? uploadedSecondary.name
      : SAMPLE_DATASETS[selectedSampleKey]?.name || 'Secondary';

    onApplyMergedDataset({
      data: mergedResult.data,
      name: `${activeDataset?.name || 'Dataset'} + ${secondaryName} (${joinType} JOIN)`,
      joinStats: mergedResult.stats
    });
    onClose();
  };

  // -------------------------------------------------------------
  // TAB 2: Custom Bucket / Bin Grouping State
  // -------------------------------------------------------------
  const [bucketTargetCol, setBucketTargetCol] = useState(colsA[0] || '');
  const [bucketType, setBucketType] = useState('numeric'); // 'numeric' | 'categorical'
  const [newBucketColName, setNewBucketColName] = useState('');
  const [numericBins, setNumericBins] = useState([]);
  const [categoricalGroups, setCategoricalGroups] = useState({});
  const [defaultCategoryGroup, setDefaultCategoryGroup] = useState('Other');

  // Detect whether selected target column is measure or dimension
  React.useEffect(() => {
    if (!bucketTargetCol || !tableA[0]) return;
    const sampleVal = tableA.find(r => r[bucketTargetCol] !== null && r[bucketTargetCol] !== undefined)?.[bucketTargetCol];
    const isNum = typeof sampleVal === 'number' || (!isNaN(Number(sampleVal)) && sampleVal !== '');
    setBucketType(isNum ? 'numeric' : 'categorical');
    setNewBucketColName(`${bucketTargetCol}_Grouped`);

    if (isNum) {
      const autoBins = generateAutoIntervalBins(tableA, bucketTargetCol, 4);
      setNumericBins(autoBins);
    } else {
      // Initialize categorical values
      const distinct = Array.from(new Set(tableA.map(r => r[bucketTargetCol]).filter(Boolean))).slice(0, 50);
      const initialMap = {};
      distinct.forEach(v => {
        initialMap[String(v)] = String(v);
      });
      setCategoricalGroups(initialMap);
    }
  }, [bucketTargetCol, tableA]);

  const handleAddNumericBin = () => {
    const last = numericBins[numericBins.length - 1];
    const nextMin = last ? last.max : 0;
    const nextMax = last ? last.max * 2 : 1000;
    setNumericBins([...numericBins, { label: `Bracket ${numericBins.length + 1}`, min: nextMin, max: nextMax }]);
  };

  const handleUpdateNumericBin = (idx, field, val) => {
    const next = [...numericBins];
    next[idx] = { ...next[idx], [field]: field === 'label' ? val : Number(val) };
    setNumericBins(next);
  };

  const handleRemoveNumericBin = (idx) => {
    setNumericBins(numericBins.filter((_, i) => i !== idx));
  };

  const handleAutoQuantiles = (count) => {
    const auto = generateAutoIntervalBins(tableA, bucketTargetCol, count);
    setNumericBins(auto);
  };

  const handleApplyBucketGroup = () => {
    if (!newBucketColName.trim()) return;

    let updatedData = [];
    if (bucketType === 'numeric') {
      updatedData = createNumericBins(tableA, bucketTargetCol, numericBins, newBucketColName.trim());
    } else {
      updatedData = createCategoricalGroups(tableA, bucketTargetCol, categoricalGroups, defaultCategoryGroup, newBucketColName.trim());
    }

    onApplyGroupedColumn(newBucketColName.trim(), updatedData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel"
        style={{
          width: isMaximized ? '96vw' : '920px',
          maxWidth: isMaximized ? '96vw' : '92vw',
          height: isMaximized ? '94vh' : 'auto',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          transition: 'all 0.25s ease'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                padding: '6px',
                borderRadius: '8px',
                color: '#fff',
                display: 'flex'
              }}>
                <GitMerge size={20} />
              </span>
              <h2 style={{ fontSize: '1.28rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Data Modeling & Transformation Studio
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
              Perform multi-table relational joins, enrich datasets, and create custom category buckets or numeric brackets.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px 8px'
              }}
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
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
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '20px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'join' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('join')}
            style={{ gap: '6px' }}
          >
            <GitMerge size={15} />
            <span>Multi-Table Joins & Merges</span>
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'bucket' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('bucket')}
            style={{ gap: '6px' }}
          >
            <Layers size={15} />
            <span>Custom Bins & Grouping Buckets</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {activeTab === 'join' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Tables Configuration Card */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: '12px', alignItems: 'center' }}>
                {/* Table A (Primary) */}
                <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <Database size={16} color="#6366f1" />
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Table A (Primary Active)</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    {activeDataset?.name || 'Current Dataset'} ({tableA.length.toLocaleString()} rows, {colsA.length} cols)
                  </div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Matching Key A:
                  </label>
                  <select
                    className="form-select"
                    value={keyA}
                    onChange={e => setKeyA(e.target.value)}
                    style={{ width: '100%', height: '34px', fontSize: '0.82rem' }}
                  >
                    {colsA.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Join Operator Badge */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.3)'
                  }}>
                    <ArrowRight size={18} />
                  </div>
                </div>

                {/* Table B (Secondary) */}
                <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Database size={16} color="#06b6d4" />
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Table B (Secondary)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        className={`btn btn-xs ${secondarySourceType === 'sample' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setSecondarySourceType('sample')}
                      >
                        Sample
                      </button>
                      <button
                        type="button"
                        className={`btn btn-xs ${secondarySourceType === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setSecondarySourceType('upload')}
                      >
                        Upload
                      </button>
                    </div>
                  </div>

                  {secondarySourceType === 'sample' ? (
                    <div style={{ marginBottom: '10px' }}>
                      <select
                        className="form-select"
                        value={selectedSampleKey}
                        onChange={e => setSelectedSampleKey(e.target.value)}
                        style={{ width: '100%', height: '32px', fontSize: '0.8rem', marginBottom: '6px' }}
                      >
                        {Object.entries(SAMPLE_DATASETS).map(([k, s]) => (
                          <option key={k} value={k}>{s.name} ({s.data.length} rows)</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '10px' }}>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls,.xlsm,.xlsb,.tsv"
                        onChange={handleFileUploadSecondary}
                        style={{ fontSize: '0.74rem', width: '100%' }}
                      />
                      {uploadLoading && <div style={{ fontSize: '0.74rem', color: '#818cf8' }}>Reading file...</div>}
                      {uploadError && <div style={{ fontSize: '0.74rem', color: '#f43f5e' }}>{uploadError}</div>}
                      {uploadedSecondary && (
                        <div style={{ fontSize: '0.74rem', color: '#10b981', marginTop: '4px' }}>
                          ✓ Loaded {uploadedSecondary.name} ({uploadedSecondary.data.length} rows)
                        </div>
                      )}
                    </div>
                  )}

                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Matching Key B:
                  </label>
                  <select
                    className="form-select"
                    value={keyB}
                    onChange={e => setKeyB(e.target.value)}
                    style={{ width: '100%', height: '34px', fontSize: '0.82rem' }}
                  >
                    {colsB.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Join Strategy & Parameters */}
              <div className="glass-panel" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Join Algorithm
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[
                        { id: 'LEFT', label: 'LEFT JOIN', desc: 'Keep all Table A rows' },
                        { id: 'INNER', label: 'INNER JOIN', desc: 'Matched keys only' },
                        { id: 'FULL', label: 'FULL OUTER', desc: 'Keep all from both' },
                        { id: 'CROSS', label: 'CROSS JOIN', desc: 'Cartesian product' }
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          className={`btn btn-sm ${joinType === t.id ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setJoinType(t.id)}
                          title={t.desc}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Column Collision Prefix:
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={prefixB}
                      onChange={e => setPrefixB(e.target.value)}
                      style={{ width: '110px', height: '34px', fontSize: '0.82rem' }}
                      placeholder="B_"
                    />
                  </div>

                  <div style={{ alignSelf: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleSimulateJoin}
                      style={{ gap: '6px', height: '36px' }}
                    >
                      <Sparkles size={16} color="#818cf8" />
                      <span>Preview Join Result</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Join Result & Preview */}
              {joinError && (
                <div style={{ padding: '12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', color: '#f43f5e', fontSize: '0.85rem' }}>
                  {joinError}
                </div>
              )}

              {mergedResult && (
                <div className="glass-panel" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#10b981" />
                      <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                        Merge Simulation Success ({mergedResult.stats.totalRows.toLocaleString()} Result Rows)
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className="badge badge-indigo">
                        Matched: {mergedResult.stats.matchedRows}
                      </span>
                      <span className="badge badge-amber">
                        Unmatched A: {mergedResult.stats.unmatchedA}
                      </span>
                      {mergedResult.stats.unmatchedB > 0 && (
                        <span className="badge badge-rose">
                          Unmatched B: {mergedResult.stats.unmatchedB}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sample rows preview table */}
                  <div style={{ overflowX: 'auto', maxHeight: '180px', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                          {Object.keys(mergedResult.data[0] || {}).slice(0, 8).map(col => (
                            <th key={col} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mergedResult.data.slice(0, 5).map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                            {Object.keys(mergedResult.data[0] || {}).slice(0, 8).map(col => (
                              <td key={col} style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>
                                {String(row[col] ?? '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleConfirmJoin}
                      style={{ gap: '6px' }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Apply Merged Dataset to Dashboard</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bucket' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Target Column Selector */}
              <div className="glass-panel" style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Select Column to Group / Bucket:
                    </label>
                    <select
                      className="form-select"
                      value={bucketTargetCol}
                      onChange={e => setBucketTargetCol(e.target.value)}
                      style={{ width: '100%', height: '36px', fontSize: '0.84rem' }}
                    >
                      {colsA.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      New Output Column Name:
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={newBucketColName}
                      onChange={e => setNewBucketColName(e.target.value)}
                      style={{ width: '100%', height: '36px', fontSize: '0.84rem' }}
                      placeholder="e.g. Revenue_Tier"
                    />
                  </div>
                </div>
              </div>

              {/* Numeric Binning Mode */}
              {bucketType === 'numeric' && (
                <div className="glass-panel" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Continuous Numeric Brackets</h4>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Segment continuous values into discrete groups (e.g., Small, Medium, High).
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => handleAutoQuantiles(3)}
                      >
                        3 Tertiles
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => handleAutoQuantiles(4)}
                      >
                        4 Quartiles
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={handleAddNumericBin}
                        style={{ gap: '4px' }}
                      >
                        <Plus size={13} />
                        Add Bracket
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {numericBins.map((bin, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1.2fr 1.2fr 40px',
                          gap: '10px',
                          alignItems: 'center',
                          background: 'rgba(255, 255, 255, 0.02)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <input
                          type="text"
                          className="form-input"
                          value={bin.label}
                          onChange={e => handleUpdateNumericBin(idx, 'label', e.target.value)}
                          placeholder="Bracket Label"
                          style={{ height: '32px', fontSize: '0.8rem' }}
                        />
                        <input
                          type="number"
                          className="form-input"
                          value={bin.min}
                          onChange={e => handleUpdateNumericBin(idx, 'min', e.target.value)}
                          placeholder="Min"
                          style={{ height: '32px', fontSize: '0.8rem' }}
                        />
                        <input
                          type="number"
                          className="form-input"
                          value={bin.max}
                          onChange={e => handleUpdateNumericBin(idx, 'max', e.target.value)}
                          placeholder="Max"
                          style={{ height: '32px', fontSize: '0.8rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNumericBin(idx)}
                          style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                          title="Delete bracket"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorical Grouping Mode */}
              {bucketType === 'categorical' && (
                <div className="glass-panel" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Categorical Value Mapping</h4>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Map distinct values into high-level categories (e.g., combine country codes into regions).
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Default Fallback:</span>
                      <input
                        type="text"
                        className="form-input"
                        value={defaultCategoryGroup}
                        onChange={e => setDefaultCategoryGroup(e.target.value)}
                        style={{ width: '100px', height: '28px', fontSize: '0.75rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Object.keys(categoricalGroups).map(val => (
                      <div
                        key={val}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 30px 1fr',
                          gap: '8px',
                          alignItems: 'center',
                          padding: '4px 8px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '6px'
                        }}
                      >
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {val}
                        </span>
                        <ArrowRight size={14} color="var(--text-faint)" />
                        <input
                          type="text"
                          className="form-input"
                          value={categoricalGroups[val] || ''}
                          onChange={e => setCategoricalGroups({ ...categoricalGroups, [val]: e.target.value })}
                          style={{ height: '30px', fontSize: '0.78rem' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApplyBucketGroup}
                  style={{ gap: '6px' }}
                >
                  <Plus size={16} />
                  <span>Generate & Add Grouped Column</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
