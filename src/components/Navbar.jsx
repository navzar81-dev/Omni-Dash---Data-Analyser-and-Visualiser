import React, { useState } from 'react';
import {
  BarChart3,
  UploadCloud,
  FileSpreadsheet,
  Calculator,
  Sparkles,
  Download,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  Database,
  ChevronDown,
  Layers,
  FileText,
  Presentation,
  Archive,
  Camera,
  Save,
  GitMerge,
  Palette,
  HardDrive,
  FolderSync
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../services/sampleDatasets';

export function Navbar({
  currentDataset,
  onSelectDataset,
  onOpenUpload,
  onOpenFormula,
  onOpenDataModeling,
  onOpenProfiler,
  onToggleInsights,
  insightsCount,
  onOpenPresentation,
  onToggleAiAnalyst,
  onOpenAiSettings,
  theme,
  onToggleTheme,
  onSelectTheme,
  branding,
  onOpenBranding,
  onExportPdf,
  onExportPng,
  onExportExcel,
  onExportCsv,
  onExportAllChartsZip,
  onExportViewJson,
  onOpenDriveSync,
  isDriveConnected,
  driveFolderName,
  onSaveWorkspaceSnapshot
}) {
  const [showDatasetMenu, setShowDatasetMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const brandTitle = branding?.title || 'OmniDash.BI';
  const brandSubtitle = branding?.subtitle || 'Enterprise Reporting & Presentation Studio';
  const logoUrl = branding?.logoUrl;

  return (
    <header className="glass-panel navbar-header" style={{
      margin: '12px 20px',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: '12px',
      zIndex: 50,
      backdropFilter: 'blur(20px)'
    }}>
      {/* Brand & Active Dataset */}
      <div className="navbar-brand-section" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Brand Logo"
              style={{
                height: '38px',
                maxWidth: '90px',
                borderRadius: '8px',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div style={{
              width: '38px',
              height: '38px',
              minWidth: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-indigo, #6366f1) 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px var(--accent-indigo-glow, rgba(99, 102, 241, 0.4))'
            }}>
              <BarChart3 size={20} color="#ffffff" />
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
                {brandTitle}
              </span>
              <span className="badge badge-indigo navbar-enterprise-badge" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                BI Studio
              </span>
            </div>
            <div className="navbar-brand-subtitle" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {brandSubtitle}
            </div>
          </div>
        </div>

        {/* Dataset Switcher Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowDatasetMenu(!showDatasetMenu)}
            style={{ gap: '6px' }}
          >
            <Database size={15} color="#818cf8" />
            <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentDataset?.name || 'Select Dataset'}
            </span>
            <ChevronDown size={14} />
          </button>

          {showDatasetMenu && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: 'min(320px, 88vw)',
                maxHeight: '75vh',
                overflowY: 'auto',
                padding: '8px',
                zIndex: 60,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
              onMouseLeave={() => setShowDatasetMenu(false)}
            >
              <div style={{ padding: '6px 10px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                Preloaded Industry Datasets
              </div>
              {Object.values(SAMPLE_DATASETS).map(ds => (
                <button
                  key={ds.id}
                  onClick={() => {
                    onSelectDataset(ds);
                    setShowDatasetMenu(false);
                  }}
                  style={{
                    background: currentDataset?.id === ds.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = currentDataset?.id === ds.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent'}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.84rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{ds.name}</span>
                    <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>{ds.category}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {ds.data.length} records · {ds.source}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Controls - Expanding Accordion Toolbar (Recommendation 2) */}
      {/* Action Controls - Expanding Accordion Toolbar (Recommendation 2) */}
      <div className="navbar-actions-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Upload Dataset Button */}
        <button
          className="nav-accordion-btn"
          onClick={onOpenUpload}
          id="btn-upload-dataset"
          title="Upload Dataset (Excel, CSV, Word, PowerPoint, PDF)"
        >
          <UploadCloud size={16} />
          <span className="nav-accordion-label">
            <span>Upload Data</span>
            <span style={{ fontSize: '0.64rem', opacity: 0.85, background: 'rgba(255, 255, 255, 0.25)', padding: '1px 5px', borderRadius: '4px' }}>
              XLS / CSV / PDF
            </span>
          </span>
        </button>

        {/* Presentation Studio Button */}
        <button
          className="nav-accordion-btn"
          onClick={onOpenPresentation}
          title="Presentation Studio (Build Boardroom Slide Deck & PPTX)"
        >
          <Presentation size={16} />
          <span className="nav-accordion-label">
            <span>Presentation Studio</span>
          </span>
        </button>

        {/* Calculated Field Builder */}
        <button
          className="nav-accordion-btn"
          onClick={onOpenFormula}
          title="Calculated Field (Formulas, Ratios & Computed Columns)"
        >
          <Calculator size={16} />
          <span className="nav-accordion-label">
            <span>Calculated Field</span>
          </span>
        </button>

        {/* Data Schema & Profiler */}
        <button
          className="nav-accordion-btn"
          onClick={onOpenProfiler}
          title="Data Profiler (Data Types, Distributions & Outliers)"
        >
          <Layers size={16} />
          <span className="nav-accordion-label">
            <span>Data Profiler</span>
          </span>
        </button>

        {/* Relational Data Modeling & Joins */}
        <button
          className="nav-accordion-btn"
          onClick={onOpenDataModeling}
          title="Data Modeling (Multi-Table Joins, Merges & Custom Bucket Grouping)"
        >
          <GitMerge size={16} />
          <span className="nav-accordion-label">
            <span>Data Modeling</span>
          </span>
        </button>

        {/* Smart Insights Drawer Button */}
        <button
          className="nav-accordion-btn"
          onClick={onToggleInsights}
          title={`Smart Insights (${insightsCount} automated insights detected)`}
        >
          <Sparkles size={16} />
          {insightsCount > 0 && <span className="nav-badge-dot" />}
          <span className="nav-accordion-label">
            <span>Smart Insights</span>
            {insightsCount > 0 && (
              <span className="nav-pill-badge" style={{ background: '#f59e0b', color: '#000' }}>
                {insightsCount}
              </span>
            )}
          </span>
        </button>

        {/* Local AI Business Analyst Button */}
        <button
          className="nav-accordion-btn"
          onClick={onToggleAiAnalyst}
          title="AI Business Analyst (Offline In-Browser GGUF / AirLLM)"
        >
          <Sparkles size={15} />
          <span className="nav-accordion-label">
            <span>AI Analyst</span>
            <span className="badge badge-emerald nav-pill-badge">
              Local
            </span>
          </span>
        </button>

        {/* Local & Cloud Drive Sync Hub Button */}
        {onOpenDriveSync && (
          <button
            className={`nav-accordion-btn ${isDriveConnected ? 'is-active' : ''}`}
            onClick={onOpenDriveSync}
            title={
              isDriveConnected
                ? `Connected to Drive Folder: "${driveFolderName}" (Click to browse files, save or restore)`
                : 'Connect Local Google Drive / OneDrive Folder (File System Access & .omnidash Hub)'
            }
          >
            <HardDrive size={16} />
            <span className="nav-accordion-label">
              <span>Drive Sync</span>
              {isDriveConnected ? (
                <span className="badge badge-emerald nav-pill-badge" style={{ maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {driveFolderName}
                </span>
              ) : (
                <span style={{ fontSize: '0.64rem', opacity: 0.85, background: 'rgba(56, 189, 248, 0.2)', padding: '1px 5px', borderRadius: '4px' }}>
                  GDrive/OneDrive
                </span>
              )}
            </span>
          </button>
        )}

        {/* Export Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className={`nav-accordion-btn ${showExportMenu ? 'is-active' : ''}`}
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Export Presentation, Executive PDF, All Charts ZIP, Excel, CSV & Workspace"
          >
            <Download size={16} />
            <span className="nav-accordion-label">
              <span>Export</span>
              <ChevronDown size={13} />
            </span>
          </button>

          {showExportMenu && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '240px',
                padding: '6px',
                zIndex: 60,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
              onMouseLeave={() => setShowExportMenu(false)}
            >
              {onOpenDriveSync && (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', border: 'none', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}
                  onClick={() => { onOpenDriveSync(); setShowExportMenu(false); }}
                >
                  <FolderSync size={14} color="#38bdf8" />
                  <span>Drive Sync & Backups Hub</span>
                </button>
              )}

              {onSaveWorkspaceSnapshot && (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
                  onClick={() => { onSaveWorkspaceSnapshot(); setShowExportMenu(false); }}
                >
                  <Save size={14} color="#8b5cf6" />
                  <span>Save Workspace (.omnidash)</span>
                </button>
              )}

              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />

              {/* Batch Chart Download */}
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
                onClick={() => { onExportAllChartsZip(); setShowExportMenu(false); }}
              >
                <Archive size={14} color="#34d399" />
                <span>Download All Charts (ZIP)</span>
              </button>

              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
                onClick={() => { onExportPdf(); setShowExportMenu(false); }}
              >
                <FileText size={14} color="#f43f5e" />
                <span>Executive PDF Report</span>
              </button>

              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
                onClick={() => { onExportExcel(); setShowExportMenu(false); }}
              >
                <FileSpreadsheet size={14} color="#10b981" />
                <span>Export Dataset (.xlsx)</span>
              </button>

              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
                onClick={() => { onExportCsv(); setShowExportMenu(false); }}
              >
                <Database size={14} color="#06b6d4" />
                <span>Export Raw CSV</span>
              </button>

              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
                onClick={() => { onExportPng(); setShowExportMenu(false); }}
              >
                <Camera size={14} color="#a855f7" />
                <span>Capture Fullscreen PNG</span>
              </button>

              {onExportViewJson && (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
                  onClick={() => { onExportViewJson(); setShowExportMenu(false); }}
                >
                  <Save size={14} color="#818cf8" />
                  <span>Export View Layout (.json)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Subtle Separator */}
        <div style={{ width: '1px', height: '22px', background: 'var(--border-subtle)', margin: '0 4px' }} />

        {/* Brand & Theme Settings */}
        <button
          className="btn btn-secondary btn-icon"
          onClick={onOpenBranding}
          title="Custom Branding, Logos, Themes & Grid Density"
          style={{ width: '38px', height: '38px', padding: 0 }}
        >
          <Palette size={16} color="#ec4899" />
        </button>

        {/* Theme Toggle */}
        <button
          className="btn btn-secondary btn-icon"
          onClick={onToggleTheme}
          title="Toggle Light / Dark Theme"
          style={{ width: '38px', height: '38px', padding: 0 }}
        >
          {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#6366f1" />}
        </button>

        {/* Fullscreen Mode */}
        <button
          className="btn btn-secondary btn-icon"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen Boardroom Mode"
          style={{ width: '38px', height: '38px', padding: 0 }}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </header>
  );
}
