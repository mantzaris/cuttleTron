const fs = require("fs");
const path = require("path");

const { exec, spawn } = require("child_process");
const util = require("util");
const execAsync = util.promisify(exec);

let ffmpegProcess = null; // This will hold the child process instance
let audioSegments = []; //holds the segments of audio from the pauses and resumes

async function getSinkList() {
  try {
    const result = await execAsync("pactl list sinks | grep -e 'Name:' -e 'Description:' -e 'Monitor Source:'");
    const stdout = result.stdout;
    // Parse the stdout to create a structured list of sinks
    const lines = stdout.split("\n");
    const sinks = [];
    let currentSink = {};

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("Name:")) {
        currentSink.name = trimmedLine.split("Name:")[1].trim();
      } else if (trimmedLine.startsWith("Description:")) {
        currentSink.description = trimmedLine.split("Description:")[1].trim();
      } else if (trimmedLine.startsWith("Monitor Source:")) {
        currentSink.monitorSource = trimmedLine.split("Monitor Source:")[1].trim();
        sinks.push(currentSink);
        currentSink = {};
      }
    });
    //console.log(sinks);
    return sinks;
  } catch (error) {
    console.error(`getSinks exec error: ${error}`);
    throw error; // This will reject the promise returned by ipcMain.handle
  }
}

//record audio from sink monitor provided
function startAudioRecording(sink_monitor, filepath) {
  const ffmpegArgs = ["-f", "pulse", "-i", sink_monitor, filepath];
  ffmpegProcess = spawn("ffmpeg", ffmpegArgs);
  audioSegments.push(filepath);
}

// Pause recording
function pauseAudioRecording() {
  if (ffmpegProcess) {
    ffmpegProcess.kill("SIGTERM");
  } else {
    console.log("ffmpegProcess does not exist.");
  }
}

function resumeAudioRecording(sink_monitor, audio_path) {
  // Append a timestamp to the filepath to ensure uniqueness
  const timestamp = Date.now();
  const ext = path.extname(audio_path);
  const nameWithoutExt = path.basename(audio_path, ext);
  const dir = path.dirname(audio_path);
  const newFilepath = path.join(dir, `${nameWithoutExt}_${timestamp}${ext}`);

  const ffmpegArgs = ["-f", "pulse", "-i", sink_monitor, newFilepath];
  ffmpegProcess = spawn("ffmpeg", ffmpegArgs);
  audioSegments.push(newFilepath);
}

// stop recording and reset the audioSegments array and ffmpegProcess
function cancelAudioRecording() {
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
}

function stopAudioRecording(recording_bool) {
  if (ffmpegProcess) {
    ffmpegProcess.kill("SIGTERM");
  }
}

async function recordingsCompleted(args) {
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
}

module.exports = {
  getSinkList,
  startAudioRecording,
  pauseAudioRecording,
  resumeAudioRecording,
  cancelAudioRecording,
  stopAudioRecording,
  recordingsCompleted,
};
