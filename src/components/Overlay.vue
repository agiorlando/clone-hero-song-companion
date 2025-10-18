<template>
  <div class="overlay-container">
    <div class="overlay-header">
      <h2>Clone Hero Companion</h2>
      <button @click="closeOverlay" class="close-btn" title="Close Overlay (` key)">
        ✕
      </button>
    </div>
    
    <div class="overlay-content">
      <!-- Quick Search Section -->
      <div class="quick-search">
        <h3>Quick Search</h3>
        <div class="search-input-group">
          <input 
            v-model="searchQuery" 
            @keyup.enter="performSearch"
            type="text" 
            placeholder="Search for songs..."
            class="search-input"
          />
          <button @click="performSearch" class="search-btn" :disabled="loading">
            {{ loading ? '⏳' : '🔍' }}
          </button>
        </div>
      </div>

      <!-- Search Results -->
      <div v-if="searchResults.length > 0" class="search-results-section">
        <h3>Search Results ({{ searchResults.length }})</h3>
        <div class="search-results-list" @scroll="handleScroll" ref="searchResultsContainer">
          <div 
            v-for="song in searchResults" 
            :key="song.chartId"
            class="search-result-item"
          >
            <div class="song-info">
              <div class="song-title">{{ song.artist }} - {{ song.name }}</div>
              <div class="song-meta">
                <span>{{ song.charter }} • {{ song.genre }}</span>
                <span class="separator">•</span>
                <span class="guitar-difficulty">
                  🎸 {{ getDifficultyStars(song.diff_guitar || -1) }}
                </span>
              </div>
            </div>
            <button @click="quickDownload(song)" class="download-btn" title="Quick Download">
              ⬇️
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Downloads -->
      <div class="recent-section">
        <h3>Recent Downloads</h3>
        <div class="recent-list">
          <div v-if="recentDownloads.length === 0" class="no-recent">
            No recent downloads
          </div>
          <div v-else>
            <div 
              v-for="download in recentDownloads.slice(0, 5)" 
              :key="download.id"
              class="recent-item"
            >
              <div class="recent-info">
                <div class="song-title">{{ download.artist }} - {{ download.name }}</div>
                <div class="song-meta">{{ formatDate(download.downloadedAt) }}</div>
              </div>
              <button @click="openDownloadFolder(download.path)" class="open-folder-btn" title="Open in Finder/Explorer">
                📁
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-section">
        <h3>Stats</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ totalDownloads }}</div>
            <div class="stat-label">Total Downloads</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ downloadFormat.toUpperCase() }}</div>
            <div class="stat-label">Format</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="actions-section">
        <h3>Quick Actions</h3>
        <div class="action-buttons">
          <button @click="openMainApp" class="action-btn primary">
            Open Main App
          </button>
          <button @click="openDownloadFolder()" class="action-btn">
            Open Downloads
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <!-- Download Progress Bar -->
    <div v-if="downloadProgress?.isActive" class="download-progress-container">
      <div class="progress-content">
        <div class="progress-info">
          <div class="progress-icon">⬇️</div>
          <div class="progress-text">Downloading: {{ downloadProgress.songName }}</div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: downloadProgress.progress + '%' }"></div>
        </div>
        <div class="progress-percentage">{{ Math.round(downloadProgress.progress) }}%</div>
      </div>
    </div>

    <!-- Download Notification -->
    <div v-if="downloadNotification" class="download-notification" :class="downloadNotification.type">
      <div class="notification-content">
        <div class="notification-icon">{{ downloadNotification.type === 'success' ? '✅' : '❌' }}</div>
        <div class="notification-text">{{ downloadNotification.message }}</div>
      </div>
    </div>

    <div class="overlay-footer">
      <div class="hotkey-hint">Press ` (tilde) to toggle overlay</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Reactive state
const searchQuery = ref('')
const loading = ref(false)
const loadingMore = ref(false)
const recentDownloads = ref<any[]>([])
const searchResults = ref<any[]>([])
const currentPage = ref(1)
const hasMoreResults = ref(false)
const lastSearchQuery = ref('')
const totalDownloads = ref(0)
const downloadFormat = ref<'zip' | 'sng'>('zip')
const downloadNotification = ref<{type: 'success' | 'error', message: string} | null>(null)
const downloadProgress = ref<{songName: string, progress: number, isActive: boolean} | null>(null)
const searchResultsContainer = ref<HTMLElement | null>(null)
let scrollTimeout: NodeJS.Timeout | null = null

// Methods
const closeOverlay = async () => {
  try {
    console.log('Close button clicked - attempting to close overlay')
    if (window.electronAPI?.hideOverlay) {
      const result = await window.electronAPI.hideOverlay()
      console.log('Hide overlay result:', result)
    } else {
      console.error('hideOverlay function not available')
    }
  } catch (error) {
    console.error('Failed to close overlay:', error)
  }
}

const performSearch = async () => {
  if (!searchQuery.value.trim() || loading.value) return
  
  loading.value = true
  try {
    
    // Reset pagination for new search
    currentPage.value = 1
    lastSearchQuery.value = searchQuery.value
    
    // Perform search directly in the overlay without switching to main app
    const results = await window.electronAPI?.searchSongs(searchQuery.value, 1)
    
    if (results && results.data && results.data.length > 0) {
      searchResults.value = results.data
      // Use the same logic as main app: check if we have fewer results than total found
      hasMoreResults.value = results.data.length < results.found
    } else {
      searchResults.value = []
      hasMoreResults.value = false
    }
    
    // Reset scroll to top for new search
    if (searchResultsContainer.value) {
      searchResultsContainer.value.scrollTop = 0
    }
    
    // Clear search query but keep results visible
    searchQuery.value = ''
  } catch (error) {
    console.error('Search failed:', error)
    searchResults.value = []
    hasMoreResults.value = false
  } finally {
    loading.value = false
  }
}

const loadMoreResults = async () => {
  if (!lastSearchQuery.value || loadingMore.value || !hasMoreResults.value) return
  
  loadingMore.value = true
  try {
    const nextPage = currentPage.value + 1
    const results = await window.electronAPI?.searchSongs(lastSearchQuery.value, nextPage)
    
    if (results && results.data && results.data.length > 0) {
      // Append new results to existing ones
      searchResults.value = [...searchResults.value, ...results.data]
      currentPage.value = nextPage
      // Use same logic as main app: check if total loaded is less than total found
      hasMoreResults.value = searchResults.value.length < results.found
    } else {
      hasMoreResults.value = false
    }
  } catch (error) {
    console.error('Failed to load more results:', error)
    hasMoreResults.value = false
  } finally {
    loadingMore.value = false
  }
}

const getDifficultyStars = (difficulty: number): string => {
  if (difficulty === -1) return '☆☆☆☆☆' // No guitar track
  
  // Difficulty values: 0=Easy, 1=Medium, 2=Hard, 3=Expert, 4=Expert+
  // Convert to 1-5 stars: Easy=1★, Medium=2★, Hard=3★, Expert=4★, Expert+=5★
  const stars = difficulty + 1
  const fullStars = Math.min(stars, 5)
  const emptyStars = 5 - fullStars
  
  return '★'.repeat(fullStars) + '☆'.repeat(emptyStars)
}

const quickDownload = async (song: any) => {
  try {
    const settings = await window.electronAPI?.getUserSettings()
    const downloadPath = settings?.downloadDirectory
    
    if (!downloadPath) {
      console.error('No download directory set')
      alert('Please set a download directory in settings first')
      return
    }
    
    console.log('Quick downloading:', song.name, 'to:', downloadPath)
    
    // Show progress bar
    const songName = `${song.artist} - ${song.name}`
    downloadProgress.value = {
      songName,
      progress: 0,
      isActive: true
    }
    
    // Simulate progress updates (since we don't have real progress from the download API)
    const progressInterval = setInterval(() => {
      if (downloadProgress.value && downloadProgress.value.progress < 90) {
        downloadProgress.value.progress += Math.random() * 15 + 5
      }
    }, 200)
    
    // Ensure song has required properties for download
    const songData = {
      md5: song.md5,
      name: song.name,
      artist: song.artist,
      charter: song.charter
    }
    
    console.log('Song data for download:', songData)
    const result = await window.electronAPI?.downloadSong(songData, downloadFormat.value, downloadPath)
    
    // Complete progress
    clearInterval(progressInterval)
    if (downloadProgress.value) {
      downloadProgress.value.progress = 100
      setTimeout(() => {
        downloadProgress.value = null
      }, 500)
    }
    
    if (result?.success) {
      // Add to recent downloads
      const newDownload = {
        id: Date.now(),
        artist: song.artist,
        name: song.name,
        path: result.path,
        downloadedAt: new Date().toISOString()
      }
      
      recentDownloads.value.unshift(newDownload)
      if (recentDownloads.value.length > 10) {
        recentDownloads.value = recentDownloads.value.slice(0, 10)
      }
      
      // Save to localStorage
      localStorage.setItem('recentDownloads', JSON.stringify(recentDownloads.value))
      totalDownloads.value = recentDownloads.value.length
      
      // Show success notification
      showNotification('success', `✨ Downloaded: ${song.artist} - ${song.name}`)
      
      console.log('Download completed!')
    } else {
      throw new Error('Download failed - no success response')
    }
  } catch (error) {
    console.error('Download failed:', error)
    
    // Clear progress on error
    if (downloadProgress.value) {
      downloadProgress.value = null
    }
    
    showNotification('error', `❌ Download failed: ${song.artist} - ${song.name}`)
  }
}

const showNotification = (type: 'success' | 'error', message: string) => {
  downloadNotification.value = { type, message }
  
  // Auto-hide after 4 seconds
  setTimeout(() => {
    downloadNotification.value = null
  }, 4000)
}

const openMainApp = async () => {
  try {
    await window.electronAPI?.focusMainWindow()
    await closeOverlay()
  } catch (error) {
    console.error('Failed to open main app:', error)
  }
}

const openDownloadFolder = async (path?: string) => {
  try {
    if (path) {
      await window.electronAPI?.openDirectory(path)
    } else {
      // Open default download directory
      const settings = await window.electronAPI?.getUserSettings()
      if (settings?.downloadDirectory) {
        await window.electronAPI?.openDirectory(settings.downloadDirectory)
      }
    }
  } catch (error) {
    console.error('Failed to open folder:', error)
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const handleScroll = (event: Event) => {
  const container = event.target as HTMLElement
  if (!container || loadingMore.value) return
  
  const scrollTop = container.scrollTop
  const scrollHeight = container.scrollHeight
  const clientHeight = container.clientHeight
  
  // Trigger infinite scroll when 80% scrolled
  const scrollPercentage = (scrollTop + clientHeight) / scrollHeight
  
  if (scrollPercentage >= 0.8 && hasMoreResults.value && !loadingMore.value) {
    loadMoreResults()
  }
}

// Load data on mount
onMounted(async () => {
  try {
    const settings = await window.electronAPI?.getUserSettings()
    if (settings) {
      downloadFormat.value = settings.downloadFormat || 'zip'
    }
    
    // Load recent downloads from localStorage or settings
    const stored = localStorage.getItem('recentDownloads')
    if (stored) {
      recentDownloads.value = JSON.parse(stored)
      totalDownloads.value = recentDownloads.value.length
    }
  } catch (error) {
    console.error('Failed to load overlay data:', error)
  }
})
</script>

<style scoped>
.overlay-container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%);
  backdrop-filter: blur(20px);
  color: white;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border-right: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.3);
}

.overlay-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.overlay-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.overlay-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.overlay-content h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.quick-search {
  margin-bottom: 2rem;
}

.search-input-group {
  display: flex;
  gap: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.9rem;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.search-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

.search-btn {
  background: rgba(76, 175, 80, 0.8);
  border: none;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.search-btn:hover:not(:disabled) {
  background: rgba(76, 175, 80, 1);
  transform: translateY(-1px);
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-results-section, .recent-section, .stats-section, .actions-section {
  margin-bottom: 2rem;
}

.search-results-list {
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
}

.search-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
}

.search-result-item:hover {
  background: rgba(76, 175, 80, 0.2);
  transform: translateX(4px);
}

.song-info {
  flex: 1;
}

.download-btn {
  background: rgba(76, 175, 80, 0.8);
  border: 1px solid rgba(76, 175, 80, 1);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.download-btn:hover {
  background: rgba(76, 175, 80, 1);
  transform: scale(1.1);
}

.recent-list {
  max-height: 200px;
  overflow-y: auto;
}

.no-recent {
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  text-align: center;
  padding: 1rem;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
}

.recent-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(4px);
}

.recent-info {
  flex: 1;
}

.song-title {
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.song-meta {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.separator {
  color: rgba(255, 255, 255, 0.5);
}

.guitar-difficulty {
  color: rgba(255, 215, 0, 0.9);
  font-weight: 500;
}

.open-folder-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.open-folder-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stat-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-btn {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  font-weight: 500;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.action-btn.primary {
  background: rgba(76, 175, 80, 0.8);
  border-color: rgba(76, 175, 80, 1);
}

.action-btn.primary:hover {
  background: rgba(76, 175, 80, 1);
}


.overlay-footer {
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.hotkey-hint {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
}

/* Custom scrollbar - vertical only */
.recent-list::-webkit-scrollbar,
.overlay-content::-webkit-scrollbar,
.search-results-list::-webkit-scrollbar {
  width: 6px;
  height: 0; /* Hide horizontal scrollbar */
}

.recent-list::-webkit-scrollbar-track,
.overlay-content::-webkit-scrollbar-track,
.search-results-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.recent-list::-webkit-scrollbar-thumb,
.overlay-content::-webkit-scrollbar-thumb,
.search-results-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.recent-list::-webkit-scrollbar-thumb:hover,
.overlay-content::-webkit-scrollbar-thumb:hover,
.search-results-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Prevent horizontal overflow */
.overlay-container,
.overlay-content,
.recent-list,
.search-results-list {
  overflow-x: hidden;
}

.recent-item,
.search-result-item {
  min-width: 0; /* Allow flex items to shrink */
  word-wrap: break-word;
}

.song-title,
.song-meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Download Progress Bar */
.download-progress-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  backdrop-filter: blur(20px);
  background: rgba(33, 150, 243, 0.9);
  border: 2px solid rgba(33, 150, 243, 1);
  color: white;
  animation: slideDown 0.3s ease-out;
  min-width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.progress-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.progress-text {
  font-weight: 500;
  font-size: 0.9rem;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 4px;
  transition: width 0.3s ease;
  animation: progressShimmer 2s infinite;
}

.progress-percentage {
  text-align: center;
  font-weight: 600;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
}

@keyframes progressShimmer {
  0% { opacity: 1; }
  50% { opacity: 0.8; }
  100% { opacity: 1; }
}

/* Download Notification */
.download-notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  backdrop-filter: blur(20px);
  border: 2px solid;
  animation: slideDown 0.3s ease-out, fadeOut 0.3s ease-in 3.7s;
  max-width: 300px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.download-notification.success {
  background: rgba(76, 175, 80, 0.9);
  border-color: rgba(76, 175, 80, 1);
  color: white;
}

.download-notification.error {
  background: rgba(244, 67, 54, 0.9);
  border-color: rgba(244, 67, 54, 1);
  color: white;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.notification-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.notification-text {
  font-weight: 500;
  font-size: 0.9rem;
  line-height: 1.3;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
