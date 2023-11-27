import { exec, spawn } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

const virtualSinkName = "VirtualMic";
const virtualSinkDescription = "Virtual_Microphone";
let ffmpegProcess = null; // holds the child process reference
let virtualSinkModuleId: any = null;

async function audioEffectsStart(audioEffectsParams: any) {
  const loadSinkCommand = `pactl load-module module-null-sink sink_name=${virtualSinkName} sink_properties=device.description=${virtualSinkDescription}`;

  // Execute the command to create the virtual sink
  exec(loadSinkCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error creating virtual sink: ${error}`);
      return;
    }
    if (stderr) {
      console.error(`Error output: ${stderr}`);
      return;
    }

    virtualSinkModuleId = stdout.trim();

    console.log("Virtual sink created successfully.");

    // Check if 'VirtualMic' is in the list of sinks
    exec("pactl list sinks short", (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }

      if (stdout.includes("VirtualMic")) {
        console.log("VirtualMic sink is available.");

        // Continue with setting up FFmpeg
      } else {
        console.log("VirtualMic sink is not available.");
      }
    });
  });

  const { source, type } = audioEffectsParams;

  const sourceName = source;
  const ffmpegArgs = [
    "-f",
    "pulse",
    "-i",
    sourceName,
    "-af",
    "acompressor=threshold=0.02:ratio=4:attack=50:release=1000, asetrate=44100*0.8,aresample=44100", //"acompressor=threshold=0.02:ratio=4:attack=50:release=1000, asetrate=44100*0.8,aresample=44100, aecho=0.8:0.9:1000:0.3",
    "-f",
    "pulse",
    virtualSinkName,
  ];

  ffmpegProcess = spawn("ffmpeg", ffmpegArgs);

  if (type == "none") {
    //
  } else if (type == "distortion") {
    //
  }
}

function audioEffectsStop() {
  if (ffmpegProcess) {
    ffmpegProcess.kill("SIGTERM");
  }

  if (virtualSinkModuleId) {
    exec(`pactl unload-module ${virtualSinkModuleId}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error unloading virtual sink: ${error}`);
        return;
      }
      if (stderr) {
        console.error(`Error output: ${stderr}`);
        return;
      }

      console.log(`Virtual sink with module ID ${virtualSinkModuleId} unloaded successfully.`);
    });
  }
}

module.exports = { audioEffectsStart, audioEffectsStop };
