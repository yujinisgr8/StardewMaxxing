import { app, BrowserWindow, shell, protocol, net } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// vite-plugin-electron sets these env vars during dev.
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const RENDERER_DIST = path.join(__dirname, '../dist');

// Some macOS GPU drivers leave the Electron window stuck on a blank/partial first frame
// even though the page renders fine. This is a static pixel-art utility, so GPU compositing
// buys us nothing — disabling it sidesteps that class of blank-window bug.
app.disableHardwareAcceleration();

// Serve the built renderer over a custom "app://" scheme instead of file://. A real, secure
// origin avoids file:// quirks (ES-module CORS failures, unreliable MIME types — which is what
// made the bundle render as raw text). We set Content-Type explicitly per extension.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

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
    void win.loadURL('app://bundle/index.html');
  }
}

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

app.whenReady().then(() => {
  // Map app://bundle/<path> → <dist>/<path>, with an explicit Content-Type.
  protocol.handle('app', async (request) => {
    const { pathname } = new URL(request.url);
    const rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
    const filePath = path.join(RENDERER_DIST, rel);
    // Guard against path traversal outside the bundled renderer.
    if (!filePath.startsWith(RENDERER_DIST)) return new Response('Forbidden', { status: 403 });
    const res = await net.fetch(pathToFileURL(filePath).toString());
    if (!res.ok) return res;
    const type = MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
    return new Response(res.body, { headers: { 'Content-Type': type } });
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
  win = null;
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
