const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('media', {
  playPause: () => ipcRenderer.send('media-play-pause'),
  next: () => ipcRenderer.send('media-next'),
  previous: () => ipcRenderer.send('media-previous')
})
