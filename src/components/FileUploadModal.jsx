import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Presentation,
  CheckCircle2,
  AlertTriangle,
  X,
  Maximize2,
  Minimize2,
  FileCode,
  ArrowRight,
  ClipboardList,
  Layers,
  ShieldCheck,
  Combine,
  Sparkles
} from 'lucide-react';
import {
  parseUploadedFile,
  cleanAndProfileDataset,
  parseWorkbookSheet,
  combineWorkbookSheets
} from '../services/fileParsers';
import Papa from 'papaparse';

export function FileUploadModal({ isOpen, onClose, onDatasetLoaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [datasetName, setDatasetName] = useState('');
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = await parseUploadedFile(file);
      setPreviewData(parsed);
      setDatasetName(parsed.name || file.name.replace(/\.[^/.]+$/, ''));
    } catch (err) {
      setError(err.message || 'Failed to process file. Please ensure it contains tabular rows.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchWorksheet = (sheetName) => {
    if (!previewData?._workbook) return;
    try {
      const sheetDataset = parseWorkbookSheet(previewData._workbook, sheetName, previewData._fileName || 'Workbook');
      setPreviewData(sheetDataset);
      setDatasetName(sheetDataset.name);
    } catch (err) {
      setError(`Failed to switch to sheet "${sheetName}": ${err.message}`);
    }
  };

  const handleUnionAllSheets = () => {
    if (!previewData?._workbook || !previewData.availableSheets) return;
    try {
      const combined = combineWorkbookSheets(previewData._workbook, previewData.availableSheets, previewData._fileName || 'Workbook');
      setPreviewData(combined);
      setDatasetName(combined.name);
    } catch (err) {
      setError(`Failed to combine worksheets: ${err.message}`);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleParsePaste = () => {
    if (!pastedText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Try JSON first
      if (pastedText.trim().startsWith('[') || pastedText.trim().startsWith('{')) {
        const json = JSON.parse(pastedText);
        const rows = Array.isArray(json) ? json : [json];
        const parsed = cleanAndProfileDataset(rows, datasetName || 'Pasted JSON Dataset');
        setPreviewData(parsed);
        setDatasetName(parsed.name);
      } else {
        // Parse CSV/TSV
        const result = Papa.parse(pastedText.trim(), {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        if (!result.data || result.data.length === 0) {
          throw new Error('No structured records found in pasted text.');
        }
        const parsed = cleanAndProfileDataset(result.data, datasetName || 'Pasted Table Data');
        setPreviewData(parsed);
        setDatasetName(parsed.name);
      }
    } catch (err) {
      setError(err.message || 'Invalid format in pasted text.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDataset = () => {
    if (!previewData) return;
    onDatasetLoaded({
      ...previewData,
      id: `custom-${Date.now()}`,
      name: datasetName || previewData.name || 'Imported Business Dataset',
      source: 'User Upload',
      category: 'Custom Ingestion'
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel"
        style={{
          width: isMaximized ? '96vw' : '850px',
          maxWidth: isMaximized ? '96vw' : '90vw',
          height: isMaximized ? '92vh' : 'auto',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UploadCloud size={24} color="#6366f1" />
              <span>Multi-Format Business Data Ingestion</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
              Upload your raw spreadsheets, slide reports, documents, or data dumps to auto-generate dashboards.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s'
              }}
              title={isMaximized ? "Restore size" : "Maximize window"}
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'var(--text-faint)',
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Format Compatibility Tags */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <span className="badge badge-emerald">
            <FileSpreadsheet size={13} /> Excel (.xlsx, .xls)
          </span>
          <span className="badge badge-indigo">
            <FileCode size={13} /> Delimited CSV / TSV
          </span>
          <span className="badge badge-rose">
            <FileText size={13} /> PDF Reports (.pdf)
          </span>
          <span className="badge badge-amber">
            <FileText size={13} /> Word Tables (.docx)
          </span>
          <span className="badge badge-indigo">
            <Presentation size={13} /> PowerPoint Tables (.pptx)
          </span>
        </div>

        {/* Tab Switcher */}
        {!previewData && (
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '18px' }}>
            <button
              onClick={() => setActiveTab('upload')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'upload' ? '2px solid #6366f1' : '2px solid transparent',
                padding: '8px 16px',
                color: activeTab === 'upload' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'paste' ? '2px solid #6366f1' : '2px solid transparent',
                padding: '8px 16px',
                color: activeTab === 'paste' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ClipboardList size={14} /> Paste Text / TSV / JSON
            </button>
          </div>
        )}

        {/* Upload Drop Zone */}
        {!previewData && activeTab === 'upload' && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? '#6366f1' : 'var(--border-subtle)'}`,
              borderRadius: '14px',
              padding: '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragging ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.01)',
              transition: 'all 0.2s ease',
              marginBottom: '20px'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.xlsx,.xls,.xlsm,.xlsb,.docx,.pptx,.pdf,.tsv,.txt"
              style={{ display: 'none' }}
            />
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6366f1'
            }}>
              <UploadCloud size={32} />
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>
              Drag and drop your business file here, or <span style={{ color: '#6366f1' }}>browse files</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Automatic schema inference, numeric metric detection, and date sorting
            </div>
          </div>
        )}

        {/* Paste Raw Tab */}
        {!previewData && activeTab === 'paste' && (
          <div style={{ marginBottom: '20px' }}>
            <textarea
              className="form-input"
              rows={8}
              placeholder="Paste raw CSV, TSV (e.g. copied from Excel/Google Sheets), or JSON array here..."
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleParsePaste}
                disabled={!pastedText.trim()}
              >
                Parse Copied Data
              </button>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <div className="animate-pulse-slow" style={{ fontSize: '0.95rem', color: '#818cf8', fontWeight: 600 }}>
              Parsing document structure, extracting tables & inferring metrics...
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '10px',
            padding: '14px',
            color: '#fb7185',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
            fontSize: '0.85rem'
          }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Parsed Preview Section */}
        {previewData && (
          <div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="#10b981" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Successfully Ingested & Analyzed</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong>{previewData.rowCount}</strong> rows · <strong>{previewData.columns.length}</strong> columns
                </div>
              </div>

              {/* Dataset Name Input */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  Dataset Title:
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={datasetName}
                  onChange={e => setDatasetName(e.target.value)}
                  placeholder="Enter a descriptive report title..."
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* Multi-Worksheet Selector (when workbook contains > 1 sheet) */}
            {previewData.availableSheets && previewData.availableSheets.length > 1 && (
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={16} color="#818cf8" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      Worksheets Detected ({previewData.availableSheets.length} Sheets)
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Click any sheet to preview or union all
                    </span>
                  </div>

                  {/* Union / Combine All Sheets Button */}
                  <button
                    className={`btn btn-sm ${previewData.selectedSheet === 'All Combined' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={handleUnionAllSheets}
                    title="Combine rows from all worksheets into one unified dataset with a _SheetName column"
                    style={{ gap: '6px', fontSize: '0.74rem', padding: '4px 10px' }}
                  >
                    <Combine size={14} />
                    <span>Union All Sheets</span>
                  </button>
                </div>

                {/* Sheet Tabs */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {previewData.availableSheets.map(sName => {
                    const isSelected = previewData.selectedSheet === sName;
                    const meta = previewData.allSheetsMeta?.find(m => m.name === sName);
                    return (
                      <button
                        key={sName}
                        onClick={() => handleSwitchWorksheet(sName)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: isSelected ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'rgba(255, 255, 255, 0.05)',
                          color: isSelected ? '#ffffff' : 'var(--text-main)',
                          border: isSelected ? '1px solid #4f46e5' : '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: isSelected ? 700 : 500,
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <FileSpreadsheet size={14} color={isSelected ? '#ffffff' : '#818cf8'} />
                        <span>{sName}</span>
                        {meta && (
                          <span style={{
                            fontSize: '0.66rem',
                            padding: '1px 5px',
                            borderRadius: '999px',
                            background: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(99, 102, 241, 0.15)',
                            color: isSelected ? '#ffffff' : '#818cf8'
                          }}>
                            ~{meta.estimatedRows} rows
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clean Data Engine Audit Badges */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              padding: '8px 12px',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.74rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: '#10b981' }}>
                <ShieldCheck size={14} />
                <span>Clean Data Engine:</span>
              </div>
              <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                ✓ Macros & formulas safely bypassed
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                ✓ Currency & symbols normalized
              </span>
              {previewData.cleaningAudit?.cleanedNegativesCount > 0 && (
                <span className="badge badge-indigo" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                  ✓ {previewData.cleaningAudit.cleanedNegativesCount} accounting negatives parsed
                </span>
              )}
              {previewData.cleaningAudit?.skippedBannerRows > 0 && (
                <span className="badge badge-indigo" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                  ✓ {previewData.cleaningAudit.skippedBannerRows} banner title rows auto-aligned
                </span>
              )}
              {previewData.cleaningAudit?.sanitizedErrorsCount > 0 && (
                <span className="badge badge-amber" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                  ✓ {previewData.cleaningAudit.sanitizedErrorsCount} formula errors sanitized
                </span>
              )}
              {previewData.cleaningAudit?.excludedSummaryRowsCount > 0 && (
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                  ✓ Summary totals isolated from double-counting
                </span>
              )}
            </div>

            {/* Inferred Column Profiles */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Understood Schema & Detected Column Types:
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '100px', overflowY: 'auto' }}>
                {previewData.columnProfiles.map(col => (
                  <span
                    key={col.name}
                    className={`badge ${col.type === 'measure' ? 'badge-emerald' : (col.type === 'date' ? 'badge-amber' : 'badge-indigo')}`}
                    style={{ fontSize: '0.72rem' }}
                  >
                    <strong>{col.name}</strong> ({col.type})
                  </span>
                ))}
              </div>
            </div>

            {/* First 4 Rows Table Preview */}
            <div style={{
              overflowX: 'auto',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                    {previewData.columns.slice(0, 6).map(c => (
                      <th key={c} style={{ padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>{c}</th>
                    ))}
                    {previewData.columns.length > 6 && (
                      <th style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>+{previewData.columns.length - 6} more</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {previewData.data.slice(0, 4).map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {previewData.columns.slice(0, 6).map(c => (
                        <td key={c} style={{ padding: '8px 12px', fontFamily: typeof row[c] === 'number' ? 'var(--font-mono)' : 'inherit' }}>
                          {row[c] !== null && row[c] !== undefined ? String(row[c]) : '-'}
                        </td>
                      ))}
                      {previewData.columns.length > 6 && <td style={{ padding: '8px 12px', color: 'var(--text-faint)' }}>...</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPreviewData(null)}
              >
                Upload Different File
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmDataset}
                style={{ gap: '8px' }}
              >
                <span>Launch Dashboard with this Data</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
