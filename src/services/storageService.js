// Workspace and dataset configuration persistence service using browser localStorage
// Ensures that customized KPI cards, custom widgets, calculation modifiers, filters,
// and custom datasets persist across page refreshes and browser sessions.

const STORAGE_PREFIX = 'omnidash_';

export function getDatasetKey(datasetMeta) {
  if (!datasetMeta) return 'financials';
  if (datasetMeta.id) {
    return String(datasetMeta.id).trim().toLowerCase();
  }
  if (datasetMeta.name) {
    return 'ds_' + String(datasetMeta.name).toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
  return 'financials';
}

/**
 * Save customized setup for a specific dataset (KPIs, widgets, filters, dateColumn)
 */
export function saveDatasetWorkspace(datasetKey, workspaceConfig) {
  if (!datasetKey) return false;
  try {
    const payload = {
      ...workspaceConfig,
      lastSaved: Date.now()
    };
    localStorage.setItem(`${STORAGE_PREFIX}workspace_${datasetKey}`, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.warn(`[StorageService] Failed to save workspace for ${datasetKey}:`, error);
    return false;
  }
}

/**
 * Load customized setup for a specific dataset
 */
export function loadDatasetWorkspace(datasetKey) {
  if (!datasetKey) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}workspace_${datasetKey}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`[StorageService] Failed to load workspace for ${datasetKey}:`, error);
    return null;
  }
}

/**
 * Clear custom setup for a specific dataset (reset to defaults)
 */
export function clearDatasetWorkspace(datasetKey) {
  if (!datasetKey) return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}workspace_${datasetKey}`);
  } catch (error) {
    console.warn(`[StorageService] Failed to clear workspace for ${datasetKey}:`, error);
  }
}

// =========================================================================
// IndexedDB Engine for High-Capacity Structured Dataset Storage
// Bypasses the 5MB browser localStorage quota to handle large CSV/Excel files
// =========================================================================

const IDB_NAME = 'OmniDash_BI_Storage';
const IDB_VERSION = 1;
const IDB_STORE_DATASETS = 'custom_datasets';
const IDB_STORE_WORKSPACES = 'workspaces';

function openDatabase() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE_DATASETS)) {
          db.createObjectStore(IDB_STORE_DATASETS, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(IDB_STORE_WORKSPACES)) {
          db.createObjectStore(IDB_STORE_WORKSPACES, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('[StorageService] IndexedDB open error, operating in fallback mode.');
        resolve(null);
      };
    } catch (err) {
      console.warn('[StorageService] IndexedDB unavailable:', err);
      resolve(null);
    }
  });
}

export async function saveCustomDatasetIndexedDB(key, payload) {
  try {
    const db = await openDatabase();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_DATASETS, 'readwrite');
      const store = tx.objectStore(IDB_STORE_DATASETS);
      store.put({ key, ...payload });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('[StorageService] IndexedDB save failed:', err);
    return false;
  }
}

export async function loadCustomDatasetIndexedDB(key) {
  try {
    const db = await openDatabase();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_DATASETS, 'readonly');
      const store = tx.objectStore(IDB_STORE_DATASETS);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[StorageService] IndexedDB load failed:', err);
    return null;
  }
}

export async function deleteCustomDatasetIndexedDB(key) {
  try {
    const db = await openDatabase();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_DATASETS, 'readwrite');
      const store = tx.objectStore(IDB_STORE_DATASETS);
      store.delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}

/**
 * Save active dataset pointer and cache uploaded datasets in IndexedDB + localStorage
 */
export function saveActiveDatasetSession(datasetMeta, rawData) {
  if (!datasetMeta) return;
  try {
    const datasetKey = getDatasetKey(datasetMeta);
    localStorage.setItem(`${STORAGE_PREFIX}active_dataset_id`, datasetKey);

    const isSample = ['financials', 'saas', 'logistics'].includes(datasetKey);
    if (!isSample && rawData && Array.isArray(rawData)) {
      const customPayload = {
        meta: datasetMeta,
        data: rawData,
        savedAt: Date.now()
      };

      // 1. Primary High-Capacity Storage: IndexedDB (handles large datasets with no 5MB quota)
      saveCustomDatasetIndexedDB(datasetKey, customPayload);

      // 2. Secondary Fast Cache: localStorage (only for small datasets under 1,500 rows)
      if (rawData.length <= 1500) {
        try {
          localStorage.setItem(`${STORAGE_PREFIX}custom_ds_${datasetKey}`, JSON.stringify(customPayload));
        } catch (_) {
          // Handled gracefully: IndexedDB has already persisted the full dataset
        }
      } else {
        // Clean up small cache if dataset grew large
        try {
          localStorage.removeItem(`${STORAGE_PREFIX}custom_ds_${datasetKey}`);
        } catch (_) {}
      }
    }
  } catch (error) {
    console.warn('[StorageService] Failed to save active dataset pointer:', error);
  }
}

/**
 * Synchronous load of active dataset session (for instant initial render)
 */
export function loadActiveDatasetSession(sampleDatasets) {
  try {
    const activeId = localStorage.getItem(`${STORAGE_PREFIX}active_dataset_id`);
    if (!activeId) return null;

    if (sampleDatasets && sampleDatasets[activeId]) {
      return {
        meta: sampleDatasets[activeId],
        data: sampleDatasets[activeId].data,
        isCustom: false
      };
    }

    // Check if small custom dataset was cached in localStorage
    const customRaw = localStorage.getItem(`${STORAGE_PREFIX}custom_ds_${activeId}`);
    if (customRaw) {
      const customPayload = JSON.parse(customRaw);
      if (customPayload && customPayload.meta && customPayload.data) {
        return {
          meta: customPayload.meta,
          data: customPayload.data,
          isCustom: true
        };
      }
    }
  } catch (error) {
    console.warn('[StorageService] Error reading active dataset session:', error);
  }
  return null;
}

/**
 * Asynchronous load of active dataset session (queries IndexedDB for large datasets)
 */
export async function loadActiveDatasetSessionAsync(sampleDatasets) {
  // First try synchronous cache
  const syncSession = loadActiveDatasetSession(sampleDatasets);
  if (syncSession) return syncSession;

  try {
    const activeId = localStorage.getItem(`${STORAGE_PREFIX}active_dataset_id`);
    if (!activeId) return null;

    const idbRecord = await loadCustomDatasetIndexedDB(activeId);
    if (idbRecord && idbRecord.meta && idbRecord.data) {
      return {
        meta: idbRecord.meta,
        data: idbRecord.data,
        isCustom: true
      };
    }
  } catch (err) {
    console.warn('[StorageService] Error loading dataset from IndexedDB:', err);
  }
  return null;
}

export function saveAppTheme(theme) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}theme`, theme);
  } catch (e) {}
}

export function loadAppTheme() {
  try {
    const t = localStorage.getItem(`${STORAGE_PREFIX}theme`);
    return t || 'midnight';
  } catch (e) {
    return 'midnight';
  }
}

export function saveBrandingConfig(branding) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}branding`, JSON.stringify(branding));
  } catch (e) {}
}

export function loadBrandingConfig() {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}branding`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Export customized workspace setup as a JSON file download
 */
export function exportWorkspaceJson(datasetMeta, workspaceConfig) {
  try {
    const datasetKey = getDatasetKey(datasetMeta);
    const exportData = {
      app: 'OmniDash.BI',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      datasetKey,
      datasetName: datasetMeta?.name || 'Dataset',
      config: {
        kpiCards: workspaceConfig.kpiCards || [],
        widgets: workspaceConfig.widgets || [],
        activeFilters: workspaceConfig.activeFilters || {},
        dateColumn: workspaceConfig.dateColumn || null,
        searchTerm: workspaceConfig.searchTerm || ''
      }
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanName = (datasetMeta?.name || 'Dashboard').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `OmniDash_${cleanName}_ViewConfig.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('[StorageService] Error exporting workspace JSON:', error);
    return false;
  }
}

/**
 * Validate and parse an imported workspace JSON configuration
 */
export function parseWorkspaceJson(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    const config = data.config || data;
    if (!config || (!config.kpiCards && !config.widgets)) {
      throw new Error('Invalid OmniDash View configuration file format. Missing kpiCards or widgets.');
    }
    return {
      kpiCards: Array.isArray(config.kpiCards) ? config.kpiCards : [],
      widgets: Array.isArray(config.widgets) ? config.widgets : [],
      activeFilters: config.activeFilters && typeof config.activeFilters === 'object' ? config.activeFilters : {},
      dateColumn: config.dateColumn || null,
      searchTerm: config.searchTerm || '',
      datasetKey: data.datasetKey || null,
      datasetName: data.datasetName || null
    };
  } catch (error) {
    throw new Error(error.message || 'Failed to parse JSON file.');
  }
}


