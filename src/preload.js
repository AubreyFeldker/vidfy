const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('electronAPI', {
    openFile: (tags) => ipcRenderer.invoke('dialog:openFile', {
        filters: [
          { name: 'Videos', extensions: ['mp4'] },
        ],
        tags: tags
      }),
    uploadFile: (file) => ipcRenderer.invoke('uploadFile', file),
    search: (tags) => ipcRenderer.invoke('search', {tags: tags}),
});