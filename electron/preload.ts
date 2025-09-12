import { contextBridge, ipcRenderer } from 'electron'

// Define the API that will be exposed to the renderer process
const electronAPI = {
  // Search functionality
  searchSongs: (query: string, page: number, instrument?: string, difficulty?: string) =>
    ipcRenderer.invoke('search-songs', query, page, instrument, difficulty),

  // Download functionality
  downloadSong: (songData: any, format: 'zip' | 'sng', downloadPath: string) =>
    ipcRenderer.invoke('download-song', songData, format, downloadPath),

  // File system operations
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  openDirectory: (path: string) => ipcRenderer.invoke('open-directory', path),

  // Clone Hero settings
  getCloneHeroSettings: () => ipcRenderer.invoke('get-clone-hero-settings'),

  // User settings
  saveUserSettings: (settings: any) => ipcRenderer.invoke('save-user-settings', settings),
  getUserSettings: () => ipcRenderer.invoke('get-user-settings'),
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type definitions for the renderer process
export type ElectronAPI = typeof electronAPI
