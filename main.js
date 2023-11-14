const { app, BrowserWindow, ipcMain, desktopCapturer } = require("electron");
const fs = require("fs");
const path = require("path");
const { exec, spawn } = require("child_process");
const util = require("util");
const execAsync = util.promisify(exec);

const { myWriteFileSync } = require("./main-fns/main-utilities.js");
const { getSinkList } = require("./main-fns/audio-utilities.js");

const packageJson = require("./package.json");
const appName = packageJson.name;
const TARGET_DIR = path.join(__dirname, "..", appName + "Files");

// Enable hot-reloading for development
if (process.env.NODE_ENV !== "production") {
  require("electron-reload")(__dirname, {
    electron: path.join(__dirname, "node_modules", ".bin", "electron"),
  });
}

let ffmpegProcess = null; // This will hold the child process instance
let audioSegments = []; //holds the segments of audio from the pauses and resumes
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
  const sources = await desktopCapturer.getSources({ types: ["window", "screen"] });
  return sources.map((source) => ({ id: source.id, name: source.name }));
});

//*trying to use any npm package to get the audio or even repos for pulse audio specifically like
// https://github.com/mscdex/paclient worked within nodejs itself but totally failed in electronjs
ipcMain.handle("getSinks", async (event) => {
  return await getSinkList();
});

//record audio from sink monitor provided
ipcMain.handle("startAudioRecording", (event, sink_monitor, filepath) => {
  const ffmpegArgs = ["-f", "pulse", "-i", sink_monitor, filepath];
  ffmpegProcess = spawn("ffmpeg", ffmpegArgs);
  audioSegments.push(filepath);
});

// Pause recording
ipcMain.handle("pauseAudioRecording", (event) => {
  if (ffmpegProcess) {
    ffmpegProcess.kill("SIGTERM");
  } else {
    console.log("ffmpegProcess does not exist.");
  }
});
// Resume recording
ipcMain.handle("resumeAudioRecording", (event, sink_monitor, audio_path) => {
  // Append a timestamp to the filepath to ensure uniqueness
  const timestamp = Date.now();
  const ext = path.extname(audio_path);
  const nameWithoutExt = path.basename(audio_path, ext);
  const dir = path.dirname(audio_path);
  const newFilepath = path.join(dir, `${nameWithoutExt}_${timestamp}${ext}`);

  const ffmpegArgs = ["-f", "pulse", "-i", sink_monitor, newFilepath];
  ffmpegProcess = spawn("ffmpeg", ffmpegArgs);
  audioSegments.push(newFilepath);
});

// Cancel recording
ipcMain.handle("cancelAudioRecording", (event) => {
  if (ffmpegProcess) {
    ffmpegProcess.kill("SIGKILL");
    audioSegments.forEach((segment) => {
      fs.unlink(segment, (err) => {
        if (err) {
          console.error(`Error deleting segment file: ${err}`);
        }
      });
    });
    ffmpegProcess = null;
    audioSegments = [];
  }
});

// Stop recording
ipcMain.handle("stopAudioRecording", (event, recording_bool) => {
  if (ffmpegProcess) {
    ffmpegProcess.kill("SIGTERM");
  }
});

ipcMain.on("recordings-completed", async (event, args) => {
  if (ffmpegProcess) {
    try {
      const { stdout, stderr } = await execAsync(ffmpegProcess.kill("SIGTERM"));
      ffmpegProcess = null;
      if (stderr) {
        console.error(stderr);
      }
    } catch {
      console.log("cant kill the previous ffmpeg");
    }
  }
  const { videoPath, outputPath } = args;
  const mergedAudioPath = path.join(path.dirname(videoPath), "merged_audio.wav");
  // Generate concat_list.txt
  const concatList = audioSegments.map((segment) => `file '${segment}'`).join("\n");
  const concatList_destination = path.join(path.dirname(videoPath), "concat_list.txt");
  fs.writeFileSync(concatList_destination, concatList);
  const merge_command = `ffmpeg -f concat -safe 0 -i ${concatList_destination} -c copy ${mergedAudioPath}`;

  const { stdout2, stderr2 } = await execAsync(merge_command);
  if (stderr2) {
    console.error(stderr2);
  }

  // Merge video and concatenated audio
  const ffmpegCombineAudVid = `ffmpeg -i ${videoPath} -i ${mergedAudioPath} -c:v copy -c:a libopus ${outputPath}`;
  const { stdout3, stderr3 } = await execAsync(ffmpegCombineAudVid);
  if (stderr3) {
    console.error(stderr3);
  }

  // Remove the original video and merged audio after final merging
  fs.unlink(videoPath, (err) => {
    if (err) console.error(`Error deleting orig video file: ${err}`);
  });

  fs.unlink(mergedAudioPath, (err) => {
    if (err) console.error(`Error deleting merged audio file: ${err}`);
  });

  // Optionally, delete the individual segment files after merging
  audioSegments.forEach((segment) => {
    fs.unlink(segment, (err) => {
      if (err) console.error(`Error deleting segment file: ${err}`);
    });
  });
  audioSegments = [];
  fs.unlink(concatList_destination, (err) => {
    if (err) console.error(`Error removing concatList text file: ${err}`);
  });
});
