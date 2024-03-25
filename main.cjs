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
const maskcamWindowTitle = "cuttleTronMaskcam";

let ffmpegProcess = null;

let maskcam_window;
let maskcamWinIdInt;
let maskcamWinIdHex; //needed? TODO:

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
    await stopMaskcamStream();
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

    maskcam_window.webContents.send("toggle-mask-view", mask_settings);
  }

  await maskcam_window.webContents.send("anchor-mask-view");
  streamMaskcamToDevice();
});

ipcMain.on("init-maskcam", async (event, mask_settings) => {
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

  await maskcam_window.setMenu(null); // remove the menu bar and deactivates devTools

  await maskcam_window.show(); // Show the window after loading //win.destroy() //win.isDestroyed() //win.isVisible()
  await maskcam_window.loadFile("maskcam-view.html");

  //TODO: do for Wayland as well
  let buffer = maskcam_window.getNativeWindowHandle(); // The buffer contains the window ID in a platform-specific format For X11 on Linux, the ID is an unsigned long (32-bit) integer in the buffer
  // Read the window ID based on the system's endianness
  if (systemEndianness === "LE") {
    maskcamWinIdInt = buffer.readUInt32LE(0);
    //TODO: get the hex as well
  } else {
    maskcamWinIdInt = buffer.readUInt32BE(0);
  }

  maskcamWinIdHex = maskcamWinIdInt.toString(16);

  console.log(`--------Window ID int: ${maskcamWinIdInt}, maskcamWinIdHex: ${maskcamWinIdHex}`);

  await maskcam_window.webContents.send("toggle-mask-view", mask_settings);

  if (process.env.NODE_ENV !== "production") {
    //TODO: uncomment
    // maskcam_window.webContents.openDevTools();
  }

  maskcam_window.on("closed", function () {
    if (!isCleanupInitiated) {
      stopMaskcamStream(); // This is async, so it might still be running when resetMaskCam() executes
      resetMaskCam();
    }
  });
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

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// stream maskcam
// sudo modprobe -r v4l2loopback; sudo modprobe v4l2loopback video_nr=54 card_label="cuttleTron"
////////////////////////////////////////////////////////////////////////////////////////////////////////
const sudo = require("sudo-prompt");
const { exec, execSync, spawn } = require("child_process");
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
  const command = `modprobe -r v4l2loopback && modprobe v4l2loopback video_nr=${videoDevIdNum} card_label="${maskcamWindowTitle}"`;

  try {
    // Executing the combined command with sudo
    await sudoExecAsync(command, { name: "cuttleTron" });

    console.log(`Device /dev/video${videoDevIdNum} created successfully with label ${maskcamWindowTitle}.`);

    output = execSync("v4l2-ctl --list-devices").toString();
    console.log(`in createMaskcamVideoDevice 2, v4l2-ctl --list-devices = ${output}`);

    return videoDevIdNum;
  } catch (error) {
    console.error(`Error in creating video device: ${error}`);
    videoDevIdNum = null;
    return null;
  }
}

//wmctrl -l to get the ids in hex
// xwininfo -id  0x4600002: to get the dimensions and position for ffmpeg
// ffmpeg -probesize 10M -analyzeduration 10M -f x11grab -framerate 30 -video_size 1280x720 -i :0.0+2582,491 -vf "hflip" -f v4l2 -vcodec rawvideo -pix_fmt yuv420p /dev/video12
// const ffmpegCommand = `ffmpeg -probesize 10M -analyzeduration 10M -f x11grab -framerate 30 -video_size 1280x720 -i :0.0+2582,491 -vf "hflip" -f v4l2 -vcodec rawvideo -pix_fmt yuv420p /dev/video${videoDevIdNum}`;
async function streamMaskcamToDevice() {
  try {
    console.log("Starting device creation and streaming process");
    await createMaskcamVideoDevice(); // set the global device ID
  } catch (error) {
    console.error(`Error in streamMaskcamToDevice trying to set the maskcam video device and ID: ${error}`);
  }

  const ffmpegCommand = `ffmpeg`;
  const ffmpegArgs = [
    "-loglevel",
    "error",
    "-probesize",
    "10M",
    "-analyzeduration",
    "10M",
    "-f",
    "x11grab",
    "-framerate",
    "30",
    "-video_size",
    "1280x720",
    "-i",
    `:0.0+2582,491`,
    "-vf",
    "hflip",
    "-f",
    "v4l2",
    "-vcodec",
    "rawvideo",
    "-pix_fmt",
    "yuv420p",
    `/dev/video${videoDevIdNum}`,
  ];

  try {
    if (!videoDevIdNum) {
      console.error("No video device ID returned. Exiting the streaming process.");
      return;
    }

    const output = execSync("v4l2-ctl --list-devices").toString();
    console.log(`in streamMaskcamToDevice, v4l2-ctl --list-devices = ${output}`);

    console.log("prior to spawning ffmpeg command");
    console.log(`Using device: /dev/video${videoDevIdNum}`);
    console.log(`Executing ffmpeg command: ffmpeg ${ffmpegArgs.join(" ")}`);

    ffmpegProcess = spawn(ffmpegCommand, ffmpegArgs);

    ffmpegProcess.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    ffmpegProcess.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    ffmpegProcess.on("close", (code) => {
      console.log(`FFmpeg process exited with code ${code}`);
      ffmpegProcess = null;
    });
  } catch (error) {
    console.error(`Error during ffmpeg process spawning: ${error}`);
  }
}

async function stopMaskcamStream() {
  // Handle closing the ffmpeg process when your application exits or when needed
  if (ffmpegProcess) {
    console.log("Terminating maskcam stream process...");
    ffmpegProcess.kill("SIGTERM"); //SIGINT || SIGKILL
    ffmpegProcess = null;
  }

  if (isCleanupInitiated) return;

  console.log("Removing all v4l2loopback devices...");

  try {
    const options = { name: "cuttleTron" };
    const command = "modprobe -r v4l2loopback";
    const result = await sudoExecAsync(command, options);

    console.log("All v4l2loopback devices removed successfully:", result);
    isCleanupInitiated = true;
  } catch (error) {
    console.error(`Failed to remove v4l2loopback devices: ${error}`);
  }
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

// console.log(`Device ID in streamMaskcamToDevice: ${videoDevIdNum}`);
// const output = await execAsync("v4l2-ctl --list-devices");
// console.log(`Device list:\n${output.stdout}`);
