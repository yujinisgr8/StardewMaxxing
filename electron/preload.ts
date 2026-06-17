// Minimal preload. The renderer is a self-contained React app working off bundled
// JSON data, so no privileged bridge is required yet. Kept for contextIsolation safety
// and as a hook point if we later add file export / settings persistence.
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('stardewmaxxing', {
  version: '0.1.0',
});
