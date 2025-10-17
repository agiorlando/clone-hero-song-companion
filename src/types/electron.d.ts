export interface ElectronAPI {
  searchSongs: (query: string, page: number, instrument?: string, difficulty?: string) => Promise<SearchResponse>
  downloadSong: (songData: DownloadSongData, format: 'zip' | 'sng', downloadPath: string) => Promise<{ success: boolean; path: string }>
  selectDirectory: () => Promise<string | null>
  openDirectory: (path: string) => Promise<void>
  getCloneHeroSettings: () => Promise<{ settingsPath: string; songDirectories: string[] } | null>
  saveUserSettings: (settings: any) => Promise<any>
  getUserSettings: () => Promise<any>
  toggleOverlay: () => Promise<boolean>
  hideOverlay: () => Promise<boolean>
  focusMainWindow: () => Promise<boolean>
}

export interface DownloadSongData {
  md5: string
  name: string
  artist: string
  charter: string
}

export interface SearchResponse {
  found: number
  out_of: number
  page: number
  search_time_ms: number
  data: Song[]
}

export interface Song {
  chartId: number
  name: string
  artist: string
  album: string
  genre: string
  year: string
  charter: string
  song_length: number
  diff_guitar: number
  diff_bass: number
  diff_drums: number
  diff_keys: number
  diff_vocals: number
  md5: string
  albumArtMd5: string
  notesData: {
    instruments: string[]
    hasLyrics: boolean
    hasVocals: boolean
    noteCounts: Array<{
      instrument: string
      difficulty: string
      count: number
    }>
    maxNps: Array<{
      instrument: string
      difficulty: string
      nps: number
      time: number
    }>
  }
  driveFileId: string | null
  driveFileName: string | null
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
