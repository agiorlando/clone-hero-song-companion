import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import axios, { AxiosInstance } from 'axios'
import extractZip from 'extract-zip'
import * as fsExtra from 'fs-extra'

// User settings storage
interface UserSettings {
  downloadDirectory?: string
  downloadFormat?: 'zip' | 'sng'
}

let userSettings: UserSettings = {}
const settingsPath = join(app.getPath('userData'), 'settings.json')

// Load user settings
const loadSettings = async (): Promise<UserSettings> => {
  try {
    const data = await fs.readFile(settingsPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // Settings file doesn't exist or is invalid, return defaults
    return {}
  }
}

// Save user settings
const saveSettings = async (settings: UserSettings): Promise<void> => {
  try {
    await fsExtra.ensureDir(app.getPath('userData'))
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

// Simple cookie storage
let sessionCookies: string[] = []

// Create axios instance with manual cookie management
const axiosWithCookies: AxiosInstance = axios.create({
  timeout: 30000,
  withCredentials: true
})

// Add request interceptor to include cookies
axiosWithCookies.interceptors.request.use((config) => {
  if (sessionCookies.length > 0) {
    config.headers.Cookie = sessionCookies.join('; ')
  }
  return config
})

// Add response interceptor to capture cookies
axiosWithCookies.interceptors.response.use((response) => {
  console.log(`Response from ${response.config.url}:`)
  console.log(`  Status: ${response.status}`)
  console.log(`  Headers:`, Object.keys(response.headers))
  
  const setCookieHeaders = response.headers['set-cookie']
  if (setCookieHeaders) {
    console.log(`  Set-Cookie headers found:`, setCookieHeaders)
    // Extract cookie values (name=value part only)
    const newCookies = setCookieHeaders.map(cookie => cookie.split(';')[0])
    
    // Merge with existing cookies, avoiding duplicates
    newCookies.forEach(newCookie => {
      const cookieName = newCookie.split('=')[0]
      // Remove any existing cookie with the same name
      sessionCookies = sessionCookies.filter(existingCookie => 
        !existingCookie.startsWith(cookieName + '=')
      )
      // Add the new cookie
      sessionCookies.push(newCookie)
    })
    
    console.log(`Updated session cookies: ${sessionCookies.length} cookies`)
    sessionCookies.forEach(cookie => {
      console.log(`  ${cookie}`)
    })
  } else {
    console.log(`  No Set-Cookie headers found`)
  }
  return response
})

// Session establishment flag
let sessionEstablished = false

// Function to establish session with enchor.us by simulating the "second attempt" behavior
const establishSession = async (): Promise<void> => {
  if (sessionEstablished) {
    console.log('Session already established, skipping...')
    return
  }

  console.log('Establishing session with enchor.us (simulating browser behavior)...')
  
  try {
    // Step 1: Visit main page to initialize localStorage/service workers
    console.log('Step 1: Loading main page to initialize client-side storage...')
    await axiosWithCookies.get('https://www.enchor.us/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      }
    })
    
    // Step 2: Wait a moment for any async initialization
    console.log('Step 2: Waiting for client-side initialization...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Step 3: Perform a search to activate the session (like your first attempt)
    console.log('Step 3: Performing initial search to activate session...')
    await axiosWithCookies.post('https://api.enchor.us/search', {
      search: "session_init_query_xyz123",
      page: 1,
      instrument: null,
      difficulty: null,
      drumType: null,
      drumsReviewed: false,
      source: "website"
    }, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/json',
        'Origin': 'https://www.enchor.us',
        'Referer': 'https://www.enchor.us/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
      }
    })
    
    // Step 4: Wait again and try another request to simulate the "second attempt" that works
    console.log('Step 4: Simulating second attempt behavior...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Make another search request (this simulates your "second attempt")
    await axiosWithCookies.post('https://api.enchor.us/search', {
      search: "test",
      page: 1,
      instrument: null,
      difficulty: null,
      drumType: null,
      drumsReviewed: false,
      source: "website"
    }, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/json',
        'Origin': 'https://www.enchor.us',
        'Referer': 'https://www.enchor.us/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
      }
    })
    
    sessionEstablished = true
    console.log('Session established successfully after simulating browser initialization!')
    console.log(`Final session cookies: ${sessionCookies.length} cookies stored`)
    
  } catch (error) {
    console.log('Failed to establish session:', error instanceof Error ? error.message : error)
    // Don't throw - we'll still try the download
  }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) app.quit()

let mainWindow: BrowserWindow
let hiddenBrowserWindow: BrowserWindow | null = null
let hiddenBrowserReady = false

const createHiddenBrowser = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    hiddenBrowserReady = false
    
    hiddenBrowserWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false, // Keep hidden
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
        backgroundThrottling: false, // Prevent throttling when hidden
        allowRunningInsecureContent: true,
        experimentalFeatures: true
      }
    })

    // Load enchor.us and keep it loaded
    hiddenBrowserWindow.loadURL('https://www.enchor.us/')
    
  hiddenBrowserWindow.webContents.on('did-finish-load', () => {
    // Wait for service worker to register and activate
    setTimeout(async () => {
      try {
        // Make a test download request to activate the service worker
        await hiddenBrowserWindow?.webContents.executeJavaScript(`
          fetch('/download?md5=test', { method: 'GET' }).catch(() => {});
        `)
        hiddenBrowserReady = true
        resolve()
      } catch (error) {
        console.error('Service worker activation failed:', error)
        hiddenBrowserReady = true // Still mark as ready, might work anyway
        resolve()
      }
    }, 3000)
  })

  hiddenBrowserWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Hidden browser failed to load: ${errorCode} - ${errorDescription}`)
    reject(new Error(`Hidden browser failed to load: ${errorCode} - ${errorDescription}`))
  })

  // Handle window closed
  hiddenBrowserWindow.on('closed', () => {
    hiddenBrowserWindow = null
    hiddenBrowserReady = false
  })
    
  // Set a timeout in case it never loads
  setTimeout(() => {
    if (!hiddenBrowserReady) {
      hiddenBrowserReady = true
      resolve()
    }
  }, 10000)
  })
}

// Ensure hidden browser is available and ready
const ensureHiddenBrowser = async (): Promise<void> => {
  if (!hiddenBrowserWindow || hiddenBrowserWindow.isDestroyed() || !hiddenBrowserReady) {
    await createHiddenBrowser()
  }
}

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Needed for API calls to enchor.us
      allowRunningInsecureContent: true,
      experimentalFeatures: true
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    titleBarOverlay: process.platform === 'win32' ? {
      color: '#00000000',
      symbolColor: '#ffffff'
    } : undefined,
    show: false
  })

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    // In production, try multiple possible paths
    const possiblePaths = [
      join(__dirname, '../renderer/index.html'),
      join(__dirname, 'renderer/index.html'),
      join(process.resourcesPath, 'app/dist/renderer/index.html')
    ]
    
    let rendererPath = possiblePaths[0]
    for (const path of possiblePaths) {
      if (fsExtra.existsSync(path)) {
        rendererPath = path
        break
      }
    }
    
    mainWindow.loadFile(rendererPath)
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load renderer:', errorCode, errorDescription)
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Renderer loaded successfully')
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    // DevTools can be opened manually if needed for debugging
  })

  // Hidden browser will be created after first search for faster startup
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Load user settings
  userSettings = await loadSettings()
  
  createWindow()
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// IPC handlers for the renderer process

// Search songs on enchor.us
ipcMain.handle('search-songs', async (event, query: string, page: number, instrument?: string, difficulty?: string) => {
  try {
    // Create hidden browser after first search for better startup performance
    if (!hiddenBrowserWindow && !hiddenBrowserReady) {
      // Don't await - let it initialize in background
      createHiddenBrowser().catch(error => {
        console.error('Background hidden browser creation failed:', error)
      })
    }
    const requestBody = {
      search: query,
      page: page,
      instrument: instrument || null,
      difficulty: difficulty || null,
      drumType: null,
      drumsReviewed: false,
      source: "website"
    }

    const response = await axiosWithCookies.post('https://api.enchor.us/search', requestBody, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/json',
        'Origin': 'https://www.enchor.us',
        'Referer': 'https://www.enchor.us/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
      }
    })
    
    return response.data
  } catch (error) {
    console.error('Search error:', error)
    throw error
  }
})

// Function to download using the hidden browser window with service worker pattern
const downloadWithHiddenBrowser = async (downloadUrl: string): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    // Ensure hidden browser is available
    try {
      await ensureHiddenBrowser()
    } catch (error) {
      console.error('Failed to ensure hidden browser:', error)
      reject(new Error(`Failed to ensure hidden browser: ${error instanceof Error ? error.message : error}`))
      return
    }
    
    if (!hiddenBrowserWindow) {
      reject(new Error('Hidden browser window not available after ensuring'))
      return
    }

    try {
      // Step 1: Make the first request (triggers service worker, gets HTML)
      const firstResponse = await hiddenBrowserWindow.webContents.executeJavaScript(`
        (async function() {
          try {
            const response = await fetch('${downloadUrl}', {
              method: 'GET',
              headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Upgrade-Insecure-Requests': '1'
              }
            });
            return {
              status: response.status,
              contentType: response.headers.get('content-type'),
              size: response.headers.get('content-length')
            };
          } catch (error) {
            return { error: error.message };
          }
        })()
      `)
      
      // Step 2: Wait for service worker to be ready
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Step 3: Make the second request (should get actual file from service worker)
      const fileData = await hiddenBrowserWindow.webContents.executeJavaScript(`
        (async function() {
          try {
            const response = await fetch('${downloadUrl}', {
              method: 'GET',
              headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Upgrade-Insecure-Requests': '1'
              }
            });
            
            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');
            
            
            if (contentType && (contentType.includes('application/zip') || contentType.includes('application/octet-stream'))) {
              // This is the actual file
              const arrayBuffer = await response.arrayBuffer();
              return {
                success: true,
                data: Array.from(new Uint8Array(arrayBuffer)),
                contentType: contentType,
                size: arrayBuffer.byteLength
              };
            } else {
              // Check if it's HTML by looking at the response text
              const text = await response.text();
              const isHtml = text.includes('<html') || text.includes('<!DOCTYPE');
              return {
                success: false,
                contentType: contentType,
                isHtml: isHtml,
                responseSize: text.length,
                error: isHtml ? 'Still getting HTML instead of ZIP file' : 'Unknown content type: ' + contentType
              };
            }
          } catch (error) {
            return { success: false, error: error.message };
          }
        })()
      `)
      
      if (fileData.success && fileData.data) {
        const buffer = Buffer.from(fileData.data)
        resolve(buffer)
      } else {
        reject(new Error(`Service worker download failed: ${fileData.error || 'Unknown error'}`))
      }
      
    } catch (error) {
      reject(error)
    }
  })
}

// Download a song
ipcMain.handle('download-song', async (event, songData: any, format: 'zip' | 'sng', downloadPath: string) => {
  try {
    if (!songData.md5) {
      throw new Error('No download available for this song (missing md5)')
    }

    const songName = `${songData.artist} - ${songData.name}`
    const safeFileName = songName.replace(/[<>:"/\\|?*]/g, '_')
    let downloadUrl: string
    
    if (format === 'zip') {
      // Use enchor.us download endpoint for zip files
      const encodedFilename = encodeURIComponent(`${songData.artist} - ${songData.name} (${songData.charter})`)
      downloadUrl = `https://www.enchor.us/download?md5=${songData.md5}&isSng=false&downloadNovideoVersion=false&filename=${encodedFilename}`
    } else {
      // Use direct .sng download
      downloadUrl = `https://files.enchor.us/${songData.md5}.sng`
    }
    
    
    let buffer: Buffer | undefined
    
    // Try using the hidden browser window first
    try {
      
      // Hidden browser should already be ready from ensureHiddenBrowser()
      if (hiddenBrowserWindow) {
        buffer = await downloadWithHiddenBrowser(downloadUrl)
      } else {
        throw new Error('Hidden browser not available')
      }
    } catch (error) {
      
      // Fallback to direct download for .sng files
      if (format === 'sng') {
        try {
          const response = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
            }
          })
          
          if (response.status === 200 && !response.headers['content-type']?.includes('text/html')) {
            buffer = Buffer.from(response.data)
          } else {
            throw new Error('Fallback download returned HTML')
          }
        } catch (fallbackError) {
          throw new Error('Unable to download .sng file. The file may not be available.')
        }
      } else {
        throw new Error(`Unable to download ZIP file using hidden browser. Error: ${error instanceof Error ? error.message : error}`)
      }
    }
    
    // Ensure we have a buffer
    if (!buffer) {
      throw new Error('Download failed: No data received')
    }

    // For ZIP files, verify we have actual ZIP data
    if (format === 'zip') {
      // Check for ZIP file signature (PK)
      if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
        throw new Error('Download failed: File does not appear to be a valid ZIP file')
      }
    }

    if (format === 'zip') {
      // Create temp file for zip using system temp directory
      const systemTempDir = tmpdir()
      const appTempDir = join(systemTempDir, 'clone-hero-companion')
      await fsExtra.ensureDir(appTempDir)
      
      const tempZipPath = join(appTempDir, `${safeFileName}.zip`)
      await fs.writeFile(tempZipPath, buffer)

      // Create temporary extraction directory to inspect contents
      const tempExtractDir = join(appTempDir, `extract_${Date.now()}`)
      await fsExtra.ensureDir(tempExtractDir)
      
      // Extract ZIP to temp directory first
      await extractZip(tempZipPath, { dir: tempExtractDir })
      
      // Check if there's a single root folder (common in ZIP files)
      const extractedContents = await fs.readdir(tempExtractDir)
      
      let sourceDir: string
      let finalDirName: string
      
      if (extractedContents.length === 1) {
        const singleItem = join(tempExtractDir, extractedContents[0])
        const stat = await fs.stat(singleItem)
        
        if (stat.isDirectory()) {
          // Single root folder - use its contents and its name
          sourceDir = singleItem
          finalDirName = extractedContents[0]
        } else {
          // Single file - use temp dir as source
          sourceDir = tempExtractDir
          finalDirName = safeFileName
        }
      } else {
        // Multiple items - use temp dir as source
        sourceDir = tempExtractDir
        finalDirName = safeFileName
      }
      
      // Create final directory using the determined name
      const extractPath = join(downloadPath, finalDirName)
      await fsExtra.ensureDir(extractPath)
      
      // Copy contents from source to final directory
      await fsExtra.copy(sourceDir, extractPath, { overwrite: true })
      
      // Clean up temp files
      await fs.unlink(tempZipPath).catch(err => console.warn('Failed to delete temp zip:', err))
      await fsExtra.remove(tempExtractDir).catch(err => console.warn('Failed to delete temp extract dir:', err))
      
      return { success: true, path: extractPath }
    } else {
      // Save .sng file directly
      const filePath = join(downloadPath, `${safeFileName}.sng`)
      await fs.writeFile(filePath, buffer)
      return { success: true, path: filePath }
    }
  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
})

// Select download directory
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Clone Hero Songs Directory'
  })
  
  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0]
    // Save the selected directory to user settings
    userSettings.downloadDirectory = selectedPath
    await saveSettings(userSettings)
    return selectedPath
  }
  return null
})

// Open directory in file manager
ipcMain.handle('open-directory', async (event, path: string) => {
  shell.openPath(path)
})

// Get Clone Hero settings (attempt to auto-detect and return saved settings)
ipcMain.handle('get-clone-hero-settings', async () => {
  // First, check if user has a saved download directory
  if (userSettings.downloadDirectory) {
    return {
      settingsPath: null,
      songDirectories: [userSettings.downloadDirectory],
      userSaved: true
    }
  }

  // If no saved directory, try to auto-detect Clone Hero installation
  const possiblePaths = [
    // macOS
    join(process.env.HOME || '', 'Library/Application Support/Clone Hero'),
    // Windows
    join(process.env.APPDATA || '', 'Clone Hero'),
    // Linux
    join(process.env.HOME || '', '.config/Clone Hero')
  ]

  for (const path of possiblePaths) {
    try {
      const settingsFile = join(path, 'settings.ini')
      const exists = await fs.access(settingsFile).then(() => true).catch(() => false)
      if (exists) {
        const content = await fs.readFile(settingsFile, 'utf-8')
        // Parse settings.ini to find song directories
        const songPathMatch = content.match(/SongFolders\s*=\s*(.+)/)
        if (songPathMatch) {
          return {
            settingsPath: path,
            songDirectories: songPathMatch[1].split(';').filter(Boolean),
            userSaved: false
          }
        }
      }
    } catch (error) {
      // Continue to next path
    }
  }
  
  return null
})

// Save user settings
ipcMain.handle('save-user-settings', async (event, settings: Partial<UserSettings>) => {
  userSettings = { ...userSettings, ...settings }
  await saveSettings(userSettings)
  return userSettings
})

// Get user settings
ipcMain.handle('get-user-settings', async () => {
  return userSettings
})
