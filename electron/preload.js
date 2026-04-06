const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  onNewTab: (cb) => ipcRenderer.on('new-tab', cb),
  onCloseTab: (cb) => ipcRenderer.on('close-tab', cb),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
