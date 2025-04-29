const { contextBridge, ipcRenderer } = require('electron');

// Renderer process için güvenli bir API tanımla
contextBridge.exposeInMainWorld('electronAPI', {
  // Dosya işlemleri
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  openFile: (data) => ipcRenderer.invoke('open-file', data),
  openExcelFile: (data) => ipcRenderer.invoke('open-excel-file', data),
  
  // Uygulama bilgileri
  getAppVersion: () => process.env.npm_package_version,
  getPlatform: () => process.platform
});
