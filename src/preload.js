const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('electronAPI', {
    openFile: () => ipcRenderer.invoke('dialog:openFile', {
        filters: [
          { name: 'Videos', extensions: ['mkv', 'avi', 'mp4'] },
        ]
      }),
    makeRequest: (req) => ipcRenderer.invoke('makeRequest', req)
});