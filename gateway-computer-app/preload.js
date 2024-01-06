const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  otworzPlikKonfiguracyjny: () => ipcRenderer.invoke('dialog:otworzPlikKonfiguracyjny')
})
