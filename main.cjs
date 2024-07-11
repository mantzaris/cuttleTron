///////
// requires ffmpeg to be installed on the system
// requires ...sudo apt-get install gstreamer1.0-tools gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly
// v4l2loopback-dkms v4l2loopback-utils, wmctrl,
/////////
const { app, BrowserWindow, ipcMain, desktopCapturer, dialog } = require("electron");
const os = require("os");
const fs = require("fs");
const path = require("path");


const systemEndianness = os.endianness();

const { streamMaskcamToDevice, stopMaskcamStream } = require("./main-fns/maskcam.cjs");

const { myWriteFileSync, showDialog, systemX11orWayland, installDependencies, createGif } = require("./main-fns/main-utilities.cjs");
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

let X11orWayland = systemX11orWayland();
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

  mainWindow.setMenu(null);
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
  // event.preventDefault();

  console.log("before before quit");

  await audioEffectsStop();
  await cleanupAudioDevices();
  // app.quit();
  console.log("Cleanup completed. before quit");
});

// app.on("window-all-closed", async function () {
//   //await audioEffectsStop();
//   //app.quit();
// });

app.on("will-quit", async (event) => {
  console.log("before will  quit");
  await audioEffectsStop();
  await cleanupAudioDevices();

  console.log("Cleanup completed. will quit");
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
ipcMain.handle('getCaptureID', async (event) => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen']
    });

    if (!sources || sources.length === 0) {
      throw new Error('No sources available');
    }

    // If specific thumbnail scaling is needed, maintain that feature from cuttleTron
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL({ scaleFactor: 0.25 }) // Adjust scaleFactor as needed
    }));
  } catch (error) {
    console.error('Error getting capture sources:', error);
    return null;  // Ensures upstream code can handle the error gracefully
  }
});

ipcMain.handle("systemX11orWayland", async (event) => {
  return X11orWayland;
});


////////////////////////////////////
//dialog handler
////////////////////////////////////
ipcMain.handle('show-dialog', async (event, options) => {
  const response = await showDialog(options);
  return response.response; // Return the index of the clicked button
});


////////////////////////////////////
//install dependencies
////////////////////////////////////
ipcMain.handle("install-dependencies", async () => {
  try {
    return await installDependencies();
  } catch (error) {
    console.error(`Installation error: ${error}`);
    return { success: false, error: error.message };
  }
});


///////////////////////////////////////////
// *handler for creating a GIF
///////////////////////////////////////////
ipcMain.handle("create-gif", async (event , baseFilename, numDigits,startNumber, endNumber, FPS) => {
  console.log({baseFilename, numDigits,startNumber, endNumber, FPS, TARGET_DIR});
  
  try {
    const result = await createGif(baseFilename, numDigits, startNumber, endNumber, FPS, TARGET_DIR);
    return result;
  } catch (error) {
      throw new Error(`Error creating GIF: ${error.message}`);
  }
})


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

//////////////////////////////////////////////////////////////////////////
//* for maskcam
//////////////////////////////////////////////////////////////////////////
const maskcamWindowTitle = "cuttleTronMaskcam";
let maskcam_window;

let maskcamWinIdInt;
let maskcamWinIdHex;

let webcamAspectRatio;
let webcamWidth;
let webcamHeight;
let maskcamWidth;
let maskcamHeight;

let isCleanupInitiated = false;

function resetMaskCam() {
  if (maskcam_window) {
    maskcam_window.close();
    maskcam_window = null;
  }

  maskcamWinIdInt = maskcamWinIdHex = null;
  webcamAspectRatio = null;
  webcamWidth = webcamHeight = null;
  maskcamWidth = maskcamHeight = null;
}

ipcMain.handle("mask-opened", () => {
  return maskcam_window && !maskcam_window.isDestroyed() && maskcam_window.isVisible();
});

ipcMain.on("stop-maskcam", async (event) => {
  maskcam_window.webContents.send("stop-maskcam"); //calls renderer handler

  if (!isCleanupInitiated && maskcam_window) {
    isCleanupInitiated = await stopMaskcamStream(isCleanupInitiated);
    resetMaskCam();
  }
});

ipcMain.on("update-maskcam", (event, mask_settings) => {
  if (!maskcam_window) {
    console.error("MaskCam window is not available.");
    return;
  }

  maskcam_window.webContents.send("toggle-mask-view", mask_settings);
});

ipcMain.handle("stream-maskcam", async (event, mask_settings) => {
  if (maskcam_window && !maskcam_window.isDestroyed()) {
    const standardResolutions = [
      { width: 640, height: 480 }, // 4:3
      { width: 1280, height: 720 }, // 16:9
      { width: 1920, height: 1080 }, // 16:9
      // Add more resolutions if necessary
    ];

    let bestMatch = standardResolutions[0];
    for (const res of standardResolutions) {
      if (Math.abs(res.width / res.height - webcamAspectRatio) < Math.abs(bestMatch.width / bestMatch.height - webcamAspectRatio)) {
        bestMatch = res;
      }
    }

    // Update the window size to the best matching standard resolution
    maskcamWidth = bestMatch.width;
    maskcamHeight = bestMatch.height;

    await maskcam_window.setSize(maskcamWidth, maskcamHeight);
    await maskcam_window.setResizable(false);
    maskcam_window.setAlwaysOnTop(true);

    maskcam_window.webContents.send("toggle-mask-view", mask_settings);
  }

  await maskcam_window.webContents.send("anchor-mask-view");
  streamMaskcamToDevice(maskcamWindowTitle, maskcamWinIdHex);
  return maskcamWindowTitle;
});

ipcMain.handle("init-maskcam", async (event, mask_settings) => {
  if (maskcam_window) {
    maskcam_window.focus(); // Focus the already opened window instead of creating a new one
    return;
  }

  isCleanupInitiated = false;

  maskcam_window = new BrowserWindow({
    title: maskcamWindowTitle,
    width: 640,
    height: 480, //640x480 is the 4:3 aspect ratio init
    minimizable: false,
    maximizable: false,
    resizable: true,
    frame: false, // Remove window frame
    transparent: false, // transparent background
    backgroundColor: "blue",
    webPreferences: {
      nodeIntegration: true, //needed for tensorflow in the renderer window...
      nodeIntegrationInWorker: true, // Enable Node.js integration in Web Workers
      contextIsolation: false,
      // preload: path.join(__dirname, "preload.cjs"),
      webviewTag: false,
    }, //skipTaskbar boolean (optional) macOS Windows - Whether to show the window in taskbar. Default is false
  }); //offscreen boolean (optional) - Whether to enable offscreen rendering for the browser window
  //win.setAspectRatio(aspectRatio[, extraSize]) //win.setSize(width, height[, animate])  win.getSize() //win.getMediaSourceId()
  //TODO: remove from the toolbar too

  await maskcam_window.setMenu(null); // remove the menu bar and deactivates devTools

  await maskcam_window.show(); // Show the window after loading //win.destroy() //win.isDestroyed() //win.isVisible()
  await maskcam_window.loadFile("maskcam-view.html");

  //TODO: do for Wayland as well
  let buffer = maskcam_window.getNativeWindowHandle(); // The buffer contains the window ID in a platform-specific format For X11 on Linux, the ID is an unsigned long (32-bit) integer in the buffer
  // Read the window ID based on the system's endianness
  if (systemEndianness === "LE") {
    maskcamWinIdInt = buffer.readUInt32LE(0);
  } else {
    maskcamWinIdInt = buffer.readUInt32BE(0);
  }

  maskcamWinIdHex = `0x${maskcamWinIdInt.toString(16).padStart(8, "0")}`;

  console.log(`--------Window ID int: ${maskcamWinIdInt}, maskcamWinIdHex: ${maskcamWinIdHex}`);

  await maskcam_window.webContents.send("toggle-mask-view", mask_settings);

  if (process.env.NODE_ENV !== "production") {
    maskcam_window.webContents.openDevTools();
  }

  maskcam_window.on("closed", async function () {
    if (!isCleanupInitiated) {
      isCleanupInitiated = await stopMaskcamStream(isCleanupInitiated); // This is async, so it might still be running when resetMaskCam() executes
      resetMaskCam();
    }
  });

  return "move window, then stream";
});

//called from maskcam-view
ipcMain.on("webcam-size", (event, webcam_specs) => {
  if (maskcam_window && !maskcam_window.isDestroyed()) {
    const { width, height } = webcam_specs;
    // Update global variables
    webcamWidth = width;
    webcamHeight = height;
    webcamAspectRatio = width / height; // Calculate the aspect ratio

    console.log(`Webcam Aspect Ratio: ${webcamAspectRatio}, webcamWidth=${webcamWidth}, webcamHeight=${webcamHeight}`);
  }
});
