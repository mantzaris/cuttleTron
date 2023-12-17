const { exec, spawn } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

const bufferTime = 100000;

const virtualSinkName = "cuttletronVirtualMicTemp";
const virtualSinkDescription = "cuttletron_Virtual_Mic_Temp";
const virtualSourceName = "CuttletronMicrophone";
const virtualSourceDescription = "Cuttletron_Microphone";

let gStreamerProcess = null; // holds the child process reference
let virtualSinkModuleId = null;
let virtualSourceModuleId = null;

async function audioEffectsStart(audioEffectsParams) {
  await cleanupAudioDevices();

  try {
    const loadSinkCommand = `pactl load-module module-null-sink sink_name=${virtualSinkName} sink_properties=device.description=${virtualSinkDescription}`;
    const loadRemapCommand = `pactl load-module module-remap-source master=${virtualSinkName}.monitor source_name=${virtualSourceName} source_properties=device.description=${virtualSourceDescription}`;

    const sinkResult = await execAsync(loadSinkCommand);
    virtualSinkModuleId = sinkResult.stdout.trim();
    console.log(`Virtual sink: ${virtualSinkName}, created successfully for audio effects.`);

    // Create the remapped source
    const sourceResult = await execAsync(loadRemapCommand);
    virtualSourceModuleId = sourceResult.stdout.trim();
    console.log(`Virtual source: ${virtualSourceName}, created successfully.`);
  } catch (error) {
    console.error(`Error in setting up audio effects: ${error}`);
  }

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
async function audioEffectsStop() {
  if (gStreamerProcess) {
    gStreamerProcess.kill("SIGTERM");
  }

  try {
    if (virtualSourceModuleId) {
      await execAsync(`pactl unload-module ${virtualSourceModuleId}`);
      console.log(`Virtual source with module ID ${virtualSourceModuleId} unloaded successfully.`);
      virtualSourceModuleId = null;
    }

    if (virtualSinkModuleId) {
      await execAsync(`pactl unload-module ${virtualSinkModuleId}`);
      console.log(`Virtual sink with module ID ${virtualSinkModuleId} unloaded successfully.`);
      virtualSinkModuleId = null;
    }
  } catch (error) {
    console.error(`Error unloading virtual devices: ${error}`);
  }
}

async function cleanupAudioDevices() {
  try {
    // List all sinks and sources
    const { stdout: sinksList } = await execAsync("pactl list short sinks");
    const { stdout: sourcesList } = await execAsync("pactl list short sources");

    // Find and unload any lingering virtual sinks created by the app
    const sinkPattern = new RegExp(`(\\d+)\\s+${virtualSinkName}`, "g");
    let match;
    while ((match = sinkPattern.exec(sinksList)) !== null) {
      await execAsync(`pactl unload-module ${match[1]}`);
      console.log(`Cleaned up lingering sink with ID: ${match[1]}`);
    }

    // Find and unload any lingering virtual sources created by the app
    const sourcePattern = new RegExp(`(\\d+)\\s+${virtualSourceName}`, "g");
    while ((match = sourcePattern.exec(sourcesList)) !== null) {
      await execAsync(`pactl unload-module ${match[1]}`);
      console.log(`Cleaned up lingering source with ID: ${match[1]}`);
    }
  } catch (error) {
    console.error(`Error during cleanup: ${error.message}`);
  }
}

module.exports = { audioEffectsStart, audioEffectsStop, cleanupAudioDevices };

//const loadSinkCommandOLD = `pactl load-module module-null-sink sink_name=${virtualSinkName} sink_properties=device.description=${virtualSinkDescription}`;
//pactl load-module module-null-sink sink_name=VirtualMic sink_properties=device.description=VirtualMic
//gst-launch-1.0 pulsesrc device="alsa_input.usb-Corsair_CORSAIR_VOID_ELITE_Wireless_Gaming_Dongle-00.mono-fallback" buffer-time=100000 ! audioconvert ! pitch pitch=1.25 ! pulsesink device=VirtualMic
//pactl load-module module-remap-source master=VirtualMic.monitor source_name=VirtualMicSource source_properties=device.description=VirtualMicSource
