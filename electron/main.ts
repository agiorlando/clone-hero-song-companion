import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import axios from 'axios'
import extractZip from 'extract-zip'
import * as fsExtra from 'fs-extra'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) app.quit()

let mainWindow: BrowserWindow

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Needed for API calls to enchor.us
    },
    titleBarStyle: 'hiddenInset',
    show: false
  })

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow)

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// IPC handlers for the renderer process

// Search songs on enchor.us
ipcMain.handle('search-songs', async (event, query: string, instrument?: string, difficulty?: string) => {
  try {
    // This will need to be implemented based on enchor.us API structure
    const response = await axios.get('https://enchor.us/api/search', {
      params: {
        q: query,
        instrument,
        difficulty
      }
    })
    return response.data
  } catch (error) {
    console.error('Search error:', error)
    throw error
  }
})

// Download a song
ipcMain.handle('download-song', async (event, songUrl: string, format: 'zip' | 'sng', downloadPath: string, songName: string) => {
  try {
    const response = await axios.get(songUrl, {
      responseType: 'arraybuffer'
    })

    if (format === 'zip') {
      // Create temp file for zip
      const tempZipPath = join(__dirname, 'temp', `${songName}.zip`)
      await fsExtra.ensureDir(join(__dirname, 'temp'))
      await fs.writeFile(tempZipPath, response.data)

      // Extract to final destination
      const extractPath = join(downloadPath, songName)
      await fsExtra.ensureDir(extractPath)
      await extractZip(tempZipPath, { dir: extractPath })

      // Clean up temp file
      await fs.unlink(tempZipPath)
      
      return { success: true, path: extractPath }
    } else {
      // Save .sng file directly
      const filePath = join(downloadPath, `${songName}.sng`)
      await fs.writeFile(filePath, response.data)
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
    return result.filePaths[0]
  }
  return null
})

// Open directory in file manager
ipcMain.handle('open-directory', async (event, path: string) => {
  shell.openPath(path)
})

// Get Clone Hero settings (attempt to auto-detect)
ipcMain.handle('get-clone-hero-settings', async () => {
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
            songDirectories: songPathMatch[1].split(';').filter(Boolean)
          }
        }
      }
    } catch (error) {
      // Continue to next path
    }
  }
  
  return null
})
