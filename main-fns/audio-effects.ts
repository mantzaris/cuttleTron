import { exec, spawn } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

const virtualSinkName = "cuttletronVirtualMic";
const virtualSinkDescription = "cuttletron_Virtual_Mic_Temp";
const virtualSourceName = "CuttletronMicrophone";
const virtualSourceDescription = "Cuttletron_Microphone";

let gStreamerProcess = null; // holds the child process reference
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

      if (stdout.includes(`${virtualSinkName}`)) {
        console.log("VirtualMic sink is available.");

        // Continue with setting up FFmpeg
      } else {
        console.log(`${virtualSinkName} sink is not available.`);
      }
    });
  });

  const { source, type } = audioEffectsParams;
  //const source = "alsa_input.usb-Corsair_CORSAIR_VOID_ELITE_Wireless_Gaming_Dongle-00.mono-fallback";

  const bufferTime = 100000;
  const pitchValue = 1.5;

  const gStreamerArgs = [
    "pulsesrc",
    `device=${source}`,
    `buffer-time=${bufferTime}`,
    "!",
    "audioconvert",
    "!",
    `pitch`,
    `pitch=${pitchValue}`,
    "!",
    "pulsesink",
    `device=${virtualSinkName}`,
  ];

  gStreamerProcess = spawn("gst-launch-1.0", gStreamerArgs);

  if (type == "none") {
    //
  } else if (type == "pitch") {
    //
  }
}

// also delete and remove other virtual sink created by this app
function audioEffectsStop() {
  if (gStreamerProcess) {
    gStreamerProcess.kill("SIGTERM");
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

//const loadSinkCommandOLD = `pactl load-module module-null-sink sink_name=${virtualSinkName} sink_properties=device.description=${virtualSinkDescription}`;
