export interface ElectronAPI {
  searchSongs: (query: string, instrument?: string, difficulty?: string) => Promise<Song[]>
  downloadSong: (songUrl: string, format: 'zip' | 'sng', downloadPath: string, songName: string) => Promise<{ success: boolean; path: string }>
  selectDirectory: () => Promise<string | null>
  openDirectory: (path: string) => Promise<void>
  getCloneHeroSettings: () => Promise<{ settingsPath: string; songDirectories: string[] } | null>
}

export interface Song {
  id: string
  title: string
  artist: string
  difficulty: string
  instrument: string
  downloadUrl: string
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
