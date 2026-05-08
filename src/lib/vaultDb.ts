import { ChatData } from '../App';

const VAULT_DB = 'VaultDB';
const VAULT_STORE = 'conversations';

export const vaultDbTools = {
  async init() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(VAULT_DB, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(VAULT_STORE)) {
          request.result.createObjectStore(VAULT_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async getItems() {
    const db = await this.init();
    return new Promise<{id: string, date: number, data: ChatData}[]>((resolve, reject) => {
      const transaction = db.transaction(VAULT_STORE, 'readonly');
      const store = transaction.objectStore(VAULT_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async saveItem(item: {id: string, date: number, data: ChatData}) {
    const db = await this.init();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(VAULT_STORE, 'readwrite');
      const store = transaction.objectStore(VAULT_STORE);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  async deleteItem(id: string) {
    const db = await this.init();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(VAULT_STORE, 'readwrite');
      const store = transaction.objectStore(VAULT_STORE);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};
