/**
 * IndexedDB Local Backup System for Nakamal Ecosystem.
 * Ensures robust data persistence by replicating localStorage structures using standard asynchronous transactions.
 */

const DB_NAME = 'NakamalBackupDB_v1';
const STORE_NAME = 'localStorageBackup';

interface BackupMeta {
  timestamp: number;
  keysCount: number;
  status: 'operational' | 'error';
}

/**
 * Initializes the IndexedDB instance.
 */
export function initIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.warn('[IndexedDB] Persistent storage not supported by environment');
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (e) => {
      console.error('[IndexedDB] Init failure:', e);
      reject(request.error);
    };
  });
}

/**
 * Saves a key-value pair asynchronously to IndexedDB.
 */
export function saveToIndexedDB(key: string, value: any): Promise<void> {
  return initIndexedDB()
    .then((db) => {
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    })
    .catch((err) => {
      console.warn(`[IndexedDB] Auto-save error for key "${key}":`, err);
    });
}

/**
 * Retrieves a key-value value from IndexedDB.
 */
export function getFromIndexedDB(key: string): Promise<any> {
  return initIndexedDB()
    .then((db) => {
      return new Promise<any>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    })
    .catch((err) => {
      console.warn(`[IndexedDB] Retrieval failure for key "${key}":`, err);
      return null;
    });
}

/**
 * Performs a complete replication of all critical localStorage modules to IndexedDB.
 */
export async function backupAllStorage(): Promise<BackupMeta> {
  const keys = ['users', 'bars', 'menus', 'comments', 'products', 'messages', 'barUpdates', 'currentUser'];
  let count = 0;

  try {
    for (const key of keys) {
      const valStr = localStorage.getItem(key);
      if (valStr !== null) {
        try {
          const parsed = JSON.parse(valStr);
          await saveToIndexedDB(key, parsed);
          count++;
        } catch (e) {
          console.warn(`[IndexedDB Sync] Skipped raw/invalid string for key: ${key}`);
        }
      }
    }

    const meta: BackupMeta = {
      timestamp: Date.now(),
      keysCount: count,
      status: 'operational'
    };

    await saveToIndexedDB('backup_metadata', meta);
    
    // Dispatch custom event to notify listeners
    window.dispatchEvent(new CustomEvent('indexeddb-sync', { detail: meta }));
    
    return meta;
  } catch (error) {
    console.error('[IndexedDB Sync] Failed backup pass:', error);
    return {
      timestamp: Date.now(),
      keysCount: count,
      status: 'error'
    };
  }
}

/**
 * Checks if local storage has any data, if not - checks IndexedDB for backup and recovers it.
 * Designed to handle browser refreshes or manual clears safely.
 */
export async function attemptAutoRecoveryOnStart(): Promise<{ recovered: boolean; keysCount: number }> {
  const keys = ['users', 'bars', 'menus', 'comments', 'products', 'messages', 'barUpdates', 'currentUser'];
  
  // Inspect if standard store is fully dry (defined as missing users or bars)
  const isLocalStorageDry = !localStorage.getItem('users') || !localStorage.getItem('bars');
  
  if (!isLocalStorageDry) {
    return { recovered: false, keysCount: 0 };
  }

  console.log('[IndexedDB Auto Recovery] Local state is blank. Initiating IndexedDB scan...');
  let recoveredAny = false;
  let count = 0;

  try {
    for (const key of keys) {
      const value = await getFromIndexedDB(key);
      if (value !== undefined && value !== null) {
        localStorage.setItem(key, JSON.stringify(value));
        recoveredAny = true;
        count++;
        console.log(`[IndexedDB Auto Recovery] Re-aligned store module: "${key}"`);
      }
    }

    if (recoveredAny) {
      console.log('[IndexedDB Auto Recovery] System recovery complete! Local storage re-synchronized.');
    }
    return { recovered: recoveredAny, keysCount: count };
  } catch (e) {
    console.error('[IndexedDB Auto Recovery] Critically failed parsing indexedDB values:', e);
    return { recovered: false, keysCount: 0 };
  }
}

/**
 * Forceful restoration of all tables from IndexedDB into local storage.
 */
export async function restoreAllFromBackup(): Promise<{ success: boolean; keysCount: number }> {
  const keys = ['users', 'bars', 'menus', 'comments', 'products', 'messages', 'barUpdates', 'currentUser'];
  let count = 0;
  try {
    for (const key of keys) {
      const val = await getFromIndexedDB(key);
      if (val !== undefined && val !== null) {
        localStorage.setItem(key, JSON.stringify(val));
        count++;
      }
    }
    return { success: count > 0, keysCount: count };
  } catch (err) {
    console.error('[IndexedDB Restoration Fail]', err);
    return { success: false, keysCount: 0 };
  }
}
