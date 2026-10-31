# AetherClick — Liquid Glass Precision Auto Clicker

**AetherClick** is a redesigned, modernized clone of IO Auto Clicker, transformed with **Apple's Liquid Glass Design System** based on official Apple Developer Guidelines:
[Apple Liquid Glass Guidelines](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass)

---

## ✨ Features & Parity with IO Auto Clicker

### 1. Apple Liquid Glass UI
- **Concentric Glass Architecture**: 26px window radius, 18px card containers, 12px control modules, and 9999px fluid sliding pills.
- **Dynamic Dual-Theme Engine**:
  - **Dark Obsidian Glass**: Deep space obsidian surface with electric cyan, blue, and emerald caustics.
  - **White Snow Glass**: Ethereal pearlescent white glass with specular edge reflections and soft ambient diffusion.
  - **System Theme Auto-Detection**: Syncs with Windows OS appearance mode automatically.
- **macOS Window Controls**: macOS traffic lights (Red close, Yellow minimize, Green zoom) and SF Pro Display typography.
- **Fluid Morphing Controls**: Concentric segment bars with spring-latch physics and smooth pill glide.

### 2. High-Precision Auto-Clicking Engine
- **Set Time Interval**: Sub-millisecond precision with dedicated Hours, Minutes, Seconds, and Milliseconds steppers (down to 1ms).
- **Random Click Interval**: Min/Max interval jitter to emulate natural human clicks and bypass anti-cheat systems.
- **Quick Interval Presets**: 1ms (Max speed), 10ms (100 CPS), 50ms (20 CPS), 100ms (10 CPS), 500ms, and 1 sec.
- **Click Options**: Left, Right, or Middle mouse buttons; Single, Double, or Triple click types.
- **Click Repeat**: Infinite clicking (until stopped) or Exact click count (e.g., 100, 1000).
- **Cursor Position**:
  - Current mouse location (follows cursor anywhere on your screens).
  - Fixed screen coordinates ($X, Y$) with a live **Interactive Screen Crosshair Picker**.

### 3. Macro Sequence Studio (Record & Playback)
- Record mouse clicks, mouse paths, and keyboard strokes.
- Variable playback speeds: 0.5x, 1x, 2x, 4x, 8x.
- Export and import macro sequences as `.json` files.

### 4. CPS Speed Benchmark Playground
- Live In-App Click Speed Tester to benchmark clicking rates and achieve gamer ranks (Casual, Pro, Cyborg God).

### 5. Global Hotkeys
- **F6**: Start / Stop AutoClicker (Works across all games and apps).
- **F7**: Start / Stop Macro Recording.
- **F8**: Start / Stop Macro Playback.
- Customizable via the Settings tab.

---

## 🚀 How to Install & Run

### Option 1: Native Windows Installer (Recommended)
Run **`AetherClick-Installer.exe`** (or `release/AetherClick Setup 1.0.0.exe`).
- **Custom Location**: The installer lets you choose any folder on your computer (e.g. `C:\Program Files\AetherClick`, `D:\Games\AetherClick`, etc.).
- **Desktop & Start Menu Shortcuts**: Automatically created.
- **100% Standalone**: Self-contained Electron desktop application with embedded hardware clicker engine. Does not open or require any external web browser.

### Option 2: Run Electron Desktop App Locally
Double-click [Start-AetherClick.bat](file:///c:/Users/Hammad%20Designz/Downloads/Autoclicker-1/Start-AetherClick.bat).
Or run from terminal in `AetherClick`:
```bash
npm start
```

### Option 3: Rebuild the Installer
To generate a fresh installer anytime:
Double-click [Build-Installer.bat](file:///c:/Users/Hammad%20Designz/Downloads/Autoclicker-1/AetherClick/Build-Installer.bat) or run:
```bash
npm run dist
```
The installer executable will be created in `release\AetherClick Setup 1.0.0.exe`.
