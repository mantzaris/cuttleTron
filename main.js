const { app, BrowserWindow, ipcMain, desktopCapturer } = require("electron");
const fs = require("fs");
const path = require("path");

const { myWriteFileSync } = require("./main-fns/main-utilities.js");
const {
  getSinkList,
  startAudioRecording,
  pauseAudioRecording,
  resumeAudioRecording,
  cancelAudioRecording,
  stopAudioRecording,
  recordingsCompleted,
} = require("./main-fns/audio-utilities.js");

const packageJson = require("./package.json");
const appName = packageJson.name;
const TARGET_DIR = path.join(__dirname, "..", appName + "Files");

// Enable hot-reloading for development
if (process.env.NODE_ENV !== "production") {
  require("electron-reload")(__dirname, {
    electron: path.join(__dirname, "node_modules", ".bin", "electron"),
  });
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    title: appName,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("main.html");

  if (process.env.NODE_ENV === "development") {
    // Keep the default menu in development mode
  } else {
    mainWindow.setMenu(null); // remove the menu bar and deactivates devTools
  }

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

//make folders
let main_folder_exists = fs.existsSync(TARGET_DIR);
if (!main_folder_exists) fs.mkdirSync(TARGET_DIR);

//due to nodeIntegration being false these node libraries come from here
ipcMain.handle("getDirname", () => {
  return __dirname;
});
ipcMain.handle("joinPath", (event, strArray) => {
  return path.join(...strArray);
});
ipcMain.handle("getTargetDir", () => {
  return TARGET_DIR;
});
ipcMain.handle("writeFileSync", (event, arg_obj) => {
  myWriteFileSync(event, arg_obj);
});
//ge the list of ids of screens or windows to record with the electron mediaRecorder (audio on linux no go)
ipcMain.handle("getCaptureID", async (event) => {
  const screen_sources = await desktopCapturer.getSources({ types: ["window", "screen"] });

  const mappedScreenSources = screen_sources.map((source) => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL({ scaleFactor: 0.25 }),
  }));

  return mappedScreenSources;
});

//*trying to use any npm package to get the audio or even repos for pulse audio specifically like
// https://github.com/mscdex/paclient worked within nodejs itself but totally failed in electronjs
ipcMain.handle("getSinks", async (event) => {
  return await getSinkList();
});

//record audio from sink monitor provided
ipcMain.handle("startAudioRecording", (event, sink_monitor, filepath) => {
  startAudioRecording(sink_monitor, filepath);
});

// Pause recording
ipcMain.handle("pauseAudioRecording", (event) => {
  pauseAudioRecording();
});
// Resume recording
ipcMain.handle("resumeAudioRecording", (event, sink_monitor, audio_path) => {
  // Append a timestamp to the filepath to ensure uniqueness
  resumeAudioRecording(sink_monitor, audio_path);
});

// Cancel recording and reset the audioSegments array and ffmpegProcess
ipcMain.handle("cancelAudioRecording", (event) => {
  cancelAudioRecording();
});

// Stop recording
ipcMain.handle("stopAudioRecording", (event, recording_bool) => {
  stopAudioRecording(recording_bool);
});

ipcMain.on("recordings-completed", async (event, args) => {
  recordingsCompleted(args);
});
