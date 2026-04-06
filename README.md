# APIForge 🔥

A fast, beautiful desktop API client — like Postman, but yours to build and run.
Built with **Next.js + React + Zustand**, packaged as a native desktop app via **Electron**.

---

## ✅ Bug Fixes in This Version

### 1. Save to Folder — Fixed
**Before:** Clicking "Save" always saved the request to the collection root, even if you wanted to save it inside a folder.  
**After:** Save now opens a **folder-tree modal** where you can pick exactly which collection or nested folder to save into.

### 2. Multiple Requests Open as Tabs — Fixed
**Before:** Clicking different requests in the sidebar sometimes didn't open them in new tabs.  
**After:** Each unique request now always opens its own tab. Clicking the same request again switches to its existing tab (Postman-style).

---

## 📋 Prerequisites

Install the following before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18 or higher | https://nodejs.org |
| npm | comes with Node.js | — |

Verify your install:
```bash
node --version   # v18.x.x or higher
npm --version    # 9.x.x or higher
```

---

## 📦 Install Dependencies

Run this **once** after downloading the project:

```bash
npm install
```

This installs everything including `electron`, `electron-builder`, and `cross-env` (needed for Windows compatibility).

---

## 🌐 Run as Web App (Browser)

```bash
# Terminal 1
npm run dev

# Then open: http://localhost:3000
```

---

## 🖥️ Run as Desktop App (Electron)

You need **two terminals open at the same time**:

```bash
# Terminal 1 — start the Next.js dev server
npm run dev

# Terminal 2 — launch the Electron window
npm run electron:dev
```

The desktop window will open automatically.

---

## 📦 Build .exe Installer (Windows)

This creates a standalone Windows installer — no need for a running dev server.

```bash
# Step 1 — Install dependencies (if not done)
npm install

# Step 2 — Build the Windows installer
npm run electron:build:win
```

⏳ This takes 2–5 minutes the first time (downloads Electron binaries).

✅ Output: `dist\APIForge Setup 1.0.0.exe`

Double-click the .exe to install APIForge on your PC.

---

## 🍎 Build for macOS (.dmg)

```bash
npm install
npm run electron:build:mac
```

Output: `dist/APIForge-1.0.0.dmg`

---

## 🐧 Build for Linux (AppImage)

```bash
npm install
npm run electron:build:linux
```

Output: `dist/APIForge-1.0.0.AppImage`

```bash
chmod +x dist/APIForge-1.0.0.AppImage
./dist/APIForge-1.0.0.AppImage
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | New request tab |
| `Ctrl+W` | Close current tab |
| `Enter` (in URL bar) | Send request |

---

## 🗂️ Project Structure

```
apiforge-electron/
├── electron/
│   ├── main.js          ← Electron main process (window, menus)
│   └── preload.js       ← Secure IPC bridge
├── app/
│   ├── page.tsx         ← Main layout
│   ├── globals.css      ← Dark theme
│   └── api/proxy/       ← HTTP proxy (web mode only)
├── components/
│   ├── Sidebar.tsx      ← Collections, history, environments
│   ├── RequestEditor.tsx← Request + response editor
│   └── TabBar.tsx       ← Tab strip
├── store/
│   └── useAppStore.ts   ← Zustand state
├── next.config.ts       ← Static export config for Electron
└── package.json         ← Scripts + build config
```

---

## ❓ Troubleshooting

**`NODE_ENV is not recognized`**
→ Make sure you ran `npm install` — this installs `cross-env` which fixes Windows env variable syntax.

**Blank white window when running `electron:dev`**
→ Make sure `npm run dev` is running in another terminal first (Electron loads from localhost:3000 in dev mode).

**Build fails with icon error**
→ You can remove the `"icon"` lines from `package.json` under `"build" > "win"` — icons are optional.

**`electron: command not found`**
→ Run `npm install` again. If still broken: `npx electron .`

**CORS errors in browser mode**
→ In browser mode, all requests go through the built-in `/api/proxy`. In Electron mode, requests go direct (no CORS restrictions).
