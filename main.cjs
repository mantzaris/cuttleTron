///////
// requires ffmpeg to be installed on the system
// requires ...sudo apt-get install gstreamer1.0-tools gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly
// v4l2loopback-dkms v4l2loopback-utils
/////////
const { app, BrowserWindow, ipcMain, desktopCapturer } = require("electron");
const os = require("os");
const fs = require("fs");
const path = require("path");

const systemEndianness = os.endianness();

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

//////////////////////////////////////////////////////////////////////////
//for maskcam
//////////////////////////////////////////////////////////////////////////
let maskcam_window;
let maskcam_winId;

let webcamAspectRatio;
let webcamWidth;
let webcamHeight;
let maskcamWidth;
let maskcamHeight;

function resetMaskCam() {
  maskcam_window.close();
  stopMaskcamStream();
  maskcam_window = maskcam_winId = null;
  webcamAspectRatio = null;
  webcamWidth = webcamHeight = null;
  maskcamWidth = maskcamHeight = null;
}

ipcMain.handle("mask-opened", () => {
  return maskcam_window && !maskcam_window.isDestroyed() && maskcam_window.isVisible();
});

ipcMain.on("stop-maskcam", async (event) => {
  maskcam_window.webContents.send("stop-maskcam"); //calls renderer handler

  if (maskcam_window) {
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

ipcMain.on("stream-maskcam", async (event, mask_settings) => {
  if (maskcam_window && !maskcam_window.isDestroyed()) {
    let [width, height] = maskcam_window.getSize();
    const currentAspectRatio = width / height;

    if (currentAspectRatio > webcamAspectRatio) {
      // Current aspect ratio is wider than webcam's, adjust width to match
      width = Math.round(height * webcamAspectRatio);
    } else {
      // Current aspect ratio is taller, adjust height to match
      height = Math.round(width / webcamAspectRatio);
    }

    // Update global variables
    maskcamWidth = width;
    maskcamHeight = height;

    maskcam_window.setSize(maskcamWidth, maskcamHeight);
    maskcam_window.setResizable(false);
    maskcam_window.setAlwaysOnTop(true);
  }

  await maskcam_window.webContents.send("anchor-mask-view");
  streamMaskcamToDevice();
});

ipcMain.on("init-maskcam", async (event, mask_settings) => {
  if (maskcam_window) {
    maskcam_window.focus(); // Focus the already opened window instead of creating a new one
    return;
  }

  maskcam_window = new BrowserWindow({
    title: "cuttleTronMaskcam",
    width: 640,
    height: 480, //640x480 is the 4:3 aspect ratio init
    minimizable: false,
    maximizable: false,
    resizable: true,
    frame: false, // Remove window frame
    transparent: false, // transparent background
    backgroundColor: "blue",
    webPreferences: {
      nodeIntegration: true, // Enable Node.js integration
      nodeIntegrationInWorker: true, // Enable Node.js integration in Web Workers
      contextIsolation: false,
      // preload: path.join(__dirname, "preload.cjs"),
      webviewTag: false,
    }, //skipTaskbar boolean (optional) macOS Windows - Whether to show the window in taskbar. Default is false
  }); //offscreen boolean (optional) - Whether to enable offscreen rendering for the browser window
  //win.setAspectRatio(aspectRatio[, extraSize]) //win.setSize(width, height[, animate])  win.getSize() //win.getMediaSourceId()

  await maskcam_window.setMenu(null); // remove the menu bar and deactivates devTools

  await maskcam_window.show(); // Show the window after loading //win.destroy() //win.isDestroyed() //win.isVisible()
  await maskcam_window.loadFile("maskcam-view.html");

  //TODO: do for Wayland as well
  let buffer = maskcam_window.getNativeWindowHandle(); // The buffer contains the window ID in a platform-specific format For X11 on Linux, the ID is an unsigned long (32-bit) integer in the buffer
  // Read the window ID based on the system's endianness
  if (systemEndianness === "LE") {
    maskcam_winId = buffer.readUInt32LE(0);
  } else {
    maskcam_winId = buffer.readUInt32BE(0);
  }

  console.log(`--------Window ID: ${maskcam_winId}`);

  await maskcam_window.webContents.send("toggle-mask-view", mask_settings);

  if (process.env.NODE_ENV !== "production") {
    //TODO: uncomment
    // maskcam_window.webContents.openDevTools();
  }

  maskcam_window.on("closed", function () {
    stopMaskcamStream();
    resetMaskCam();
  });
});

//called from maskcam-view
ipcMain.on("webcam-size", (event, { webcam_specs }) => {
  if (maskcam_window && !maskcam_window.isDestroyed()) {
    const { width, height } = webcam_specs;
    // Update global variables
    webcamWidth = width;
    webcamHeight = height;
    webcamAspectRatio = width / height; // Calculate the aspect ratio

    console.log(`Webcam Aspect Ratio: ${webcamAspectRatio}, webcamWidth=${webcamWidth}, webcamHeight=${webcamHeight}`);
  }
});

/////////////////////
//stream maskcam
//sudo modprobe -r v4l2loopback; sudo modprobe v4l2loopback video_nr=54 card_label="cuttleTron"
////////////////////
const sudo = require("sudo-prompt");
const { exec, execSync } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);
const sudoExecAsync = promisify(sudo.exec);

let videoDevIdNum = null;
let gstProcess = null;
//TODO: check if X11 or Wayland, new approaches should have a modern version of device management https://github.com/umlaeute/v4l2loopback?tab=readme-ov-file#dynamic-device-management
//https://github.com/umlaeute/v4l2loopback?tab=readme-ov-file#dynamic-device-management
async function createMaskcamVideoDevice() {
  let output = execSync("v4l2-ctl --list-devices").toString();
  console.log(`in createMaskcamVideoDevice 1, v4l2-ctl --list-devices = ${output}`);

  // Generating a random device number between 30 and 60
  videoDevIdNum = Math.floor(Math.random() * (61 - 30) + 30);
  const cardLabel = "cuttleTronVidStream";
  const command = `modprobe -r v4l2loopback && modprobe v4l2loopback video_nr=${videoDevIdNum} card_label="${cardLabel}"`;

  try {
    // Executing the combined command with sudo
    await sudoExecAsync(command, { name: "Your Application" });

    console.log(`Device /dev/video${videoDevIdNum} created successfully with label ${cardLabel}.`);

    output = execSync("v4l2-ctl --list-devices").toString();
    console.log(`in createMaskcamVideoDevice 2, v4l2-ctl --list-devices = ${output}`);

    return videoDevIdNum;
  } catch (error) {
    console.error(`Error in creating video device: ${error}`);
    videoDevIdNum = null;
    return null;
  }
}

async function streamMaskcamToDevice() {
  try {
    console.log("Starting device creation and streaming process");
    videoDevIdNum = await createMaskcamVideoDevice(); // Capture the returned device ID

    if (!videoDevIdNum) {
      console.error("No video device ID returned. Exiting the streaming process.");
      return;
    }

    console.log(`Device ID obtained: ${videoDevIdNum}`);
    const output = await execAsync("v4l2-ctl --list-devices");
    console.log(`Device list:\n${output.stdout}`);

    // const gstCommand = `gst-launch-1.0 ximagesrc xid=${maskcam_winId} ! videoconvert ! videoscale ! queue ! video/x-raw,format=BGRx,width=667,height=500,framerate=30/1 ! v4l2sink device=/dev/video${videoDevIdNum}`;
    // const gstCommand = `ffmpeg -f x11grab -i :0.0+100,200 -vcodec rawvideo -pix_fmt bgr0 -s 667x500 -r 30 -f v4l2 /dev/video${videoDevIdNum}`;
    const gstCommand = `ffmpeg -f x11grab -i :0.0 -vcodec rawvideo -pix_fmt bgr0 -r 30 -f v4l2 /dev/video${videoDevIdNum}`;
    console.log(`Executing GStreamer command: ${gstCommand}`);
    const gstOutput = await execAsync(gstCommand);

    console.log(`GStreamer process completed.\nstdout: ${gstOutput.stdout}`);
    if (gstOutput.stderr) {
      console.error(`GStreamer stderr: ${gstOutput.stderr}`);
    }
  } catch (error) {
    console.error(`Error during streaming process: ${error}`);
  }
}

async function stopMaskcamStream() {
  // Handle closing the GStreamer process when your application exits or when needed
  if (gstProcess) {
    console.log("Terminating GStreamer process...");
    gstProcess.kill();
    gstProcess = null;
  }

  console.log("Removing all v4l2loopback devices...");
  try {
    await execAsync("sudo modprobe -r v4l2loopback");
    console.log("All v4l2loopback devices removed successfully.");
  } catch (error) {
    console.error(`Failed to remove v4l2loopback devices: ${error}`);
  }

  // Resetting the device ID to null as all devices are removed
  videoDevIdNum = null;
}

//TODO: make window always on top and not moveable once the stream is SET and no resize

//TODO:  add code to remove the virtual video device using the modprobe -r v4l2loopback command when stopping the stream.

//TODO: put at the start of the app start-up and check
// const installCommand = "apt-get install v4l2loopback-dkms";
// sudo.exec(installCommand, { name: "cuttleTron" }, (error, stdout, stderr) => {
//   if (error) throw error;
//   console.log("stdout:", stdout);
//   console.error("stderr:", stderr);
// });

// sudo.exec(command, { name: "cuttleTron" }, (error, stdout, stderr) => {
//   if (error) {
//     console.error(`Error creating device /dev/video${video_dev_id_num}:`, error);
//     return;
//   }
//   console.log(`Device /dev/video${video_dev_id_num} created successfully.`);
// });
