# Release Template

Use this template when creating a new release on GitHub.

## Release Title Format:
```
🎸 Clone Hero Song Companion vX.X.X
```

## Release Description Template:

```markdown
## 🎸 Clone Hero Song Companion vX.X.X

Brief description of what's new in this release.

### ✨ New Features
- Feature 1
- Feature 2

### 🐛 Bug Fixes
- Fix 1
- Fix 2

### 🔧 Improvements
- Improvement 1
- Improvement 2

### 📥 Downloads
Choose the right version for your platform:

**Windows:**
- 64-bit: `Clone-Hero-Song-Companion-Setup-vX.X.X-x64.exe`
- 32-bit: `Clone-Hero-Song-Companion-Setup-vX.X.X-ia32.exe`

**macOS:**
- Intel Macs: `Clone-Hero-Song-Companion-vX.X.X-mac-x64.dmg`
- Apple Silicon (M1/M2/M3): `Clone-Hero-Song-Companion-vX.X.X-mac-arm64.dmg`

**Linux:**
- `Clone-Hero-Song-Companion-vX.X.X-linux.AppImage`

### 🚀 Installation
1. Download the appropriate file for your platform
2. Install/run the application
3. Open Settings (⚙️) to configure your Clone Hero songs directory
4. Start searching and downloading!

### 🐛 Known Issues
- List any known issues here

### 📝 Feedback
Found a bug or have a suggestion? [Open an issue](https://github.com/agiorlando/clone-hero-song-companion/issues)!

---
**Full Changelog**: https://github.com/agiorlando/clone-hero-song-companion/compare/vPREVIOUS...vX.X.X
```

## Steps to Create a Release:

1. **Update version in package.json**
2. **Commit and push changes**
3. **Go to GitHub → Releases → "Create a new release"**
4. **Create new tag** (e.g., `v0.2.0`)
5. **Use the title format above**
6. **Fill in the description template**
7. **Click "Publish release"**
8. **GitHub Actions will automatically build and upload all platform binaries!**

## What Happens Automatically:
- ✅ Builds for Windows (64-bit & 32-bit)
- ✅ Builds for macOS (Intel & Apple Silicon)  
- ✅ Builds for Linux (AppImage)
- ✅ Uploads all binaries to the release
- ✅ Users can download immediately
