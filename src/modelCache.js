// src/modelCache.js
// Utility for caching ONNX model in IndexedDB and loading from cache if available

const DB_NAME = 'maize-onnx-cache';
const STORE_NAME = 'models';
const MODEL_KEY = 'maize_vit_model.onnx';

export async function saveModelToIndexedDB(arrayBuffer) {
  return new Promise((resolve, reject) => {
    const openReq = indexedDB.open(DB_NAME, 1);
    openReq.onupgradeneeded = () => {
      openReq.result.createObjectStore(STORE_NAME);
    };
    openReq.onsuccess = () => {
      const db = openReq.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(arrayBuffer, MODEL_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = reject;
    };
    openReq.onerror = reject;
  });
}

export async function loadModelFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const openReq = indexedDB.open(DB_NAME, 1);
    openReq.onupgradeneeded = () => {
      openReq.result.createObjectStore(STORE_NAME);
    };
    openReq.onsuccess = () => {
      const db = openReq.result;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const getReq = tx.objectStore(STORE_NAME).get(MODEL_KEY);
      getReq.onsuccess = () => {
        db.close();
        resolve(getReq.result);
      };
      getReq.onerror = reject;
    };
    openReq.onerror = reject;
  });
}
