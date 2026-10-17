import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { GlobalFilterBar } from './components/GlobalFilterBar';
import { SmartQueryBar } from './components/SmartQueryBar';
import { ExecutiveKpis } from './components/ExecutiveKpis';
import { KpiDetailModal } from './components/KpiDetailModal';
import { KpiManagerModal } from './components/KpiManagerModal';
import { DashboardGrid } from './components/DashboardGrid';
import { FileUploadModal } from './components/FileUploadModal';
import { WidgetBuilderModal } from './components/WidgetBuilderModal';
import { FormulaEngineModal } from './components/FormulaEngineModal';
import { DataProfilerModal } from './components/DataProfilerModal';
import { SmartInsightsDrawer } from './components/SmartInsightsDrawer';
import { DataTableView } from './components/DataTableView';
import { PresentationStudio } from './components/PresentationStudio';
import { LocalAiModal } from './components/LocalAiModal';
import { AiAnalystDrawer } from './components/AiAnalystDrawer';
import { DataModelingModal } from './components/DataModelingModal';
import { AdvancedFilterModal } from './components/AdvancedFilterModal';
import { BrandingModal } from './components/BrandingModal';
import { DriveSyncModal } from './components/DriveSyncModal';
import {
  getStoredDirectoryHandle,
  verifyDirectoryPermission,
  getCachedFolderName,
  saveWorkspaceToDrive,
  downloadWorkspacePackage,
  getAutoSyncPreference
} from './services/driveSyncService';
import { SAMPLE_DATASETS } from './services/sampleDatasets';
import { cleanAndProfileDataset } from './services/fileParsers';
import { evaluateCustomFormula, calculateKpiDelta } from './services/calculationEngine';
import { evaluateCompoundFilters } from './services/dataModelingService';
import { generateDatasetInsights } from './services/smartInsights';
import { syncChartJsTheme } from './services/chartSetup';
import {
  exportDashboardToPdf,
  exportDashboardToPng,
  exportToExcel,
  exportToCsv,
  exportAllWidgetsAsZip
} from './services/exportService';
import {
  BarChart2,
  Table,
  Presentation,
  PlusCircle
} from 'lucide-react';
import {
  getDatasetKey,
  saveDatasetWorkspace,
  loadDatasetWorkspace,
  clearDatasetWorkspace,
  saveActiveDatasetSession,
  loadActiveDatasetSession,
  loadActiveDatasetSessionAsync,
  saveAppTheme,
  loadAppTheme,
  saveBrandingConfig,
  loadBrandingConfig,
  exportWorkspaceJson,
  parseWorkspaceJson
} from './services/storageService';

const DEFAULT_FINANCIALS_KPIS = [
  { id: 'kpi-1', column: 'Revenue', label: 'Revenue', aggregation: 'SUM', format: 'currency', target: null },
  { id: 'kpi-2', column: 'COGS', label: 'COGS', aggregation: 'SUM', format: 'currency', target: null },
  { id: 'kpi-3', column: 'Gross_Profit', label: 'Gross Profit', aggregation: 'SUM', format: 'currency', target: null },
  { id: 'kpi-4', column: 'OPEX', label: 'OPEX', aggregation: 'SUM', format: 'currency', target: null }
];

const DEFAULT_FINANCIALS_WIDGETS = [
  {
    id: 'w1',
    title: 'Revenue Breakdown by Region & Business Unit',
    chartType: 'stackedBar',
    dimension: 'Region',
    measure: 'Revenue',
    secondaryDimension: 'Business_Unit',
    aggregation: 'SUM',
    modifier: 'RAW',
    colorTheme: 'indigo',
    width: 'half'
  },
  {
    id: 'w2',
    title: 'EBITDA Trajectory & Moving Average',
    chartType: 'line',
    dimension: 'Quarter',
    measure: 'EBITDA',
    aggregation: 'SUM',
    modifier: 'ROLLING_AVG_3',
    colorTheme: 'emerald',
    width: 'half'
  },
  {
    id: 'w3',
    title: 'P&L Waterfall Bridge (Revenue to Net Income)',
    chartType: 'waterfall',
    dimension: 'Quarter',
    measure: 'Net_Income',
    aggregation: 'SUM',
    modifier: 'RAW',
    colorTheme: 'indigo',
    width: 'half'
  },
  {
    id: 'w4',
    title: 'Regional Revenue Share of Grand Total',
    chartType: 'donut',
    dimension: 'Region',
    measure: 'Revenue',
    aggregation: 'SUM',
    modifier: 'SHARE_OF_TOTAL',
    colorTheme: 'cyan',
    width: 'half'
  },
  {
    id: 'w5',
    title: 'Cross-Tabulation Matrix: Region vs Business Unit',
    chartType: 'pivot',
    dimension: 'Region',
    measure: 'Revenue',
    secondaryDimension: 'Business_Unit',
    aggregation: 'SUM',
    modifier: 'RAW',
    width: 'full'
  }
];

function buildDefaultKpis(profiles) {
  const numericCols = profiles.filter(c => c.type === 'measure');
  return numericCols.slice(0, 4).map((col, idx) => ({
    id: `kpi-card-${Date.now()}-${idx}`,
    column: col.name,
    label: col.name.replace(/_/g, ' '),
    aggregation: 'SUM',
    format: /(revenue|cost|cogs|price|spend|profit|mrr|arr)/i.test(col.name) ? 'currency' : 'compact',
    target: null
  }));
}

function buildDefaultSmartWidgets(profiles, defaultMetrics) {
  const measures = profiles.filter(c => c.type === 'measure').map(c => c.name);
  const dimensions = profiles.filter(c => c.type === 'dimension').map(c => c.name);
  const dateCol = profiles.find(c => c.type === 'date')?.name;

  const primaryM = defaultMetrics?.primary || measures[0] || 'Value';
  const secondaryM = defaultMetrics?.secondary || measures[1] || measures[0];
  const primaryD = defaultMetrics?.dimension || dimensions[0] || 'Category';
  const secondaryD = dimensions[1] || null;

  return [
    {
      id: `w-${Date.now()}-1`,
      title: `${primaryM} by ${primaryD}`,
      chartType: 'bar',
      dimension: primaryD,
      measure: primaryM,
      secondaryDimension: secondaryD,
      aggregation: 'SUM',
      modifier: 'RAW',
      colorTheme: 'indigo',
      width: 'half'
    },
    {
      id: `w-${Date.now()}-2`,
      title: `${secondaryM} Trend & Trajectory`,
      chartType: 'line',
      dimension: dateCol || primaryD,
      measure: secondaryM,
      aggregation: 'AVG',
      modifier: 'ROLLING_AVG_3',
      colorTheme: 'emerald',
      width: 'half'
    },
    {
      id: `w-${Date.now()}-3`,
      title: `${primaryM} Proportion & Market Share`,
      chartType: 'donut',
      dimension: primaryD,
      measure: primaryM,
      aggregation: 'SUM',
      modifier: 'SHARE_OF_TOTAL',
      colorTheme: 'cyan',
      width: 'half'
    },
    {
      id: `w-${Date.now()}-4`,
      title: `Cross-Tabulation Matrix: ${primaryD} vs ${secondaryD || 'Summary'}`,
      chartType: 'pivot',
      dimension: primaryD,
      measure: primaryM,
      secondaryDimension: secondaryD || primaryD,
      aggregation: 'SUM',
      modifier: 'RAW',
      width: 'half'
    }
  ];
}

export default function App() {
  const [theme, setTheme] = useState(() => loadAppTheme());
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'grid'

  // Load previous session if available
  const initialSession = useMemo(() => {
    return loadActiveDatasetSession(SAMPLE_DATASETS);
  }, []);

  const activeMeta = initialSession?.meta || SAMPLE_DATASETS.financials;
  const activeRaw = initialSession?.data || SAMPLE_DATASETS.financials.data;
  const initialProfile = useMemo(() => {
    return cleanAndProfileDataset(activeRaw, activeMeta.name);
  }, [activeRaw, activeMeta.name]);
  const initialKey = getDatasetKey(activeMeta);
  const initialSavedWorkspace = useMemo(() => {
    return loadDatasetWorkspace(initialKey);
  }, [initialKey]);

  // Dataset State
  const [datasetMeta, setDatasetMeta] = useState(activeMeta);
  const [rawData, setRawData] = useState(activeRaw);
  const [columns, setColumns] = useState(initialProfile.columns);
  const [columnProfiles, setColumnProfiles] = useState(initialProfile.columnProfiles);
  const [dateColumn, setDateColumn] = useState(
    initialSavedWorkspace?.dateColumn || activeMeta.dateColumn || initialProfile.dateColumn || 'Date'
  );

  // Branding & Visual Presentation State
  const [branding, setBranding] = useState(() => loadBrandingConfig());

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isWidgetBuilderOpen, setIsWidgetBuilderOpen] = useState(false);
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [isDataModelingOpen, setIsDataModelingOpen] = useState(false);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [isBrandingOpen, setIsBrandingOpen] = useState(false);
  const [isProfilerOpen, setIsProfilerOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isAiAnalystOpen, setIsAiAnalystOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [pendingAiSlide, setPendingAiSlide] = useState(null);

  // Drive Sync & Workspace Storage State
  const [isDriveSyncOpen, setIsDriveSyncOpen] = useState(false);
  const [driveDirHandle, setDriveDirHandle] = useState(null);
  const [driveFolderName, setDriveFolderName] = useState(() => getCachedFolderName());
  const [autoSyncDrive, setAutoSyncDrive] = useState(() => getAutoSyncPreference());

  // Advanced Compound Filter Rules State
  const [compoundRules, setCompoundRules] = useState([]);
  const [compoundLogicOperator, setCompoundLogicOperator] = useState('AND');

  // Executive KPI Management State
  const [kpiCards, setKpiCards] = useState(() => {
    if (initialSavedWorkspace?.kpiCards && initialSavedWorkspace.kpiCards.length > 0) {
      return initialSavedWorkspace.kpiCards;
    }
    if (initialKey === 'financials') {
      return DEFAULT_FINANCIALS_KPIS;
    }
    return buildDefaultKpis(initialProfile.columnProfiles);
  });
  const [selectedKpiForDetail, setSelectedKpiForDetail] = useState(null);
  const [isKpiManagerOpen, setIsKpiManagerOpen] = useState(false);

  // Filters State
  const [activeFilters, setActiveFilters] = useState(initialSavedWorkspace?.activeFilters || {});
  const [searchTerm, setSearchTerm] = useState(initialSavedWorkspace?.searchTerm || '');
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ text: message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 3200);
  };

  // Widgets State
  const [widgets, setWidgets] = useState(() => {
    if (initialSavedWorkspace?.widgets && initialSavedWorkspace.widgets.length > 0) {
      return initialSavedWorkspace.widgets;
    }
    if (initialKey === 'financials') {
      return DEFAULT_FINANCIALS_WIDGETS;
    }
    return buildDefaultSmartWidgets(initialProfile.columnProfiles, activeMeta.defaultMetrics);
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-density', branding?.gridDensity || 'spacious');
    if (branding?.accentColor) {
      document.documentElement.style.setProperty('--accent-indigo', branding.accentColor);
      document.documentElement.style.setProperty('--border-active', branding.accentColor);
    }
    saveAppTheme(theme);
    syncChartJsTheme(theme);
  }, [theme, branding]);

  // Restore large custom dataset from IndexedDB if localStorage quota prevented full caching
  useEffect(() => {
    async function restoreLargeDatasetSession() {
      if (!initialSession || !initialSession.isCustom) {
        const idbSession = await loadActiveDatasetSessionAsync(SAMPLE_DATASETS);
        if (idbSession && idbSession.isCustom && idbSession.meta && idbSession.data && idbSession.data.length > 0) {
          const profile = cleanAndProfileDataset(idbSession.data, idbSession.meta.name);
          const key = getDatasetKey(idbSession.meta);
          const savedConfig = loadDatasetWorkspace(key);

          setDatasetMeta(idbSession.meta);
          setRawData(idbSession.data);
          setColumns(profile.columns);
          setColumnProfiles(profile.columnProfiles);
          setDateColumn(savedConfig?.dateColumn || idbSession.meta.dateColumn || profile.dateColumn || 'Date');

          if (savedConfig?.kpiCards && savedConfig.kpiCards.length > 0) {
            setKpiCards(savedConfig.kpiCards);
          } else {
            setKpiCards(buildDefaultKpis(profile.columnProfiles));
          }

          if (savedConfig?.widgets && savedConfig.widgets.length > 0) {
            setWidgets(savedConfig.widgets);
          } else {
            setWidgets(buildDefaultSmartWidgets(profile.columnProfiles, idbSession.meta.defaultMetrics));
          }

          if (savedConfig?.activeFilters) {
            setActiveFilters(savedConfig.activeFilters);
          }
          if (savedConfig?.searchTerm) {
            setSearchTerm(savedConfig.searchTerm);
          }
        }
      }
    }
    restoreLargeDatasetSession();
  }, [initialSession]);

  // Attempt to restore persistent DirectoryHandle from IndexedDB on startup
  useEffect(() => {
    async function restoreDriveHandle() {
      try {
        const storedHandle = await getStoredDirectoryHandle();
        if (storedHandle) {
          const hasPerm = await verifyDirectoryPermission(storedHandle, false);
          if (hasPerm) {
            setDriveDirHandle(storedHandle);
          }
          setDriveFolderName(storedHandle.name);
        }
      } catch (err) {
        console.warn('Failed to restore drive directory handle:', err);
      }
    }
    restoreDriveHandle();
  }, []);

  // Background auto-backup to connected Drive folder when workspace changes
  useEffect(() => {
    if (!autoSyncDrive || !driveDirHandle) return;
    const timeout = setTimeout(async () => {
      try {
        const statePayload = {
          datasetMeta,
          rawData,
          columns,
          columnProfiles,
          dateColumn,
          kpiCards,
          widgets,
          branding,
          compoundRules,
          compoundLogicOperator,
          searchTerm,
          activeFilters
        };
        const dsName = (datasetMeta?.name || 'Workspace').replace(/[^a-zA-Z0-9_-]/g, '_');
        await saveWorkspaceToDrive(driveDirHandle, statePayload, `${dsName}_AutoBackup.omnidash`);
      } catch (err) {
        console.warn('Background auto-backup to Drive failed:', err);
      }
    }, 4000);
    return () => clearTimeout(timeout);
  }, [
    autoSyncDrive,
    driveDirHandle,
    datasetMeta,
    rawData,
    columns,
    columnProfiles,
    dateColumn,
    kpiCards,
    widgets,
    branding,
    compoundRules,
    compoundLogicOperator,
    searchTerm,
    activeFilters
  ]);

  // Generate Smart Insights automatically
  const insights = useMemo(() => {
    return generateDatasetInsights(rawData, columns, columnProfiles);
  }, [rawData, columns, columnProfiles]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    let result = rawData.filter(row => {
      for (const [dim, selectedVal] of Object.entries(activeFilters)) {
        if (selectedVal && String(row[dim]) !== String(selectedVal)) {
          return false;
        }
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match = Object.values(row).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(term));
        if (!match) return false;
      }
      return true;
    });

    if (compoundRules.length > 0) {
      result = evaluateCompoundFilters(result, compoundRules, compoundLogicOperator);
    }

    return result;
  }, [rawData, activeFilters, searchTerm, compoundRules, compoundLogicOperator]);

  // Derived KPI metrics for presentation & executive cards based on active kpiCards
  const kpis = useMemo(() => {
    const activeCards = kpiCards && kpiCards.length > 0
      ? kpiCards
      : columnProfiles
          .filter(c => c.type === 'measure')
          .slice(0, 4)
          .map((col, idx) => ({
            id: `kpi-def-${idx}`,
            column: col.name,
            label: col.name.replace(/_/g, ' '),
            aggregation: 'SUM',
            format: /(revenue|cost|cogs|opex|capex|price|spend|profit|mrr|arr|income|ebitda)/i.test(col.name) ? 'currency' : 'compact',
            target: null
          }));

    return activeCards.slice(0, 4).map(card => {
      const stats = calculateKpiDelta(filteredData, card.column, dateColumn, card.aggregation || 'SUM');
      return {
        name: card.column,
        label: card.label || card.column.replace(/_/g, ' '),
        total: stats.total,
        formattedTotal: formatMetric(stats.total, card.column, card.format),
        deltaPct: stats.deltaPct,
        isPositive: stats.deltaPct >= 0
      };
    });
  }, [kpiCards, filteredData, columnProfiles, dateColumn]);

  // Persistent Sync: Save active dataset session only when dataset metadata or raw data changes
  useEffect(() => {
    saveActiveDatasetSession(datasetMeta, rawData);
  }, [datasetMeta, rawData]);

  // Persistent Sync: Debounce workspace customization saving (widgets, filters, search)
  useEffect(() => {
    const key = getDatasetKey(datasetMeta);
    if (!key) return;
    const timeout = setTimeout(() => {
      saveDatasetWorkspace(key, {
        kpiCards,
        widgets,
        activeFilters,
        dateColumn,
        searchTerm
      });
    }, 400);
    return () => clearTimeout(timeout);
  }, [datasetMeta, kpiCards, widgets, activeFilters, dateColumn, searchTerm]);

  const handleSelectSample = (sample) => {
    const profiled = cleanAndProfileDataset(sample.data, sample.name);
    const key = getDatasetKey(sample);
    const savedConfig = loadDatasetWorkspace(key);

    setDatasetMeta(sample);
    setRawData(sample.data);
    setColumns(profiled.columns);
    setColumnProfiles(profiled.columnProfiles);
    setCompoundRules([]);
    saveActiveDatasetSession(sample, sample.data);

    if (savedConfig) {
      setKpiCards(savedConfig.kpiCards || []);
      setWidgets(savedConfig.widgets || []);
      setActiveFilters(savedConfig.activeFilters || {});
      setSearchTerm(savedConfig.searchTerm || '');
      setDateColumn(savedConfig.dateColumn || sample.dateColumn || profiled.dateColumn);
    } else {
      setActiveFilters({});
      setSearchTerm('');
      setDateColumn(sample.dateColumn || profiled.dateColumn);

      if (key === 'financials') {
        setKpiCards(DEFAULT_FINANCIALS_KPIS);
        setWidgets(DEFAULT_FINANCIALS_WIDGETS);
      } else {
        setKpiCards(buildDefaultKpis(profiled.columnProfiles));
        setWidgets(buildDefaultSmartWidgets(profiled.columnProfiles, sample.defaultMetrics));
      }
    }
  };

  const handleDatasetLoaded = (imported) => {
    const key = getDatasetKey(imported);
    const savedConfig = loadDatasetWorkspace(key);

    setDatasetMeta(imported);
    setRawData(imported.data);
    setColumns(imported.columns);
    setColumnProfiles(imported.columnProfiles);
    setCompoundRules([]);
    saveActiveDatasetSession(imported, imported.data);

    if (savedConfig) {
      setKpiCards(savedConfig.kpiCards || []);
      setWidgets(savedConfig.widgets || []);
      setActiveFilters(savedConfig.activeFilters || {});
      setSearchTerm(savedConfig.searchTerm || '');
      setDateColumn(savedConfig.dateColumn || imported.dateColumn);
    } else {
      setActiveFilters({});
      setSearchTerm('');
      setDateColumn(imported.dateColumn);

      setKpiCards(buildDefaultKpis(imported.columnProfiles));
      setWidgets(buildDefaultSmartWidgets(imported.columnProfiles));
    }
  };

  const handleResetDatasetLayout = () => {
    const key = getDatasetKey(datasetMeta);
    clearDatasetWorkspace(key);

    setActiveFilters({});
    setSearchTerm('');

    if (key === 'financials') {
      setKpiCards(DEFAULT_FINANCIALS_KPIS);
      setWidgets(DEFAULT_FINANCIALS_WIDGETS);
      setDateColumn('Date');
    } else {
      setKpiCards(buildDefaultKpis(columnProfiles));
      setWidgets(buildDefaultSmartWidgets(columnProfiles, datasetMeta?.defaultMetrics));
      setDateColumn(datasetMeta?.dateColumn || 'Date');
    }
    showToast(`✓ Reset "${datasetMeta?.name || 'Dataset'}" to factory defaults`, 'info');
  };

  const handleFormulaAdded = (name, expression) => {
    const updatedData = evaluateCustomFormula(rawData, name, expression);
    setRawData(updatedData);

    if (!columns.includes(name)) {
      const updatedColumns = [...columns, name];
      setColumns(updatedColumns);

      const newProfile = {
        name,
        type: 'measure',
        sampleValues: updatedData.slice(0, 5).map(r => r[name]),
        distinctCount: new Set(updatedData.map(r => r[name])).size,
        missingCount: 0,
        isNumeric: true
      };
      setColumnProfiles([...columnProfiles, newProfile]);
    }
  };

  const handleAddWidget = (newWidget) => {
    setWidgets(prev => [newWidget, ...prev]);
  };

  const handleSaveWidget = (widget) => {
    setWidgets(prev => {
      const idx = prev.findIndex(w => w.id === widget.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = widget;
        return copy;
      }
      return [widget, ...prev];
    });
  };

  const handleDuplicateWidget = (widget) => {
    const duplicate = {
      ...widget,
      id: `widget-${Date.now()}`,
      title: `${widget.title} (Copy)`
    };
    setWidgets(prev => [duplicate, ...prev]);
  };

  const handleDeleteWidget = (id) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  const handleResizeWidget = (id, newWidth) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, width: newWidth } : w));
  };

  const handleReorderWidgets = (newWidgets) => {
    setWidgets(newWidgets);
    showToast('✓ Dashboard layout order updated', 'info');
  };

  const handleApplyMergedDataset = ({ data, name, joinStats }) => {
    try {
      const profiled = cleanAndProfileDataset(data, name);
      const newMeta = {
        id: `merged-${Date.now()}`,
        name,
        source: 'Relational Merge',
        category: 'Data Modeling',
        data,
        columns: profiled.columns,
        columnProfiles: profiled.columnProfiles,
        dateColumn: profiled.dateColumn
      };
      setDatasetMeta(newMeta);
      setRawData(data);
      setColumns(profiled.columns);
      setColumnProfiles(profiled.columnProfiles);
      setDateColumn(profiled.dateColumn);
      setCompoundRules([]);
      setKpiCards(buildDefaultKpis(profiled.columnProfiles));
      setWidgets(buildDefaultSmartWidgets(profiled.columnProfiles));
      saveActiveDatasetSession(newMeta, data);
      showToast(`✓ Merged ${data.length.toLocaleString()} rows (${joinStats.matchedRows} matches)!`, 'success');
    } catch (err) {
      showToast(`Merge failed: ${err.message}`, 'error');
    }
  };

  const handleApplyGroupedColumn = (newColName, updatedData) => {
    try {
      const profiled = cleanAndProfileDataset(updatedData, datasetMeta?.name);
      setRawData(updatedData);
      setColumns(profiled.columns);
      setColumnProfiles(profiled.columnProfiles);
      saveActiveDatasetSession(datasetMeta, updatedData);
      showToast(`✓ Created custom grouped dimension "${newColName}"`, 'success');
    } catch (err) {
      showToast(`Grouping failed: ${err.message}`, 'error');
    }
  };

  const handleSaveBranding = (newBranding) => {
    setBranding(newBranding);
    saveBrandingConfig(newBranding);
    showToast('✓ Brand identity & visual presentation updated', 'success');
  };

  const handleApplyCompoundRules = (rules, op) => {
    setCompoundRules(rules);
    setCompoundLogicOperator(op);
    showToast(`✓ Applied ${rules.length} custom condition${rules.length > 1 ? 's' : ''}`, 'info');
  };

  const handleExportPdf = () => {
    exportDashboardToPdf('dashboard-export-target', datasetMeta?.name || 'Executive_Business_Report');
  };

  const handleExportPng = () => {
    exportDashboardToPng('dashboard-export-target', datasetMeta?.name || 'Dashboard_Snapshot');
  };

  const handleExportExcel = () => {
    exportToExcel(filteredData, datasetMeta?.name || 'Business_Report');
  };

  const handleExportCsv = () => {
    exportToCsv(filteredData, datasetMeta?.name || 'Business_Report');
  };

  const handleExportAllChartsZip = async () => {
    if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
      await new Promise(r => setTimeout(r, 200));
    }
    const success = await exportAllWidgetsAsZip(widgets, datasetMeta?.name || 'Dashboard');
    if (success) {
      showToast('All chart images packaged and downloaded as ZIP', 'success');
    }
  };

  const handleManualSaveView = () => {
    const key = getDatasetKey(datasetMeta);
    if (!key) return;
    saveDatasetWorkspace(key, {
      kpiCards,
      widgets,
      activeFilters,
      dateColumn,
      searchTerm
    });
    saveActiveDatasetSession(datasetMeta, rawData);
    showToast(`✓ View for "${datasetMeta?.name || 'Dataset'}" saved to browser storage!`, 'success');
  };

  const handleExportViewJson = () => {
    const ok = exportWorkspaceJson(datasetMeta, {
      kpiCards,
      widgets,
      activeFilters,
      dateColumn,
      searchTerm
    });
    if (ok) {
      showToast(`✓ View configuration exported as JSON!`, 'success');
    }
  };

  const handleImportViewJson = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseWorkspaceJson(e.target.result);
        if (parsed.kpiCards && parsed.kpiCards.length > 0) {
          setKpiCards(parsed.kpiCards);
        }
        if (parsed.widgets && parsed.widgets.length > 0) {
          setWidgets(parsed.widgets);
        }
        if (parsed.activeFilters && typeof parsed.activeFilters === 'object') {
          setActiveFilters(parsed.activeFilters);
        }
        if (parsed.dateColumn) {
          setDateColumn(parsed.dateColumn);
        }
        if (typeof parsed.searchTerm === 'string') {
          setSearchTerm(parsed.searchTerm);
        }
        const key = getDatasetKey(datasetMeta);
        saveDatasetWorkspace(key, {
          kpiCards: parsed.kpiCards.length > 0 ? parsed.kpiCards : kpiCards,
          widgets: parsed.widgets.length > 0 ? parsed.widgets : widgets,
          activeFilters: parsed.activeFilters || activeFilters,
          dateColumn: parsed.dateColumn || dateColumn,
          searchTerm: parsed.searchTerm || ''
        });
        showToast(`✓ Custom dashboard view imported & applied!`, 'success');
      } catch (err) {
        console.error('Import error:', err);
        showToast(`Failed to import view: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreWorkspace = (pkg) => {
    if (!pkg) return;
    try {
      if (pkg.datasetMeta) {
        setDatasetMeta(pkg.datasetMeta);
      }
      if (Array.isArray(pkg.rawData) && pkg.rawData.length > 0) {
        setRawData(pkg.rawData);
        const profile = cleanAndProfileDataset(pkg.rawData, pkg.datasetMeta?.name || 'Restored Dataset');
        setColumns(pkg.columns && pkg.columns.length > 0 ? pkg.columns : profile.columns);
        setColumnProfiles(pkg.columnProfiles && Object.keys(pkg.columnProfiles).length > 0 ? pkg.columnProfiles : profile.columnProfiles);
        setDateColumn(pkg.dateColumn || profile.dateColumn || 'Date');
      }
      if (Array.isArray(pkg.kpiCards) && pkg.kpiCards.length > 0) {
        setKpiCards(pkg.kpiCards);
      }
      if (Array.isArray(pkg.widgets) && pkg.widgets.length > 0) {
        setWidgets(pkg.widgets);
      }
      if (pkg.branding) {
        setBranding(pkg.branding);
        saveBrandingConfig(pkg.branding);
      }
      if (Array.isArray(pkg.compoundRules)) {
        setCompoundRules(pkg.compoundRules);
      }
      if (pkg.compoundLogicOperator) {
        setCompoundLogicOperator(pkg.compoundLogicOperator);
      }
      if (pkg.activeFilters) {
        setActiveFilters(pkg.activeFilters);
      }
      if (pkg.searchTerm !== undefined) {
        setSearchTerm(pkg.searchTerm);
      }
      showToast('Workspace successfully restored from .omnidash package!', 'success');
    } catch (err) {
      showToast(`Error restoring workspace: ${err.message}`, 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Executive Navbar */}
      <Navbar
        currentDataset={datasetMeta}
        onSelectDataset={handleSelectSample}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenFormula={() => setIsFormulaOpen(true)}
        onOpenDataModeling={() => setIsDataModelingOpen(true)}
        onOpenProfiler={() => setIsProfilerOpen(true)}
        onToggleInsights={() => setIsInsightsOpen(!isInsightsOpen)}
        insightsCount={insights.length}
        onOpenPresentation={() => setIsPresentationOpen(true)}
        onToggleAiAnalyst={() => setIsAiAnalystOpen(!isAiAnalystOpen)}
        onOpenAiSettings={() => setIsAiSettingsOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'light' ? 'midnight' : 'light')}
        onSelectTheme={(t) => setTheme(t)}
        branding={branding}
        onOpenBranding={() => setIsBrandingOpen(true)}
        onExportPdf={handleExportPdf}
        onExportPng={handleExportPng}
        onExportExcel={handleExportExcel}
        onExportCsv={handleExportCsv}
        onExportAllChartsZip={handleExportAllChartsZip}
        onExportViewJson={handleExportViewJson}
        onOpenDriveSync={() => setIsDriveSyncOpen(true)}
        isDriveConnected={!!driveDirHandle}
        driveFolderName={driveFolderName}
        onSaveWorkspaceSnapshot={() => {
          downloadWorkspacePackage({
            datasetMeta,
            rawData,
            columns,
            columnProfiles,
            dateColumn,
            kpiCards,
            widgets,
            branding,
            compoundRules,
            compoundLogicOperator,
            searchTerm,
            activeFilters
          });
          showToast('Workspace snapshot downloaded (.omnidash)', 'success');
        }}
      />

      {/* Main Reporting Workspace Header & Tab Selector */}
      <div className="workspace-header" style={{
        margin: '0 20px 14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div className="workspace-title-section">
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            {datasetMeta?.name || 'Executive Business Intelligence'}
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {datasetMeta?.description || 'Interactive multi-dimensional metrics, complex formula transformations & visualization reporting.'}
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="workspace-tabs-container" style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'dashboard' ? '#6366f1' : 'transparent',
              color: activeTab === 'dashboard' ? '#ffffff' : (theme === 'light' ? '#000000' : 'var(--text-muted)'),
              border: 'none',
              gap: '6px',
              fontWeight: 700
            }}
          >
            <BarChart2 size={14} />
            <span>Dashboard Workspace</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingWidget(null);
              setIsWidgetBuilderOpen(true);
            }}
            className="btn btn-sm"
            style={{
              background: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(99, 102, 241, 0.12)',
              color: theme === 'light' ? '#000000' : '#a5b4fc',
              border: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.15)' : '1px solid rgba(99, 102, 241, 0.25)',
              gap: '6px',
              fontWeight: 700
            }}
            title="Create a new custom reporting visualization widget"
          >
            <PlusCircle size={14} color={theme === 'light' ? '#000000' : '#818cf8'} />
            <span>Add Reporting Widget</span>
          </button>
          <button
            onClick={() => setActiveTab('grid')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'grid' ? '#6366f1' : 'transparent',
              color: activeTab === 'grid' ? '#ffffff' : (theme === 'light' ? '#000000' : 'var(--text-muted)'),
              border: 'none',
              gap: '6px',
              fontWeight: 700
            }}
          >
            <Table size={14} />
            <span>Data Grid & Explorer</span>
          </button>
          <button
            onClick={() => setIsPresentationOpen(true)}
            className="btn btn-sm"
            style={{
              background: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(245, 158, 11, 0.15)',
              color: theme === 'light' ? '#000000' : '#fbbf24',
              border: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.15)' : '1px solid rgba(245, 158, 11, 0.3)',
              gap: '6px',
              fontWeight: 700
            }}
          >
            <Presentation size={14} color={theme === 'light' ? '#000000' : '#fbbf24'} />
            <span>Slide Deck Studio</span>
          </button>
          <button
            onClick={() => setIsAiAnalystOpen(true)}
            className="btn btn-sm"
            style={{
              background: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(16, 185, 129, 0.15)',
              color: theme === 'light' ? '#000000' : '#34d399',
              border: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.15)' : '1px solid rgba(16, 185, 129, 0.3)',
              gap: '6px',
              fontWeight: 700
            }}
          >
            <BarChart2 size={14} color={theme === 'light' ? '#000000' : '#34d399'} />
            <span>AI Analyst</span>
          </button>
        </div>
      </div>

      {/* Natural Language Query / Search Assistant Bar */}
      <SmartQueryBar
        columnProfiles={columnProfiles}
        onAddWidget={handleAddWidget}
      />

      {/* Global Interactive Filter Bar */}
      <GlobalFilterBar
        columns={columns}
        columnProfiles={columnProfiles}
        data={rawData}
        filteredData={filteredData}
        activeFilters={activeFilters}
        onFilterChange={(dim, val) => setActiveFilters(prev => ({ ...prev, [dim]: val }))}
        onResetFilters={() => {
          setActiveFilters({});
          setSearchTerm('');
          setCompoundRules([]);
        }}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeCompoundRules={compoundRules}
        activeLogicOperator={compoundLogicOperator}
        onOpenAdvancedFilter={() => setIsAdvancedFilterOpen(true)}
        onClearCompoundRules={() => setCompoundRules([])}
      />

      {/* Tab 1: Executive Dashboard View */}
      {activeTab === 'dashboard' && (
        <div id="dashboard-export-target">
          {/* Executive KPI Metric Cards */}
          <ExecutiveKpis
            data={filteredData}
            columnProfiles={columnProfiles}
            dateColumn={dateColumn}
            kpiCards={kpiCards}
            onSelectKpi={(card) => setSelectedKpiForDetail(card)}
            onOpenKpiManager={() => setIsKpiManagerOpen(true)}
            onRemoveKpi={(idx) => setKpiCards(prev => prev.filter((_, i) => i !== idx))}
            onResetLayout={handleResetDatasetLayout}
            onSaveView={handleManualSaveView}
            onExportView={handleExportViewJson}
            onImportView={handleImportViewJson}
          />

          {/* Customizable Widget Grid with Drag-and-Drop Reordering */}
          <DashboardGrid
            widgets={widgets}
            data={filteredData}
            theme={theme}
            onAddWidget={() => {
              setEditingWidget(null);
              setIsWidgetBuilderOpen(true);
            }}
            onEditWidget={(w) => {
              setEditingWidget(w);
              setIsWidgetBuilderOpen(true);
            }}
            onDuplicateWidget={handleDuplicateWidget}
            onDeleteWidget={handleDeleteWidget}
            onResizeWidget={handleResizeWidget}
            onReorderWidgets={handleReorderWidgets}
          />
        </div>
      )}

      {/* Tab 2: Tabular Data Grid View */}
      {activeTab === 'grid' && (
        <DataTableView
          data={filteredData}
          columns={columns}
          columnProfiles={columnProfiles}
          datasetName={datasetMeta?.name || 'Dataset'}
        />
      )}

      {/* Embedded Presentation Builder Studio Modal */}
      <PresentationStudio
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        datasetMeta={datasetMeta}
        data={filteredData}
        columnProfiles={columnProfiles}
        widgets={widgets}
        insights={insights}
        kpis={kpis}
        pendingAiSlide={pendingAiSlide}
        onClearPendingAiSlide={() => setPendingAiSlide(null)}
      />

      {/* Multi-Format File Ingestion Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDatasetLoaded={handleDatasetLoaded}
      />

      {/* Widget Builder Modal */}
      <WidgetBuilderModal
        isOpen={isWidgetBuilderOpen}
        onClose={() => {
          setIsWidgetBuilderOpen(false);
          setEditingWidget(null);
        }}
        onSave={handleSaveWidget}
        editingWidget={editingWidget}
        columnProfiles={columnProfiles}
      />

      {/* Calculated Field & Formula Engine Modal */}
      <FormulaEngineModal
        isOpen={isFormulaOpen}
        onClose={() => setIsFormulaOpen(false)}
        data={rawData}
        columns={columns}
        columnProfiles={columnProfiles}
        onFormulaAdded={handleFormulaAdded}
      />

      {/* Schema Profiler Modal */}
      <DataProfilerModal
        isOpen={isProfilerOpen}
        onClose={() => setIsProfilerOpen(false)}
        data={rawData}
        columns={columns}
        columnProfiles={columnProfiles}
        datasetName={datasetMeta?.name || 'Current Dataset'}
      />

      {/* Smart Insights Drawer */}
      <SmartInsightsDrawer
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        insights={insights}
        onApplyInsight={(item) => {
          handleAddWidget({
            id: `insight-widget-${Date.now()}`,
            title: item.title,
            chartType: item.type === 'dominance' ? 'donut' : 'bar',
            dimension: item.dimension || columns[0],
            measure: item.metric || columns[1],
            aggregation: 'SUM',
            width: 'half'
          });
        }}
      />

      {/* Local AI Engine Model Settings Modal */}
      <LocalAiModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
        onModelLoaded={() => {}}
      />

      {/* Local AI Business Analyst Drawer */}
      <AiAnalystDrawer
        isOpen={isAiAnalystOpen}
        onClose={() => setIsAiAnalystOpen(false)}
        datasetMeta={datasetMeta}
        columns={columns}
        columnProfiles={columnProfiles}
        kpis={kpis}
        insights={insights}
        filteredData={filteredData}
        onOpenModelSettings={() => setIsAiSettingsOpen(true)}
        onAddSlideWithAiAnalysis={(aiAnalysisText) => {
          setPendingAiSlide(aiAnalysisText);
          setIsPresentationOpen(true);
        }}
      />

      {/* Interactive KPI Deep-Dive Visualizer Modal */}
      <KpiDetailModal
        isOpen={!!selectedKpiForDetail}
        onClose={() => setSelectedKpiForDetail(null)}
        kpiConfig={selectedKpiForDetail}
        data={filteredData}
        columnProfiles={columnProfiles}
        dateColumn={dateColumn}
        theme={theme}
        onPinWidget={(newWidget) => handleAddWidget(newWidget)}
      />

      {/* KPI Customizer & Layout Manager Studio Modal */}
      <KpiManagerModal
        isOpen={isKpiManagerOpen}
        onClose={() => setIsKpiManagerOpen(false)}
        kpiCards={kpiCards}
        columnProfiles={columnProfiles}
        onSaveKpis={(newKpis) => setKpiCards(newKpis)}
      />

      {/* Relational Data Modeling & Joins / Buckets Studio */}
      <DataModelingModal
        isOpen={isDataModelingOpen}
        onClose={() => setIsDataModelingOpen(false)}
        activeDataset={{ data: rawData, columns, name: datasetMeta?.name }}
        onApplyMergedDataset={handleApplyMergedDataset}
        onApplyGroupedColumn={handleApplyGroupedColumn}
      />

      {/* Advanced Compound SQL-Like Filter Modal */}
      <AdvancedFilterModal
        isOpen={isAdvancedFilterOpen}
        onClose={() => setIsAdvancedFilterOpen(false)}
        data={rawData}
        columns={columns}
        columnProfiles={columnProfiles}
        activeCompoundRules={compoundRules}
        activeLogicOperator={compoundLogicOperator}
        onApplyRules={handleApplyCompoundRules}
      />

      {/* Brand Identity & Theme Presentation Studio Modal */}
      <BrandingModal
        isOpen={isBrandingOpen}
        onClose={() => setIsBrandingOpen(false)}
        branding={branding}
        onSaveBranding={handleSaveBranding}
        currentTheme={theme}
        onSelectTheme={(t) => setTheme(t)}
      />

      {/* Local Google Drive / OneDrive Sync & Backup Hub Modal */}
      <DriveSyncModal
        isOpen={isDriveSyncOpen}
        onClose={() => setIsDriveSyncOpen(false)}
        dirHandle={driveDirHandle}
        folderName={driveFolderName}
        onConnectFolder={(handle, name) => {
          setDriveDirHandle(handle);
          setDriveFolderName(name);
        }}
        onDisconnectFolder={() => {
          setDriveDirHandle(null);
          setDriveFolderName('');
        }}
        appState={{
          datasetMeta,
          rawData,
          columns,
          columnProfiles,
          dateColumn,
          kpiCards,
          widgets,
          branding,
          compoundRules,
          compoundLogicOperator,
          searchTerm,
          activeFilters
        }}
        onRestoreWorkspace={handleRestoreWorkspace}
        onLoadDatasetFile={(parsed) => {
          handleDatasetLoaded(parsed);
          showToast(`Loaded ${parsed.data?.length || 0} rows from Drive file`, 'success');
        }}
        showToast={showToast}
      />

      {/* Floating Status Notification Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(15, 23, 42, 0.94)',
            border: toast.type === 'error' ? '1px solid #ef4444' : '1px solid rgba(99, 102, 241, 0.45)',
            boxShadow: '0 12px 36px 0 rgba(0, 0, 0, 0.45), 0 0 15px -3px rgba(99, 102, 241, 0.3)',
            color: '#f8fafc',
            padding: '10px 18px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.84rem',
            fontWeight: 600,
            backdropFilter: 'blur(12px)',
            transition: 'all 0.3s ease'
          }}
        >
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}

function formatMetric(val, name = '', explicitFormat = null) {
  if (typeof val !== 'number') return String(val);
  const isPercent = explicitFormat === 'percent' || /pct|percent|rate|margin/i.test(name);
  const isCurrency = explicitFormat === 'currency' || (!explicitFormat && /revenue|cost|cogs|opex|capex|income|ebitda|mrr|arr|spend|profit|price/i.test(name));

  if (isPercent) return `${val.toFixed(1)}%`;

  let formatted = '';
  if (Math.abs(val) >= 1_000_000) {
    formatted = `${(val / 1_000_000).toFixed(2)}M`;
  } else if (Math.abs(val) >= 1_000) {
    formatted = `${(val / 1_000).toFixed(1)}K`;
  } else {
    formatted = val.toLocaleString();
  }

  return isCurrency ? `$${formatted}` : formatted;
}
