<template>
  <div class="app">
    <!-- Fixed Header -->
    <header class="fixed-header drag-region">
      <h1>Clone Hero Song Companion</h1>
      <button @click="showSettings = !showSettings" class="settings-btn no-drag">
        ⚙️ Settings
      </button>
    </header>

    <!-- Main Content with proper spacing for fixed header/footer -->
    <main class="main-content">
      <!-- Settings Panel -->
      <div v-if="showSettings" class="settings-panel">
        <h2>Settings</h2>
        <div class="setting-group">
          <label>Download Directory:</label>
          <div class="directory-input">
            <input 
              v-model="downloadDirectory" 
              type="text" 
              placeholder="Select your Clone Hero songs directory"
              readonly
            />
            <button @click="selectDirectory" class="select-btn">Browse</button>
          </div>
          <p class="help-text">
            This is where downloaded songs will be saved. We'll try to auto-detect your Clone Hero directory.
          </p>
        </div>
      </div>

      <!-- Search Section -->
      <div v-else class="search-section">
        <div class="search-form">
          <div class="search-row">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search for songs..."
              class="search-input"
              @keyup.enter="searchSongs"
            />
            <button @click="searchSongs" class="search-btn" :disabled="loading">
              {{ loading ? 'Searching...' : 'Search' }}
            </button>
          </div>
          
          <div class="filters">
            <select v-model="selectedInstrument" @change="onFiltersChange" class="filter-select">
              <option value="">All Instruments</option>
              <option value="guitar">Guitar</option>
              <option value="bass">Bass</option>
              <option value="drums">Drums</option>
              <option value="vocals">Vocals</option>
              <option value="keys">Keys</option>
            </select>
            
            <select v-model="selectedDifficulty" @change="onFiltersChange" class="filter-select">
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        <!-- Results Section -->
        <div v-if="searchResults.length > 0" class="results-section">
          <div class="results-header">
            <h2>Search Results ({{ searchResults.length }} of {{ totalFound }})</h2>
          </div>

          <div class="songs-list">
            <div 
              v-for="song in searchResults" 
              :key="song.chartId"
              class="song-card"
              :class="{ 
                selected: selectedSongs.value.includes(song.chartId),
                'no-download': !song.md5
              }"
              @click="handleSongRowClick(song)"
            >
              <div class="song-album-art">
                <img 
                  v-if="song.albumArtMd5" 
                  :src="`https://files.enchor.us/${song.albumArtMd5}.jpg`" 
                  :alt="`${song.album} album art`"
                  class="album-art-image"
                  @error="$event.target.style.display = 'none'"
                />
                <div v-else class="album-art-placeholder">🎵</div>
              </div>
              
              <div class="song-info">
                <h3 class="song-title">{{ song.name }}</h3>
                <p class="song-artist">{{ song.artist }}</p>
                <p class="song-album">{{ song.album }} ({{ song.year }})</p>
                <p class="song-charter">Charted by: {{ song.charter }}</p>
                <p class="song-duration">{{ formatDuration(song.song_length) }}</p>
                
                <div class="song-difficulties">
                  <span 
                    v-for="diff in getInstrumentDifficulties(song)" 
                    :key="`${diff.instrument}-${diff.difficulty}`"
                    class="difficulty-badge"
                  >
                    {{ diff.instrument }}: {{ diff.difficulty }}
                  </span>
                </div>
                
                <div v-if="!song.md5" class="no-download-notice">
                  ⚠️ No download available
                </div>
              </div>
              
              <div class="song-actions">
                <input 
                  type="checkbox" 
                  :checked="selectedSongs.value.includes(song.chartId)"
                  @change="toggleSongSelection(song.chartId)"
                  @click.stop
                  :disabled="!song.md5"
                  class="song-checkbox"
                />
                <button 
                  @click.stop="downloadSingle(song)" 
                  class="download-btn"
                  :disabled="downloading || !song.md5"
                  :title="song.md5 ? 'Download song' : 'Not available for download'"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Load More Button -->
          <div v-if="hasMorePages && searchResults.length > 0" class="load-more-section">
            <button 
              @click="loadMoreSongs" 
              :disabled="loadingMore || loading"
              class="load-more-btn"
            >
              {{ loadingMore ? 'Loading...' : 'Load More Songs' }}
            </button>
          </div>
        </div>

        <!-- No Results -->
        <div v-else-if="hasSearched && !loading" class="no-results">
          <p>No songs found. Try different search terms or filters.</p>
        </div>

        <!-- Welcome Message -->
        <div v-else-if="!hasSearched" class="welcome">
          <h2>Welcome to Clone Hero Song Companion!</h2>
          <p>Search for songs from enchor.us and download them directly to your Clone Hero directory.</p>
          <ul>
            <li>🎸 Search by instrument and difficulty</li>
            <li>📦 Download as .zip or .sng format</li>
            <li>📁 Automatically extract to your songs folder</li>
            <li>⚡ Bulk download multiple songs</li>
          </ul>
        </div>
      </div>
    </main>

    <!-- Fixed Bottom Footer -->
    <footer v-if="!showSettings && searchResults.length > 0" class="fixed-footer">
      <div class="footer-content">
        <div class="format-selection">
          <label>Format:</label>
          <select v-model="downloadFormat" class="format-select">
            <option value="zip">.zip (recommended)</option>
            <option value="sng">.sng</option>
          </select>
        </div>
        
        <div class="selection-info">
          {{ selectedSongs.size }} songs selected
        </div>
        
        <div class="footer-actions">
          <button 
            @click="selectAll" 
            class="select-all-btn"
            :disabled="selectedSongs.size === searchResults.length"
          >
            Select All
          </button>
          <button 
            @click="clearSelection" 
            class="clear-btn"
            :disabled="selectedSongs.size === 0"
          >
            Clear
          </button>
          <button 
            @click="downloadSelected" 
            class="download-selected-btn"
            :disabled="selectedSongs.size === 0 || downloading"
          >
            {{ downloading ? 'Downloading...' : `Download ${selectedSongs.size} Songs` }}
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import type { Song, SearchResponse } from './types/electron'

// Helper functions
const getDifficultyName = (diffValue: number): string => {
  if (diffValue === -1) return 'N/A'
  const difficulties = ['Easy', 'Medium', 'Hard', 'Expert', 'Expert+']
  return difficulties[diffValue] || 'Unknown'
}

const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const getInstrumentDifficulties = (song: Song): Array<{instrument: string, difficulty: string}> => {
  const difficulties = []
  if (song.diff_guitar > -1) difficulties.push({ instrument: 'Guitar', difficulty: getDifficultyName(song.diff_guitar) })
  if (song.diff_bass > -1) difficulties.push({ instrument: 'Bass', difficulty: getDifficultyName(song.diff_bass) })
  if (song.diff_drums > -1) difficulties.push({ instrument: 'Drums', difficulty: getDifficultyName(song.diff_drums) })
  if (song.diff_keys > -1) difficulties.push({ instrument: 'Keys', difficulty: getDifficultyName(song.diff_keys) })
  if (song.diff_vocals > -1) difficulties.push({ instrument: 'Vocals', difficulty: getDifficultyName(song.diff_vocals) })
  return difficulties
}

// Reactive state
const showSettings = ref(false)
const downloadDirectory = ref('')
const searchQuery = ref('')
const selectedInstrument = ref('')
const selectedDifficulty = ref('')
const downloadFormat = ref<'zip' | 'sng'>('zip')
const searchResults = ref<Song[]>([])
const selectedSongs = ref<number[]>([])
const loading = ref(false)
const downloading = ref(false)
const hasSearched = ref(false)
const currentPage = ref(1)
const totalFound = ref(0)
const totalSongs = ref(0)
const hasMorePages = ref(false)
const loadingMore = ref(false)

// Methods
const selectDirectory = async () => {
  try {
    const directory = await window.electronAPI.selectDirectory()
    if (directory) {
      downloadDirectory.value = directory
    }
  } catch (error) {
    console.error('Error selecting directory:', error)
  }
}

const searchSongs = async (loadMore: boolean = false) => {
  if (!searchQuery.value.trim()) return
  
  if (loadMore) {
    loadingMore.value = true
  } else {
    // Reset everything for a new search
    loading.value = true
    hasSearched.value = true
    currentPage.value = 0 // Will be set to 1 when we make the request
    
    // Force clear the results array
    searchResults.value.length = 0
    selectedSongs.value.length = 0
    
    totalFound.value = 0
    totalSongs.value = 0
    hasMorePages.value = true // Start as true, will be updated after search
    
    // Force a DOM update
    await nextTick()
  }
  
  const pageToRequest = loadMore ? currentPage.value + 1 : 1
  
  try {
    const response: SearchResponse = await window.electronAPI.searchSongs(
      searchQuery.value,
      pageToRequest,
      selectedInstrument.value || undefined,
      selectedDifficulty.value || undefined
    )
    
    if (loadMore) {
      // Append new results to existing ones
      searchResults.value = [...searchResults.value, ...response.data]
    } else {
      // Replace results for new search
      searchResults.value = response.data
    }
    
    currentPage.value = response.page
    totalFound.value = response.found
    totalSongs.value = response.out_of
    
    // Check if there are more pages
    hasMorePages.value = searchResults.value.length < totalFound.value
    
  } catch (error) {
    console.error('Search error:', error)
    alert('Search failed. Please try again.')
    // Reset state on error
    if (!loadMore) {
      searchResults.value = []
      hasSearched.value = false
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const toggleSongSelection = (songId: number) => {
  const index = selectedSongs.value.indexOf(songId)
  if (index > -1) {
    selectedSongs.value.splice(index, 1)
  } else {
    selectedSongs.value.push(songId)
  }
}

const handleSongRowClick = (song: Song) => {
  // Only allow selection if the song is downloadable
  if (!song.md5) return
  
  // Toggle selection when clicking anywhere on the row (except download button/checkbox)
  toggleSongSelection(song.chartId)
}

const downloadSingle = async (song: Song) => {
  if (!downloadDirectory.value) {
    alert('Please select a download directory in settings first.')
    return
  }
  
  if (!song.md5) {
    alert('This song is not available for download.')
    return
  }
  
  downloading.value = true
  try {
    // Only pass the necessary data to avoid IPC cloning issues
    const songData = {
      md5: song.md5,
      name: song.name,
      artist: song.artist,
      charter: song.charter
    }
    
    await window.electronAPI.downloadSong(
      songData,
      downloadFormat.value,
      downloadDirectory.value
    )
    alert(`Downloaded: ${song.name} by ${song.artist}`)
  } catch (error) {
    console.error('Download error:', error)
    alert('Download failed. Please try again.')
  } finally {
    downloading.value = false
  }
}

const downloadSelected = async () => {
  if (!downloadDirectory.value) {
    alert('Please select a download directory in settings first.')
    return
  }
  
  downloading.value = true
  const songsToDownload = searchResults.value.filter(song => 
    selectedSongs.value.includes(song.chartId) && song.md5
  )
  
  if (songsToDownload.length === 0) {
    alert('No downloadable songs selected.')
    downloading.value = false
    return
  }
  
  let successCount = 0
  
  try {
    for (const song of songsToDownload) {
      try {
        // Only pass the necessary data to avoid IPC cloning issues
        const songData = {
          md5: song.md5,
          name: song.name,
          artist: song.artist,
          charter: song.charter
        }
        
        await window.electronAPI.downloadSong(
          songData,
          downloadFormat.value,
          downloadDirectory.value
        )
        successCount++
      } catch (error) {
        console.error(`Failed to download ${song.name}:`, error)
      }
    }
    
    if (successCount === songsToDownload.length) {
      alert(`Downloaded ${successCount} songs successfully!`)
    } else {
      alert(`Downloaded ${successCount} out of ${songsToDownload.length} songs. Some downloads failed.`)
    }
    selectedSongs.value = []
  } catch (error) {
    console.error('Bulk download error:', error)
    alert('Bulk download failed. Please try again.')
  } finally {
    downloading.value = false
  }
}

const loadMoreSongs = async () => {
  if (!hasMorePages.value || loadingMore.value) return
  await searchSongs(true)
}

// Selection functions for the footer
const selectAll = () => {
  const downloadableSongs = searchResults.value
    .filter(song => song.md5) // Only select downloadable songs
    .map(song => song.chartId)
  
  selectedSongs.value = [...downloadableSongs]
}

const clearSelection = () => {
  selectedSongs.value.length = 0
}

// Infinite scroll functionality
const setupInfiniteScroll = () => {
  const handleScroll = () => {
    if (loading.value || loadingMore.value || !hasMorePages.value) return
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    
    // Trigger when user is 200px from bottom
    if (scrollTop + windowHeight >= documentHeight - 200) {
      loadMoreSongs()
    }
  }
  
  window.addEventListener('scroll', handleScroll)
  return () => window.removeEventListener('scroll', handleScroll)
}

// Reset search when filters change
const onFiltersChange = () => {
  if (hasSearched.value && searchQuery.value.trim()) {
    // Add a small delay to ensure the v-model has updated
    nextTick(() => {
      searchSongs(false) // Trigger new search, not load more
    })
  }
}

// Initialize
onMounted(async () => {
  try {
    // Load user settings first (takes priority)
    const userSettings = await window.electronAPI.getUserSettings()
    if (userSettings?.downloadDirectory) {
      downloadDirectory.value = userSettings.downloadDirectory
    }
    if (userSettings?.downloadFormat) {
      downloadFormat.value = userSettings.downloadFormat
    }
    
    // If no user settings, try to auto-detect Clone Hero
    if (!downloadDirectory.value) {
      const settings = await window.electronAPI.getCloneHeroSettings()
      if (settings && settings.songDirectories.length > 0) {
        downloadDirectory.value = settings.songDirectories[0]
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
  
  // Setup infinite scroll
  setupInfiniteScroll()
})

// Watch for download format changes and save to user settings
watch(downloadFormat, async (newFormat) => {
  try {
    await window.electronAPI.saveUserSettings({ downloadFormat: newFormat })
  } catch (error) {
    console.error('Failed to save download format:', error)
  }
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Electron window dragging */
.drag-region {
  -webkit-app-region: drag;
}

.no-drag {
  -webkit-app-region: no-drag;
}

.fixed-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.settings-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.main-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  margin-top: 80px; /* Space for fixed header */
  margin-bottom: 120px; /* Space for fixed footer */
  min-height: calc(100vh - 200px);
}

.settings-panel {
  background: rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.setting-group {
  margin-bottom: 1.5rem;
}

.setting-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.directory-input {
  display: flex;
  gap: 0.5rem;
}

.directory-input input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.directory-input input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.select-btn {
  background: #4CAF50;
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.select-btn:hover {
  background: #45a049;
}

.help-text {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.search-section {
  background: rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.search-form {
  margin-bottom: 2rem;
}

.search-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-btn {
  background: #2196F3;
  border: none;
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.search-btn:hover:not(:disabled) {
  background: #1976D2;
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.filters {
  display: flex;
  gap: 1rem;
}

.filter-select, .format-select {
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.results-header {
  margin-bottom: 1.5rem;
}

.songs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.song-card {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  transition: all 0.2s;
  display: flex;
  gap: 1rem;
  align-items: center;
  width: 100%;
  cursor: pointer;
}

.song-card:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.song-card.selected {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.2);
}

.song-card.no-download {
  opacity: 0.7;
  border-color: rgba(255, 193, 7, 0.5);
  cursor: not-allowed;
}

.song-card.no-download .song-checkbox,
.song-card.no-download .download-btn {
  opacity: 0.5;
  cursor: not-allowed;
}

.song-album-art {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.album-art-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-art-placeholder {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.5);
}

.song-info {
  flex: 1;
  min-width: 0; /* Allow text to truncate */
}

.song-title {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.song-artist {
  margin: 0 0 0.25rem 0;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  font-size: 0.95rem;
}

.song-album {
  margin: 0 0 0.25rem 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
}

.song-charter {
  margin: 0 0 0.25rem 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
}

.song-duration {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
}

.song-difficulties {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.difficulty-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
}

.no-download-notice {
  color: #FFC107;
  font-size: 0.8rem;
  font-weight: 500;
}

.song-details {
  display: flex;
  gap: 1rem;
}

.difficulty, .instrument {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.song-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.song-checkbox {
  transform: scale(1.2);
}

.download-btn {
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.6);
  color: rgba(255, 255, 255, 0.8);
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.download-btn:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 1);
  color: rgba(255, 255, 255, 1);
  background: rgba(255, 255, 255, 0.1);
}

.download-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: rgba(255, 255, 255, 0.3);
}

.welcome {
  text-align: center;
  padding: 3rem 0;
}

.welcome h2 {
  margin-bottom: 1rem;
}

/* Fixed Footer Styles */
.fixed-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(15px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 2rem;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  gap: 2rem;
}

.format-selection {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.format-selection label {
  font-weight: 600;
  white-space: nowrap;
}

.format-select {
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  min-width: 140px;
}

.selection-info {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
}

.footer-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.select-all-btn, .clear-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.select-all-btn:hover:not(:disabled),
.clear-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.select-all-btn:disabled,
.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.download-selected-btn {
  background: #FF9800;
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
  white-space: nowrap;
}

.download-selected-btn:hover:not(:disabled) {
  background: #F57C00;
}

.download-selected-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .footer-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .fixed-header {
    padding: 0.75rem 1rem;
  }
  
  .fixed-header h1 {
    font-size: 1.2rem;
  }
  
  .main-content {
    padding: 1rem;
    margin-top: 70px;
    margin-bottom: 140px;
  }
}

.welcome ul {
  text-align: left;
  max-width: 400px;
  margin: 2rem auto 0;
}

.welcome li {
  margin-bottom: 0.5rem;
}

.load-more-section {
  text-align: center;
  padding: 2rem 0;
}

.load-more-btn {
  background: #2196F3;
  border: none;
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: #1976D2;
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.no-results {
  text-align: center;
  padding: 3rem 0;
  color: rgba(255, 255, 255, 0.8);
}
</style>
