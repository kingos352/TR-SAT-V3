const { contextBridge } = require('electron');

// Expose a minimal safe API to the renderer if needed.
// In this case, we expose nothing sensitive. 
// TR-SAT Mission Control V3 uses standard HTTP and WebSocket directly to the local backend.

contextBridge.exposeInMainWorld('electronAPI', {
  // Empty for now, but provides a placeholder if IPC is needed later.
});
