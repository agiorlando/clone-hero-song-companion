<template>
  <div class="app">
    <header class="app-header">
      <h1>Clone Hero Song Companion</h1>
      <button @click="showSettings = !showSettings" class="settings-btn">
        ⚙️ Settings
      </button>
    </header>

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
            <select v-model="selectedInstrument" class="filter-select">
              <option value="">All Instruments</option>
              <option value="guitar">Guitar</option>
              <option value="bass">Bass</option>
              <option value="drums">Drums</option>
              <option value="vocals">Vocals</option>
              <option value="keys">Keys</option>
            </select>
            
            <select v-model="selectedDifficulty" class="filter-select">
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
            <h2>Search Results ({{ searchResults.length }})</h2>
            <div class="bulk-actions">
              <select v-model="downloadFormat" class="format-select">
                <option value="zip">.zip (Extract to folder)</option>
                <option value="sng">.sng (Single file)</option>
              </select>
              <button 
                @click="downloadSelected" 
                :disabled="selectedSongs.length === 0 || downloading"
                class="download-selected-btn"
              >
                {{ downloading ? 'Downloading...' : `Download Selected (${selectedSongs.length})` }}
              </button>
            </div>
          </div>

          <div class="songs-grid">
            <div 
              v-for="song in searchResults" 
              :key="song.id"
              class="song-card"
              :class="{ selected: selectedSongs.includes(song.id) }"
            >
              <div class="song-info">
                <h3 class="song-title">{{ song.title }}</h3>
                <p class="song-artist">{{ song.artist }}</p>
                <div class="song-details">
                  <span class="difficulty">{{ song.difficulty }}</span>
                  <span class="instrument">{{ song.instrument }}</span>
                </div>
              </div>
              
              <div class="song-actions">
                <input 
                  type="checkbox" 
                  :checked="selectedSongs.includes(song.id)"
                  @change="toggleSongSelection(song.id)"
                  class="song-checkbox"
                />
                <button 
                  @click="downloadSingle(song)" 
                  class="download-btn"
                  :disabled="downloading"
                >
                  📥
                </button>
              </div>
            </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Types
interface Song {
  id: string
  title: string
  artist: string
  difficulty: string
  instrument: string
  downloadUrl: string
}

// Reactive state
const showSettings = ref(false)
const downloadDirectory = ref('')
const searchQuery = ref('')
const selectedInstrument = ref('')
const selectedDifficulty = ref('')
const downloadFormat = ref<'zip' | 'sng'>('zip')
const searchResults = ref<Song[]>([])
const selectedSongs = ref<string[]>([])
const loading = ref(false)
const downloading = ref(false)
const hasSearched = ref(false)

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

const searchSongs = async () => {
  if (!searchQuery.value.trim()) return
  
  loading.value = true
  hasSearched.value = true
  
  try {
    const results = await window.electronAPI.searchSongs(
      searchQuery.value,
      selectedInstrument.value || undefined,
      selectedDifficulty.value || undefined
    )
    searchResults.value = results
    selectedSongs.value = []
  } catch (error) {
    console.error('Search error:', error)
    // For now, show mock data
    searchResults.value = [
      {
        id: '1',
        title: 'Through the Fire and Flames',
        artist: 'DragonForce',
        difficulty: 'Expert',
        instrument: 'Guitar',
        downloadUrl: 'https://example.com/song1.zip'
      },
      {
        id: '2',
        title: 'One',
        artist: 'Metallica',
        difficulty: 'Hard',
        instrument: 'Guitar',
        downloadUrl: 'https://example.com/song2.zip'
      }
    ]
  } finally {
    loading.value = false
  }
}

const toggleSongSelection = (songId: string) => {
  const index = selectedSongs.value.indexOf(songId)
  if (index > -1) {
    selectedSongs.value.splice(index, 1)
  } else {
    selectedSongs.value.push(songId)
  }
}

const downloadSingle = async (song: Song) => {
  if (!downloadDirectory.value) {
    alert('Please select a download directory in settings first.')
    return
  }
  
  downloading.value = true
  try {
    await window.electronAPI.downloadSong(
      song.downloadUrl,
      downloadFormat.value,
      downloadDirectory.value,
      `${song.artist} - ${song.title}`
    )
    alert(`Downloaded: ${song.title}`)
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
    selectedSongs.value.includes(song.id)
  )
  
  try {
    for (const song of songsToDownload) {
      await window.electronAPI.downloadSong(
        song.downloadUrl,
        downloadFormat.value,
        downloadDirectory.value,
        `${song.artist} - ${song.title}`
      )
    }
    alert(`Downloaded ${songsToDownload.length} songs!`)
    selectedSongs.value = []
  } catch (error) {
    console.error('Bulk download error:', error)
    alert('Some downloads failed. Please try again.')
  } finally {
    downloading.value = false
  }
}

// Initialize
onMounted(async () => {
  try {
    const settings = await window.electronAPI.getCloneHeroSettings()
    if (settings && settings.songDirectories.length > 0) {
      downloadDirectory.value = settings.songDirectories[0]
    }
  } catch (error) {
    console.error('Error loading Clone Hero settings:', error)
  }
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.app-header h1 {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.bulk-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.download-selected-btn {
  background: #FF9800;
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.download-selected-btn:hover:not(:disabled) {
  background: #F57C00;
}

.download-selected-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.songs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.song-card {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.song-card:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.song-card.selected {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.2);
}

.song-info {
  flex: 1;
}

.song-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.song-artist {
  margin: 0 0 0.5rem 0;
  color: rgba(255, 255, 255, 0.8);
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
  gap: 1rem;
}

.song-checkbox {
  transform: scale(1.2);
}

.download-btn {
  background: #4CAF50;
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background 0.2s;
}

.download-btn:hover:not(:disabled) {
  background: #45a049;
}

.download-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.welcome {
  text-align: center;
  padding: 3rem 0;
}

.welcome h2 {
  margin-bottom: 1rem;
}

.welcome ul {
  text-align: left;
  max-width: 400px;
  margin: 2rem auto 0;
}

.welcome li {
  margin-bottom: 0.5rem;
}

.no-results {
  text-align: center;
  padding: 3rem 0;
  color: rgba(255, 255, 255, 0.8);
}
</style>
