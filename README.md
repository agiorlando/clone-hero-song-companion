# Clone Hero Song Companion

A desktop companion application for Clone Hero that allows you to search and download songs from enchor.us directly to your Clone Hero songs directory.

## Features

- 🎸 **Search by Instrument & Difficulty** - Filter songs by guitar, bass, drums, vocals, keys and difficulty levels
- 📦 **Multiple Download Formats** - Download as .zip (extracted to folders) or .sng (single files)
- 🔄 **Auto-Detection** - Automatically detects your Clone Hero installation and song directories
- ⚡ **Bulk Downloads** - Select and download multiple songs at once
- 🎨 **Modern UI** - Beautiful, responsive interface built with Vue 3
- 🖥️ **Cross-Platform** - Works on Windows, macOS, and Linux

## Technology Stack

- **Electron** - Cross-platform desktop app framework
- **Vue 3** - Modern reactive frontend framework
- **TypeScript** - Type-safe JavaScript
- **Node.js** - Backend functionality for file operations
- **Vite** - Fast build tool and dev server

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd clone-hero-song-companion
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

This will start both the Electron main process and the Vue development server.

## Building for Production

### Build for Current Platform
```bash
npm run build:all
```

### Build for Specific Platforms
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Built applications will be available in the `release/` directory.

## Project Structure

```
├── electron/           # Electron main process files
│   ├── main.ts        # Main Electron process
│   └── preload.ts     # Preload script for secure IPC
├── src/               # Vue 3 application
│   ├── components/    # Vue components
│   ├── types/         # TypeScript type definitions
│   ├── App.vue        # Main app component
│   └── main.ts        # Vue app entry point
├── dist/              # Built files
├── release/           # Final executables
└── package.json       # Dependencies and scripts
```

## Usage

1. **First Time Setup**:
   - Open the application
   - Click the Settings button (⚙️)
   - Select your Clone Hero songs directory (auto-detected if possible)

2. **Searching Songs**:
   - Enter search terms in the search box
   - Optionally filter by instrument and difficulty
   - Click Search

3. **Downloading**:
   - **Single Song**: Click the download button (📥) on any song
   - **Multiple Songs**: Check the songs you want, then click "Download Selected"
   - Choose format: .zip (extracts to folders) or .sng (single files)

## API Integration

The app integrates with enchor.us search endpoints. The current implementation includes:
- Search functionality with instrument and difficulty filters
- Download handling for both .zip and .sng formats
- Automatic extraction of .zip files to organized folders

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Troubleshooting

### Common Issues

1. **Can't find Clone Hero directory**: Manually browse and select your Clone Hero songs folder in Settings
2. **Downloads fail**: Check your internet connection and ensure the download directory has write permissions
3. **App won't start**: Make sure you have Node.js 18+ installed

### Debug Mode

Run in development mode to see detailed logs:
```bash
npm run dev
```

The developer tools will be available in the Electron window for debugging.
