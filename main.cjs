///////
// requires ffmpeg to be installed on the system
// requires ...sudo apt-get install gstreamer1.0-tools gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly
/////////
const { app, BrowserWindow, ipcMain, desktopCapturer } = require("electron");
const fs = require("fs");
const path = require("path");

const { myWriteFileSync } = require("./main-fns/main-utilities.cjs");
const {
  getSinksAndSourcesList,
  startAudioRecording,
  pauseAudioRecording,
  resumeAudioRecording,
  cancelAudioRecording,
  stopAudioRecording,
  recordingsCompleted,
} = require("./main-fns/audio-utilities.cjs");
const { audioEffectsStart, audioEffectsStop, cleanupAudioDevices } = require("./main-fns/audio-effects.cjs");

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
    width: 1200,
    height: 800,
    title: appName,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.loadFile("main.html");

  if (process.env.NODE_ENV === "development") {
    // Keep the default menu in development mode
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.setMenu(null); // remove the menu bar and deactivates devTools
  }

  mainWindow.on("closed", function () {
    mainWindow = null;

    if (maskcam_window) {
      maskcam_window.close();
    }
  });
}

app.on("ready", createWindow);

app.on("before-quit", async (event) => {
  // Prevent the default behavior first if needed
  event.preventDefault();

  await audioEffectsStop();
  await cleanupAudioDevices();

  app.quit();
});

app.on("window-all-closed", async function () {
  //await audioEffectsStop();
  //app.quit();
});

app.on("will-quit", async (event) => {
  // Prevent the default quit process to perform cleanup
  event.preventDefault();

  try {
    await audioEffectsStop();
    await cleanupAudioDevices();
  } catch (error) {
    console.error("Error during cleanup:", error);
  }

  // Now allow the app to quit
  app.quit();
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
ipcMain.handle("existsSync", (event, path) => {
  return fs.existsSync(path);
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
ipcMain.handle("get-sinks-sources", async (event) => {
  return await getSinksAndSourcesList();
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

// AUDIO EFFECTS
ipcMain.handle("audioeffects-start", async (event, effects_params) => {
  try {
    const status = await audioEffectsStart(effects_params);
    return status;
  } catch (error) {
    // Handle any errors
    console.error("Error in trying to engage audioEffectsStart:", error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle("audioeffects-stop", async (event) => {
  await audioEffectsStop();
});

ipcMain.handle("audioeffects-cleanup", async (event) => {
  await cleanupAudioDevices();
});

/////////////////////////////////////
//for maskcam
/////////////////////////////////////
let maskcam_window;
let currentColor = "gray"; // Initial color

ipcMain.on("start-maskcam", () => {
  if (maskcam_window) {
    maskcam_window.focus(); // Focus the already opened window instead of creating a new one
    return;
  }

  maskcam_window = new BrowserWindow({
    width: 800,
    height: 500,
    minimizable: false,
    maximizable: false,
    resizable: true,
    frame: false, // Remove window frame
    transparent: false, // transparent background
    backgroundColor: "blue",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
      webviewTag: false,
    }, //skipTaskbar boolean (optional) macOS Windows - Whether to show the window in taskbar. Default is false
  }); //offscreen boolean (optional) - Whether to enable offscreen rendering for the browser window
  //win.setAspectRatio(aspectRatio[, extraSize])
  //win.setSize(width, height[, animate])  win.getSize()
  //win.getMediaSourceId()

  maskcam_window.setMenu(null); // remove the menu bar and deactivates devTools

  // maskcam_window.loadFile("maskcam-view.html");

  maskcam_window.show(); // Show the window after loading //win.destroy() //win.isDestroyed() //win.isVisible()
  maskcam_window.loadFile("maskcam-view.html");

  if (process.env.NODE_ENV !== "production") {
    maskcam_window.webContents.openDevTools();
  }

  maskcam_window.on("closed", function () {
    maskcam_window = null;
  });
});

ipcMain.handle("mask-opened", () => {
  return maskcam_window !== null;
});

ipcMain.on("resize-window", (event, { aspectRatio }) => {
  if (maskcam_window) {
    const currentHeight = maskcam_window.getSize()[1]; // Keep the current height
    const newWidth = Math.round(currentHeight * aspectRatio);
    maskcam_window.setSize(newWidth, currentHeight);
  }
});
