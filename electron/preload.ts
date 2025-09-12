import { contextBridge, ipcRenderer } from 'electron'

// Define the API that will be exposed to the renderer process
const electronAPI = {
  // Search functionality
  searchSongs: (query: string, instrument?: string, difficulty?: string) =>
    ipcRenderer.invoke('search-songs', query, instrument, difficulty),

  // Download functionality
  downloadSong: (songUrl: string, format: 'zip' | 'sng', downloadPath: string, songName: string) =>
    ipcRenderer.invoke('download-song', songUrl, format, downloadPath, songName),

  // File system operations
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  openDirectory: (path: string) => ipcRenderer.invoke('open-directory', path),

  // Clone Hero settings
  getCloneHeroSettings: () => ipcRenderer.invoke('get-clone-hero-settings'),
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type definitions for the renderer process
export type ElectronAPI = typeof electronAPI
