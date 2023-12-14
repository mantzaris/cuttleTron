import { exec, spawn } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

const bufferTime = 100000;

const virtualSinkName = "cuttletronVirtualMicTemp";
const virtualSinkDescription = "cuttletron_Virtual_Mic_Temp";
const virtualSourceName = "CuttletronMicrophone";
const virtualSourceDescription = "Cuttletron_Microphone";

let gStreamerProcess = null; // holds the child process reference
let virtualSinkModuleId: any = null;
let virtualSourceModuleId: any = null;

async function audioEffectsStart(audioEffectsParams: any) {
  const loadSinkCommand = `pactl load-module module-null-sink sink_name=${virtualSinkName} sink_properties=device.description=${virtualSinkDescription}`;
  const loadRemapCommand = `pactl load-module module-remap-source master=${virtualSinkName}.monitor source_name=${virtualSourceName} source_properties=device.description=${virtualSourceDescription}`;
  console.log("foo");
  // Execute the command to create the virtual sink
  exec(loadSinkCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error creating virtual sink for audio effects: ${error}`);
      return;
    }
    if (stderr) {
      console.error(`Error output from trying to make audio effects: ${stderr}`);
      return;
    }

    virtualSinkModuleId = stdout.trim();

    console.log(`Virtual sink: ${virtualSinkName}, created successfully for audio effects.`);

    // Check if VirtualMic is in the list of sinks after creation
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
        console.log("VirtualMic sink is available (checked).");

        // Continue with setting up FFmpeg
      } else {
        console.log(`${virtualSinkName} sink is not available after check. !!!`);
      }
    });
  });

  // Execute the command to remap the virtual sink to a source to be usable by Zoom as an input source
  exec(loadRemapCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error in virtual sink remaping to a source: ${error}`);
      return;
    }
    if (stderr) {
      console.error(`Error output in tring to remap from sink to source: ${stderr}`);
      return;
    }

    virtualSourceModuleId = stdout.trim();

    console.log(`Virtual source: ${virtualSourceName}, created successfully.`);

    // Check if remaped VirtualMic to source is in the list of sources
    exec("pactl list sources short", (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error in trying to list sources: ${error}`);
        return;
      }
      if (stderr) {
        console.error(`stderr in trying to list sources: ${stderr}`);
        return;
      }

      if (stdout.includes(`${virtualSourceName}`)) {
        console.log(`${virtualSourceName} source name is available.`);
      } else {
        console.log(`${virtualSourceName} source is not available.`);
      }
    });
  });

  const { source, type } = audioEffectsParams;
  //const source = "alsa_input.usb-Corsair_CORSAIR_VOID_ELITE_Wireless_Gaming_Dongle-00.mono-fallback";

  const pitchValue = 1.5;

  if (type == "none") {
    //
  } else if (type == "pitch") {
    //
  }

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
}

// also delete and remove other virtual sink created by this app
function audioEffectsStop() {
  if (gStreamerProcess) {
    gStreamerProcess.kill("SIGTERM");
  }

  if (virtualSourceModuleId) {
    exec(`pactl unload-module ${virtualSourceModuleId}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error unloading virtual source: ${error}`);
        return;
      }
      if (stderr) {
        console.error(`Error output: ${stderr}`);
        return;
      }

      console.log(`Virtual source with module ID ${virtualSourceModuleId} unloaded successfully.`);
    });

    virtualSourceModuleId = null;
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

    virtualSinkModuleId = null;
  }
}

module.exports = { audioEffectsStart, audioEffectsStop };

//const loadSinkCommandOLD = `pactl load-module module-null-sink sink_name=${virtualSinkName} sink_properties=device.description=${virtualSinkDescription}`;
//pactl load-module module-null-sink sink_name=VirtualMic sink_properties=device.description=VirtualMic
//gst-launch-1.0 pulsesrc device="alsa_input.usb-Corsair_CORSAIR_VOID_ELITE_Wireless_Gaming_Dongle-00.mono-fallback" buffer-time=100000 ! audioconvert ! pitch pitch=1.25 ! pulsesink device=VirtualMic
//pactl load-module module-remap-source master=VirtualMic.monitor source_name=VirtualMicSource source_properties=device.description=VirtualMicSource
