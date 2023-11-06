const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    send: ipcRenderer.send,
    on: ipcRenderer.on,
    invoke: ipcRenderer.invoke,
  },
});

contextBridge.exposeInMainWorld("nodeModules", {
  getDirname: () => ipcRenderer.invoke("getDirname"),
  joinPath: (strArray) => ipcRenderer.invoke("joinPath", strArray),
  writeFileSync: (obj_args) => ipcRenderer.invoke("writeFileSync", obj_args),
  bufferFrom: (data, encoding) => Buffer.from(data, encoding),
  writeVideoSync: (filePath, data, encoding) => ipcRenderer.invoke("writeVideoSync", filePath, data, encoding),
});
