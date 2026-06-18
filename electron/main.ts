import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// vite-plugin-electron sets these env vars during dev.
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const RENDERER_DIST = path.join(__dirname, '../dist');

// Some macOS GPU drivers leave the Electron window stuck on a blank/partial first frame
// even though the page renders fine. This is a static pixel-art utility, so GPU compositing
// buys us nothing — disabling it sidesteps that class of blank-window bug.
app.disableHardwareAcceleration();

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 740,
    minWidth: 860,
    minHeight: 600,
    title: 'StardewMaxxing',
    backgroundColor: '#3a2417',
    show: false, // wait for the first paint so the window never appears blank/half-rendered
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Reveal only once the renderer has painted its first frame.
  win.once('ready-to-show', () => win?.show());
  // Safety net: never let the window get stuck hidden if ready-to-show is missed.
  setTimeout(() => { if (win && !win.isVisible()) win.show(); }, 3000);

  // Open external links in the default browser, never inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (DEV_SERVER_URL) {
    void win.loadURL(DEV_SERVER_URL);
  } else {
    void win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
  win = null;
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
