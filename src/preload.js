const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('electronAPI', {
    openFile: (tags) => ipcRenderer.invoke('dialog:openFile', {
        filters: [
          { name: 'Videos', extensions: ['mkv', 'avi', 'mp4'] },
        ],
        tags: tags
      }),
    uploadFile: (file) => ipcRenderer.invoke('uploadFile', file),
});