// electron.d.ts
interface ElectronAPI {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => void;
    on: (channel: string, listener: (...args: any[]) => void) => void;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
  };
  // Add other properties from your preload.js if needed
}

interface Window {
  electron: ElectronAPI;
}
