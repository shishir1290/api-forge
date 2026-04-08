const {
  app,
  BrowserWindow,
  Menu,
  shell,
  ipcMain,
  protocol,
  net,
} = require("electron");
const { pathToFileURL } = require("url");
const path = require("path");
const fs = require("fs");
const isDev = process.env.NODE_ENV === "development";

let mainWindow;

// Register the app scheme as privileged to allow fetch and other standard browser features
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      allowServiceWorkers: true,
    },
  },
]);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    backgroundColor: "#0d1117",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    // Automatically open DevTools in build to help debug
    // if (!isDev) {
    //   mainWindow.webContents.openDevTools();
    // }
  });

  if (isDev) {
    mainWindow.loadURL("http://10.81.100.62:6600");
  } else {
    // Load the exported static Next.js app via custom protocol
    // Loading app://static/ (without index.html) allows Next.js to handle the root correctly
    mainWindow.loadURL("app://static/");
  }

  // Native menu
  const template = [
    ...(process.platform === "darwin"
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "New Request",
          accelerator: "CmdOrCtrl+T",
          click: () => mainWindow.webContents.send("new-tab"),
        },
        {
          label: "Close Tab",
          accelerator: "CmdOrCtrl+W",
          click: () => mainWindow.webContents.send("close-tab"),
        },
        { type: "separator" },
        process.platform === "darwin" ? { role: "close" } : { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Learn More",
          click: () => shell.openExternal("https://github.com"),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  // Register custom protocol to serve static files
  protocol.handle("app", (request) => {
    try {
      const { pathname } = new URL(request.url);

      // Standard scheme pathname starts with / (e.g., /index.html)
      let relativePath = pathname.substring(1);

      // Default to index.html for root requests
      if (!relativePath || relativePath === "") {
        relativePath = "index.html";
      }

      // Handle directory indexes (Next.js trailingSlash: true)
      if (!path.extname(relativePath)) {
        relativePath = path.join(relativePath, "index.html");
      }

      const filePath = path.join(__dirname, "../out", relativePath);

      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        const extension = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
          ".json": "application/json",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".gif": "image/gif",
          ".svg": "image/svg+xml",
          ".ico": "image/x-icon",
        };

        return new Response(data, {
          headers: {
            "Content-Type": mimeTypes[extension] || "application/octet-stream",
          },
        });
      } else {
        // Fallback to index.html for Next.js routing paths
        const fallbackPath = path.join(__dirname, "../out/index.html");
        if (fs.existsSync(fallbackPath)) {
          return new Response(fs.readFileSync(fallbackPath), {
            headers: { "Content-Type": "text/html" },
          });
        }
        return new Response("Not Found", { status: 404 });
      }
    } catch (err) {
      console.error("Protocol Handler Error:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  });

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
