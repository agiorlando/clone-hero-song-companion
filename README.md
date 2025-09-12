# Clone Hero Song Companion

A modern, cross-platform desktop application for searching and downloading Clone Hero songs from [enchor.us](https://www.enchor.us/). Built with Electron, Vue 3, and TypeScript.

![Clone Hero Song Companion](https://via.placeholder.com/800x400/667eea/ffffff?text=Clone+Hero+Song+Companion)

## ✨ Features

- 🔍 **Smart Search**: Search songs by name, artist, instrument, and difficulty
- 🎸 **Multi-Instrument Support**: Guitar, Bass, Drums, Keys, and Vocals
- 📊 **Difficulty Filtering**: Filter by Easy, Medium, Hard, Expert, and Expert+
- 🔄 **Infinite Scroll**: Seamlessly load more results as you browse
- 📦 **Dual Download Formats**: Choose between .zip (auto-extract) or .sng files
- 🗂️ **Smart Extraction**: Automatically handles nested folders in ZIP files
- ⚡ **Bulk Downloads**: Select multiple songs for batch downloading
- 🎯 **One-Click Downloads**: Download individual songs instantly
- 💾 **Persistent Settings**: Remembers your download directory and format preferences
- 🖥️ **Cross-Platform**: Works on Windows, macOS, and Linux
- 🎨 **Modern UI**: Clean, responsive interface with glassmorphism design

## 🚀 Quick Start

### Download & Install

1. **Go to [Releases](https://github.com/agiorlando/clone-hero-song-companion/releases)**
2. **Download the appropriate version for your platform:**
   - **Windows (64-bit)**: `Clone-Hero-Song-Companion-Setup-vX.X.X-x64.exe`
   - **Windows (32-bit)**: `Clone-Hero-Song-Companion-Setup-vX.X.X-ia32.exe`
   - **macOS (Intel)**: `Clone-Hero-Song-Companion-vX.X.X-mac-x64.dmg`
   - **macOS (Apple Silicon)**: `Clone-Hero-Song-Companion-vX.X.X-mac-arm64.dmg`
   - **Linux**: `Clone-Hero-Song-Companion-vX.X.X-linux.AppImage`

### First-Time Setup

#### macOS Users - Important Security Note
On first launch, macOS may show a security warning. To bypass this:

**Method 1 (Recommended):**
1. Right-click the app and select "Open"
2. Click "Open" in the security dialog

**Method 2 (Terminal):**
```bash
# Remove quarantine attribute (run in Terminal)
sudo xattr -rd com.apple.quarantine "/Applications/Clone Hero Song Companion.app"
```

#### All Platforms
1. **Launch the application**
2. **Click the Settings button (⚙️)** in the top-right corner
3. **Select your Clone Hero songs directory** (the app will try to auto-detect it)
4. **Start searching for songs!**

## 📱 How to Use

### Searching Songs
1. Enter a song name, artist, or any search term
2. Use the dropdown filters to narrow by instrument and difficulty
3. Results load automatically with infinite scroll

### Downloading Songs
- **Single Download**: Click the download icon (⬇️) on any song
- **Bulk Download**: 
  - Click anywhere on a song row to select it
  - Select multiple songs
  - Use the footer toolbar to "Download Selected"

### Managing Downloads
- **Format**: Choose .zip (recommended) or .sng in the footer toolbar
- **Directory**: Set your Clone Hero songs folder in Settings
- **Auto-Extract**: ZIP files are automatically extracted to the correct folder structure

## 🛠️ System Requirements

- **Windows**: Windows 10 or later (64-bit or 32-bit)
- **macOS**: macOS 10.15 (Catalina) or later (Intel and Apple Silicon)
- **Linux**: Most modern distributions (64-bit)
- **Disk Space**: ~100MB for the application + space for downloaded songs
- **Internet**: Required for searching and downloading songs

## 🔧 Technical Details

### Built With
- **Electron**: Cross-platform desktop framework
- **Vue 3**: Modern reactive frontend framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tooling
- **Node.js**: Backend functionality

### Key Features
- **Hidden Browser Engine**: Maintains session with enchor.us for reliable downloads
- **Smart ZIP Extraction**: Handles nested folders and various archive structures
- **Persistent Settings**: Uses Electron's userData directory for settings storage
- **Service Worker Integration**: Works with enchor.us's client-side architecture

## 🐛 Troubleshooting

### Download Issues
- **"No download available"**: Some songs may not have downloadable files
- **Download fails**: Try switching between .zip and .sng formats
- **Extraction errors**: Ensure you have write permissions to your songs directory

### General Issues
- **App won't start**: Try running as administrator (Windows) or check security settings (macOS)
- **Search not working**: Check your internet connection
- **Settings not saving**: Ensure the app has write permissions to its data directory

### Getting Help
- Check the [Issues](https://github.com/agiorlando/clone-hero-song-companion/issues) page
- Create a new issue with:
  - Your operating system and version
  - Steps to reproduce the problem
  - Any error messages you see

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup
```bash
# Clone the repository
git clone https://github.com/agiorlando/clone-hero-song-companion.git
cd clone-hero-song-companion

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Build platform-specific releases
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

### Project Structure
```
├── electron/          # Electron main process
│   ├── main.ts        # Main application logic
│   └── preload.ts     # Renderer process bridge
├── src/               # Vue frontend
│   ├── App.vue        # Main application component
│   └── types/         # TypeScript definitions
├── dist/              # Built application files
└── release/           # Platform-specific builds
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[enchor.us](https://www.enchor.us/)** - For providing the song database and API
- **Clone Hero Community** - For creating and maintaining the amazing song charts
- **Electron & Vue Teams** - For the excellent development frameworks

## 🔗 Links

- **Clone Hero**: [Official Website](https://clonehero.net/)
- **enchor.us**: [Song Database](https://www.enchor.us/)
- **Report Issues**: [GitHub Issues](https://github.com/agiorlando/clone-hero-song-companion/issues)

---

**⭐ If you find this app useful, please consider starring the repository!**