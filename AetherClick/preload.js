const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  quit: () => ipcRenderer.send('app-quit'),
  toggleMaximize: () => ipcRenderer.invoke('window-toggle-maximize'),
  togglePin: () => ipcRenderer.invoke('window-toggle-pin'),
  isPinned: () => ipcRenderer.invoke('window-is-pinned'),
  showNotification: (title, message) => ipcRenderer.send('show-notification', { title, message }),
  openExternal: (url) => ipcRenderer.send('open-external', url)
});
