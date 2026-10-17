/**
 * Drive Sync & Workspace Storage Service
 * Connects OmniDash to Local Google Drive / OneDrive folders via File System Access API
 * Provides full .omnidash workspace backup, restore, and file picking capabilities
 */

const IDB_DRIVE_DB = 'OmniDash_Drive_Storage';
const IDB_STORE_HANDLES = 'handles';
const STORE_HANDLE_KEY = 'active_drive_dir_handle';
const LOCAL_STORAGE_FOLDER_NAME = 'omnidash_drive_folder_name';
const LOCAL_STORAGE_AUTOSYNC = 'omnidash_drive_autosync_enabled';

export const isFileSystemAccessSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

/**
 * Open IndexedDB for serializing and storing DirectoryHandle across sessions
 */
function openDriveDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) return resolve(null);
    try {
      const request = window.indexedDB.open(IDB_DRIVE_DB, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE_HANDLES)) {
          db.createObjectStore(IDB_STORE_HANDLES);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch (_) {
      resolve(null);
    }
  });
}

/**
 * Store directory handle in IndexedDB
 */
export async function saveStoredDirectoryHandle(dirHandle) {
  try {
    const db = await openDriveDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_HANDLES, 'readwrite');
      const store = tx.objectStore(IDB_STORE_HANDLES);
      store.put(dirHandle, STORE_HANDLE_KEY);
      tx.oncomplete = () => {
        try {
          localStorage.setItem(LOCAL_STORAGE_FOLDER_NAME, dirHandle.name);
        } catch (_) {}
        resolve(true);
      };
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('[DriveSyncService] Failed to persist directory handle:', err);
    return false;
  }
}

/**
 * Retrieve persisted directory handle from IndexedDB
 */
export async function getStoredDirectoryHandle() {
  try {
    const db = await openDriveDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_HANDLES, 'readonly');
      const store = tx.objectStore(IDB_STORE_HANDLES);
      const req = store.get(STORE_HANDLE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[DriveSyncService] Failed to read directory handle:', err);
    return null;
  }
}

/**
 * Remove stored directory handle from IndexedDB
 */
export async function clearStoredDirectoryHandle() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_FOLDER_NAME);
    localStorage.removeItem(LOCAL_STORAGE_AUTOSYNC);
    const db = await openDriveDB();
    if (!db) return;
    const tx = db.transaction(IDB_STORE_HANDLES, 'readwrite');
    tx.objectStore(IDB_STORE_HANDLES).delete(STORE_HANDLE_KEY);
  } catch (_) {}
}

/**
 * Check or request permission for a handle
 */
export async function verifyDirectoryPermission(dirHandle, readWrite = true) {
  if (!dirHandle) return false;
  const options = { mode: readWrite ? 'readwrite' : 'read' };
  try {
    if ((await dirHandle.queryPermission(options)) === 'granted') {
      return true;
    }
    if ((await dirHandle.requestPermission(options)) === 'granted') {
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

/**
 * Launch native browser folder picker to connect to Google Drive or OneDrive folder
 */
export async function connectDriveDirectory() {
  if (!isFileSystemAccessSupported) {
    throw new Error('Your browser does not support folder synchronization. Please use Google Chrome, Microsoft Edge, or Brave.');
  }

  const dirHandle = await window.showDirectoryPicker({
    id: 'omnidash_workspace_drive',
    mode: 'readwrite',
    startIn: 'documents'
  });

  const hasPermission = await verifyDirectoryPermission(dirHandle, true);
  if (!hasPermission) {
    throw new Error('Access permission to the selected folder was not granted.');
  }

  await saveStoredDirectoryHandle(dirHandle);
  return {
    dirHandle,
    folderName: dirHandle.name
  };
}

/**
 * Scans and lists data files and workspaces in the connected directory
 */
export async function listDriveFiles(dirHandle) {
  if (!dirHandle) return [];
  const files = [];

  try {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const ext = entry.name.split('.').pop()?.toLowerCase();
        if (['csv', 'xlsx', 'xls', 'json', 'pdf', 'omnidash', 'pptx'].includes(ext)) {
          try {
            const file = await entry.getFile();
            files.push({
              name: entry.name,
              size: file.size,
              lastModified: file.lastModified,
              handle: entry,
              type: ext,
              formattedSize: formatFileSize(file.size),
              formattedDate: new Date(file.lastModified).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            });
          } catch (_) {
            // Permission or locked file, skip
          }
        }
      }
    }
  } catch (err) {
    console.warn('[DriveSyncService] Error scanning drive files:', err);
  }

  // Sort: .omnidash workspaces first, then newest files
  files.sort((a, b) => {
    if (a.type === 'omnidash' && b.type !== 'omnidash') return -1;
    if (b.type === 'omnidash' && a.type !== 'omnidash') return 1;
    return b.lastModified - a.lastModified;
  });

  return files;
}

/**
 * Read File object from a FileSystemFileHandle
 */
export async function readDriveFile(fileHandle) {
  if (!fileHandle) throw new Error('Invalid file handle.');
  return await fileHandle.getFile();
}

/**
 * Write a file directly into the connected drive folder
 */
export async function writeDriveFile(dirHandle, fileName, contentBlobOrText) {
  if (!dirHandle) throw new Error('No drive directory connected.');
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(contentBlobOrText);
  await writable.close();
  return true;
}

/**
 * Creates a complete .omnidash workspace archive payload
 */
export function buildWorkspacePackage(state) {
  return {
    format: 'omnidash_workspace',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    datasetMeta: state.datasetMeta || null,
    rawData: state.rawData || [],
    columns: state.columns || [],
    columnProfiles: state.columnProfiles || {},
    dateColumn: state.dateColumn || 'Date',
    kpiCards: state.kpiCards || [],
    widgets: state.widgets || [],
    branding: state.branding || null,
    brandTemplate: state.brandTemplate || null,
    compoundRules: state.compoundRules || [],
    compoundLogicOperator: state.compoundLogicOperator || 'AND',
    searchTerm: state.searchTerm || '',
    activeFilters: state.activeFilters || {},
    presentationSlides: state.presentationSlides || []
  };
}

/**
 * Saves current workspace as a .omnidash package in the connected drive folder
 */
export async function saveWorkspaceToDrive(dirHandle, state, fileNameOverride = null) {
  const pkg = buildWorkspacePackage(state);
  const jsonStr = JSON.stringify(pkg, null, 2);
  const dsName = (state.datasetMeta?.name || 'Workspace').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = fileNameOverride || `${dsName}_Backup_${new Date().toISOString().slice(0, 10)}.omnidash`;
  
  await writeDriveFile(dirHandle, fileName, jsonStr);
  return fileName;
}

/**
 * Download workspace package directly via browser download (Fallback)
 */
export function downloadWorkspacePackage(state, customName = null) {
  const pkg = buildWorkspacePackage(state);
  const jsonStr = JSON.stringify(pkg, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const dsName = (state.datasetMeta?.name || 'OmniDash_Workspace').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = customName || `${dsName}_Backup_${new Date().toISOString().slice(0, 10)}.omnidash`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Parses and validates an uploaded or read .omnidash file content
 */
export function parseWorkspacePackage(rawContent) {
  let data = rawContent;
  if (typeof rawContent === 'string') {
    try {
      data = JSON.parse(rawContent);
    } catch (_) {
      throw new Error('Corrupt workspace file: invalid JSON format.');
    }
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid workspace package: file is empty.');
  }

  if (data.format !== 'omnidash_workspace') {
    // If it's a legacy JSON exported view, handle gracefully
    if (Array.isArray(data.widgets) || Array.isArray(data.kpiCards)) {
      return {
        isLegacyView: true,
        ...data
      };
    }
    throw new Error('Unrecognized file format. Please select a valid .omnidash backup file.');
  }

  return data;
}

/**
 * Auto-sync state storage
 */
export function getAutoSyncPreference() {
  try {
    return localStorage.getItem(LOCAL_STORAGE_AUTOSYNC) === 'true';
  } catch (_) {
    return false;
  }
}

export function setAutoSyncPreference(enabled) {
  try {
    localStorage.setItem(LOCAL_STORAGE_AUTOSYNC, enabled ? 'true' : 'false');
  } catch (_) {}
}

export function getCachedFolderName() {
  try {
    return localStorage.getItem(LOCAL_STORAGE_FOLDER_NAME) || '';
  } catch (_) {
    return '';
  }
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
