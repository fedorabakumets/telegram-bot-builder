const { contextBridge, ipcRenderer } = require('electron');

// Экспортируем защищённый API для рендерера
contextBridge.exposeInMainWorld('electronAPI', {
  // Конфигурация
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),

  // Диалоги
  selectFile: (options) => ipcRenderer.invoke('select-file', options),
  saveFile: (options) => ipcRenderer.invoke('save-file', options),

  // Платформа
  platform: process.platform,
  isElectron: true,
  
  // API URL для Electron (Railway)
  apiUrl: 'https://web-production-19c3c.up.railway.app',
});
