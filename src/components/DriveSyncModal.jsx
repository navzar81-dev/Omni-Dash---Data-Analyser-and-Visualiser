import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  FolderSync,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Presentation,
  Archive,
  RefreshCw,
  FolderOpen,
  Download,
  Upload,
  X,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Database,
  Layers
} from 'lucide-react';
import {
  isFileSystemAccessSupported,
  connectDriveDirectory,
  listDriveFiles,
  readDriveFile,
  saveWorkspaceToDrive,
  downloadWorkspacePackage,
  parseWorkspacePackage,
  getAutoSyncPreference,
  setAutoSyncPreference,
  clearStoredDirectoryHandle,
  writeDriveFile
} from '../services/driveSyncService';
import { parseUploadedFile } from '../services/fileParsers';
import { exportPresentationToPptx } from '../services/exportService';
import * as XLSX from 'xlsx';

export function DriveSyncModal({
  isOpen,
  onClose,
  dirHandle,
  folderName,
  onConnectFolder,
  onDisconnectFolder,
  appState,
  onRestoreWorkspace,
  onLoadDatasetFile,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'backup' | 'restore'
  const [driveFiles, setDriveFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(() => getAutoSyncPreference());
  const [pendingRestoreData, setPendingRestoreData] = useState(null);
  const restoreFileInputRef = useRef(null);

  // Scan drive files when connected and tab changes to browse
  useEffect(() => {
    if (isOpen && dirHandle) {
      refreshFiles();
    }
  }, [isOpen, dirHandle]);

  if (!isOpen) return null;

  const refreshFiles = async () => {
    if (!dirHandle) return;
    setLoadingFiles(true);
    try {
      const files = await listDriveFiles(dirHandle);
      setDriveFiles(files);
    } catch (err) {
      console.warn('Failed to list drive files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleConnect = async () => {
    try {
      setActionLoading(true);
      const res = await connectDriveDirectory();
      onConnectFolder(res.dirHandle, res.folderName);
      showToast(`Connected to Drive folder: "${res.folderName}"`, 'success');
      setActiveTab('browse');
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast(err.message || 'Failed to connect drive folder', 'error');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await clearStoredDirectoryHandle();
    onDisconnectFolder();
    setDriveFiles([]);
    showToast('Drive folder disconnected', 'info');
  };

  const handleToggleAutoSync = (e) => {
    const val = e.target.checked;
    setAutoSync(val);
    setAutoSyncPreference(val);
    showToast(val ? 'Auto-backup to Drive enabled' : 'Auto-backup disabled', 'info');
  };

  // 1-Click Load file from connected Drive folder
  const handleLoadFileFromDrive = async (fileItem) => {
    try {
      setActionLoading(true);
      const file = await readDriveFile(fileItem.handle);
      
      if (fileItem.type === 'omnidash') {
        const text = await file.text();
        const pkg = parseWorkspacePackage(text);
        onRestoreWorkspace(pkg);
        showToast(`Workspace restored from "${fileItem.name}"`, 'success');
        onClose();
        return;
      }

      // Tabular data parsing
      const parsed = await parseUploadedFile(file);
      onLoadDatasetFile(parsed);
      showToast(`Dataset loaded from Drive: "${fileItem.name}"`, 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to read file from Drive', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Save full workspace snapshot to Drive
  const handleSaveWorkspaceSnapshot = async () => {
    if (!dirHandle) {
      // Fallback: download directly
      downloadWorkspacePackage(appState);
      showToast('Workspace backup downloaded to PC (.omnidash)', 'success');
      return;
    }

    try {
      setActionLoading(true);
      const fileName = await saveWorkspaceToDrive(dirHandle, appState);
      showToast(`Workspace saved to Drive: ${fileName}`, 'success');
      refreshFiles();
    } catch (err) {
      showToast(err.message || 'Failed to save workspace to Drive', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Filtered Excel to Drive
  const handleSaveExcelToDrive = async () => {
    if (!appState.rawData || appState.rawData.length === 0) {
      showToast('No active data to export.', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      const worksheet = XLSX.utils.json_to_sheet(appState.rawData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const dsName = (appState.datasetMeta?.name || 'Dataset').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${dsName}_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;

      if (dirHandle) {
        await writeDriveFile(dirHandle, fileName, blob);
        showToast(`Excel saved to Drive: ${fileName}`, 'success');
        refreshFiles();
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
        showToast(`Downloaded ${fileName}`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save Excel', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Presentation PPTX to Drive
  const handleSavePptxToDrive = async () => {
    try {
      setActionLoading(true);
      const slides = appState.presentationSlides || [];
      const pptxBuffer = await exportPresentationToPptx(
        slides,
        {},
        { title: appState.datasetMeta?.name || 'Executive Report', company: appState.brandTemplate?.name || 'OmniDash' },
        appState.brandTemplate,
        'blob'
      );

      const dsName = (appState.datasetMeta?.name || 'Presentation').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${dsName}_Deck_${new Date().toISOString().slice(0, 10)}.pptx`;

      if (dirHandle) {
        await writeDriveFile(dirHandle, fileName, pptxBuffer);
        showToast(`Presentation saved to Drive: ${fileName}`, 'success');
        refreshFiles();
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pptxBuffer);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
        showToast(`Downloaded ${fileName}`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save presentation to Drive', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle uploaded .omnidash file in Restore tab
  const handleRestoreFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const pkg = parseWorkspacePackage(text);
      setPendingRestoreData(pkg);
    } catch (err) {
      showToast(err.message || 'Invalid workspace file', 'error');
    }
  };

  const handleExecuteRestore = () => {
    if (!pendingRestoreData) return;
    onRestoreWorkspace(pendingRestoreData);
    showToast('Complete workspace restored successfully!', 'success');
    setPendingRestoreData(null);
    onClose();
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'omnidash':
        return <Layers size={18} color="#8b5cf6" />;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet size={18} color="#10b981" />;
      case 'pdf':
        return <FileText size={18} color="#ef4444" />;
      case 'pptx':
        return <Presentation size={18} color="#f59e0b" />;
      default:
        return <Database size={18} color="#38bdf8" />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        style={{
          width: 'min(780px, 95vw)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#090d16',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
          border: '1px solid var(--border-subtle)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)'
            }}>
              <Cloud size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>OmniSync Drive Hub</h2>
                <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                  Google Drive & OneDrive
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Direct file picking, background auto-save & portable .omnidash workspace packaging
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0, justifyContent: 'center' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Connection Status Banner */}
        <div style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          background: dirHandle ? 'rgba(16, 185, 129, 0.06)' : 'rgba(56, 189, 248, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {dirHandle ? (
              <CheckCircle2 size={18} color="#10b981" />
            ) : (
              <FolderSync size={18} color="#38bdf8" />
            )}
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: dirHandle ? '#34d399' : 'var(--text-main)' }}>
                {dirHandle ? `Active Drive Folder: "${folderName}"` : 'No Local Drive Folder Connected'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {dirHandle
                  ? 'Files and workspace backups save directly to your local PC drive folder'
                  : 'Connect your Google Drive (G:\\My Drive) or OneDrive directory'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {dirHandle ? (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={handleToggleAutoSync}
                    style={{ accentColor: '#10b981' }}
                  />
                  <span>Auto-save changes</span>
                </label>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleConnect}
                  disabled={actionLoading}
                  style={{ fontSize: '0.72rem' }}
                >
                  Change Folder
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleDisconnect}
                  style={{ fontSize: '0.72rem', color: '#fb7185' }}
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleConnect}
                disabled={actionLoading}
                style={{ gap: '6px' }}
              >
                <FolderOpen size={14} />
                <span>Connect Drive Folder</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <button
            onClick={() => setActiveTab('browse')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: activeTab === 'browse' ? '#38bdf8' : 'var(--text-muted)',
              borderBottom: activeTab === 'browse' ? '2px solid #38bdf8' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FolderOpen size={15} />
            <span>Files on Drive ({driveFiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: activeTab === 'backup' ? '#38bdf8' : 'var(--text-muted)',
              borderBottom: activeTab === 'backup' ? '2px solid #38bdf8' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Archive size={15} />
            <span>Export & Backup to Drive</span>
          </button>

          <button
            onClick={() => setActiveTab('restore')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: activeTab === 'restore' ? '#38bdf8' : 'var(--text-muted)',
              borderBottom: activeTab === 'restore' ? '2px solid #38bdf8' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Upload size={15} />
            <span>Restore Workspace (.omnidash)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* TAB 1: BROWSE FILES */}
          {activeTab === 'browse' && (
            <div>
              {!dirHandle ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <HardDrive size={44} color="#64748b" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>
                    Connect Your Google Drive or OneDrive
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                    Select a folder inside your synced Google Drive (e.g. <code>G:\My Drive\OmniDash</code>) or Microsoft OneDrive (<code>C:\Users\...\OneDrive\OmniDash</code>).
                  </p>
                  <button className="btn btn-primary" onClick={handleConnect} style={{ gap: '8px', margin: '0 auto' }}>
                    <FolderOpen size={16} /> Select Drive Directory
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Recognized spreadsheets, reports, and workspace backups in <strong>{folderName}</strong>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={refreshFiles}
                      disabled={loadingFiles}
                      style={{ fontSize: '0.72rem', gap: '6px' }}
                    >
                      <RefreshCw size={12} className={loadingFiles ? 'spin' : ''} /> Refresh
                    </button>
                  </div>

                  {driveFiles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px' }}>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        No analytical files (.xlsx, .csv, .json, .pdf, .omnidash) found in this folder.
                      </p>
                      <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('backup')}>
                        Export Current Workspace Here
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {driveFiles.map((fileItem, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            background: fileItem.type === 'omnidash' ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                            border: `1px solid ${fileItem.type === 'omnidash' ? 'rgba(139, 92, 246, 0.3)' : 'var(--border-subtle)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)' }}>
                              {getFileIcon(fileItem.type)}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {fileItem.name}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                                {fileItem.formattedSize} · Modified {fileItem.formattedDate}
                              </div>
                            </div>
                          </div>

                          <button
                            className={`btn btn-sm ${fileItem.type === 'omnidash' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleLoadFileFromDrive(fileItem)}
                            disabled={actionLoading}
                            style={{ fontSize: '0.74rem', gap: '6px' }}
                          >
                            <span>{fileItem.type === 'omnidash' ? 'Restore Workspace' : 'Load Dataset'}</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BACKUP & EXPORT */}
          {activeTab === 'backup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Option A: Full Workspace Package */}
              <div
                className="glass-panel"
                style={{
                  padding: '18px 20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  background: 'rgba(139, 92, 246, 0.04)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Layers size={18} color="#a78bfa" />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                      Complete Workspace Package (.omnidash)
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '440px', lineHeight: 1.4 }}>
                    Packs all raw dataset records, custom formulas, KPI cards, visual dashboard widgets, active filters, corporate brand template, and slide decks.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveWorkspaceSnapshot}
                    disabled={actionLoading}
                    style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', gap: '6px' }}
                  >
                    <Cloud size={14} />
                    <span>{dirHandle ? 'Save to Drive' : 'Download .omnidash'}</span>
                  </button>
                </div>
              </div>

              {/* Option B: Filtered Excel */}
              <div
                className="glass-panel"
                style={{
                  padding: '18px 20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <FileSpreadsheet size={18} color="#10b981" />
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>
                      Export Processed Excel (.xlsx)
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Exports active filtered dataset records directly to your connected Drive folder.
                  </p>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleSaveExcelToDrive}
                  disabled={actionLoading}
                  style={{ gap: '6px' }}
                >
                  <Download size={14} color="#10b981" />
                  <span>{dirHandle ? 'Save Excel to Drive' : 'Download Excel'}</span>
                </button>
              </div>

              {/* Option C: Presentation Deck */}
              <div
                className="glass-panel"
                style={{
                  padding: '18px 20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Presentation size={18} color="#f59e0b" />
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>
                      Export Presentation Deck (.pptx)
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Generates PowerPoint slide deck with vector shapes and embedded brand charts.
                  </p>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleSavePptxToDrive}
                  disabled={actionLoading}
                  style={{ gap: '6px' }}
                >
                  <Download size={14} color="#f59e0b" />
                  <span>{dirHandle ? 'Save PPTX to Drive' : 'Download PPTX'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: RESTORE WORKSPACE */}
          {activeTab === 'restore' && (
            <div>
              <div style={{ textAlign: 'center', padding: '24px 20px', border: '2px dashed var(--border-subtle)', borderRadius: '12px', marginBottom: '16px' }}>
                <Layers size={36} color="#8b5cf6" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>
                  Select or Drop a .omnidash Workspace File
                </h4>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Restores complete state across datasets, widgets, custom formulas, KPIs, and slide decks.
                </p>

                <input
                  type="file"
                  ref={restoreFileInputRef}
                  accept=".omnidash,.json"
                  onChange={handleRestoreFileSelected}
                  style={{ display: 'none' }}
                />

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => restoreFileInputRef.current?.click()}
                  style={{ gap: '6px', margin: '0 auto' }}
                >
                  <Upload size={14} /> Browse Workspace File
                </button>
              </div>

              {pendingRestoreData && (
                <div
                  className="glass-panel"
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px' }}>
                    <CheckCircle2 size={16} />
                    <span>Workspace Package Verified</span>
                  </div>

                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '14px' }}>
                    <div>Dataset: <strong>{pendingRestoreData.datasetMeta?.name || 'Custom'}</strong></div>
                    <div>Data Rows: <strong>{(pendingRestoreData.rawData || []).length}</strong></div>
                    <div>KPI Cards: <strong>{(pendingRestoreData.kpiCards || []).length}</strong></div>
                    <div>Widgets: <strong>{(pendingRestoreData.widgets || []).length}</strong></div>
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={handleExecuteRestore}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Restore Workspace Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.72rem',
          color: 'var(--text-faint)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>100% Client-Side: File handles are managed inside your browser sandbox.</span>
          </div>
          <div>OmniDash v2.0</div>
        </div>
      </div>
    </div>
  );
}
