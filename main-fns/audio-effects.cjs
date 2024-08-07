const { exec, spawn } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

const bufferTime = 3000000; //100000 0.1 millisecond

const virtualSinkName = "cuttletronVirtualMicTemp";
const virtualSinkDescription = "cuttletron_Virtual_Mic_Temp";
const virtualSourceName = "CuttletronMicrophone";
const virtualSourceDescription = "Cuttletron_Microphone";

let gStreamerProcess = null; // holds the child process reference
let virtualSinkModuleId = null;
let virtualSourceModuleId = null;

async function audioEffectsStart(audioEffectsParams) {
  const { source, effects } = audioEffectsParams;
  const gs_sourceArgs = [
    "pulsesrc",
    `device=${source}`,
    `buffer-time=${bufferTime}`,
    "!",
    "audioconvert",
  ];
  const gs_sinkArgs = ["!", "pulsesink", `device=${virtualSinkName}`];

  let gs_effectArgs = getGStreamerEffectArgs(effects);

  if (gs_effectArgs.length === 0) {
    return; //no effect to produce
  }
  let gStreamerArgs = gs_sourceArgs.concat(gs_effectArgs, gs_sinkArgs);

  console.log(gStreamerArgs);

  try {
    if (virtualSinkModuleId == null || virtualSourceModuleId == null) {
      //start fresh
      await cleanupAudioDevices(); //cleans up both the pulse audio modules and gstreamer process
      const loadSinkCommand = `pactl load-module module-null-sink sink_name=${virtualSinkName} sink_properties=device.description=${virtualSinkDescription}`;
      const loadRemapCommand = `pactl load-module module-remap-source master=${virtualSinkName}.monitor source_name=${virtualSourceName} source_properties=device.description=${virtualSourceDescription}`;

      const sinkResult = await execAsync(loadSinkCommand);
      virtualSinkModuleId = sinkResult.stdout.trim();
      console.log(
        `Virtual sink: ${virtualSinkName}, created successfully for audio effects.`
      );

      // Create the remapped source
      const sourceResult = await execAsync(loadRemapCommand);
      virtualSourceModuleId = sourceResult.stdout.trim();
      console.log(
        `Virtual source: ${virtualSourceName}, created successfully.`
      );
    } else if (gStreamerProcess != null) {
      //pulse audio modules exist so kill GStreamer to make a new one with new effects 'Alter'
      killGStreamer();
    }
  } catch (error) {
    console.error(`Error in setting up or cleaning audio effects: ${error}`);
    return { success: false, message: error.message };
  }

  console.log("gStreamerArgs", gStreamerArgs);
  gStreamerProcess = spawn("gst-launch-1.0", gStreamerArgs);
  return { success: true, message: `streaming to: ${virtualSourceName}` };
}

// also delete and remove other virtual sink created by this app (weaker version of clean up)
async function audioEffectsStop() {
  killGStreamer();

  try {
    if (virtualSourceModuleId) {
      await unloadPA_Module(virtualSourceModuleId);
      virtualSourceModuleId = null;
    }

    if (virtualSinkModuleId) {
      await unloadPA_Module(virtualSinkModuleId);
      virtualSinkModuleId = null;
    }
  } catch (error) {
    console.error(`Error unloading virtual devices: ${error}`);
  }
}

async function cleanupAudioDevices() {
  try {
    killGStreamer();
    virtualSinkModuleId = null;
    virtualSourceModuleId = null;

    // List all modules
    //!FIX this TODO: pactl is always assumed
    const { stdout: modulesList } = await execAsync("pactl list short modules");

    // Unload virtual sinks (module-null-sink)
    const nullSinkPattern = new RegExp(
      `(\\d+)\\s+module-null-sink\\s+sink_name=${virtualSinkName}`,
      "g"
    );
    let match;
    while ((match = nullSinkPattern.exec(modulesList)) !== null) {
      await unloadPA_Module(match[1]);
    }

    // Unload virtual sources (module-remap-source)
    const remapSourcePattern = new RegExp(
      `(\\d+)\\s+module-remap-source\\s+.*?source_name=${virtualSourceName}`,
      "g"
    );
    while ((match = remapSourcePattern.exec(modulesList)) !== null) {
      await unloadPA_Module(match[1]);
    }
  } catch (error) {
    console.error(`Error during cleanup: ${error.message}`);
  }
}

module.exports = { audioEffectsStart, audioEffectsStop, cleanupAudioDevices };

function getGStreamerEffectArgs(effects) {
  let gs_effectArgs = [];

  for (const effect of effects) {
    const { type, params } = effect;

    switch (type) {
      case "pitch":
        const pitchValue = params.pitchValue;
        gs_effectArgs.push("!", `pitch`, `pitch=${pitchValue}`);
        break;
      case "echo":
        const delay = params.echo_delay;
        const intensity = params.echo_intensity;
        const feedback = params.echo_feedback;
        gs_effectArgs.push(
          "!",
          `audioecho`,
          `delay=${delay}`,
          `intensity=${intensity}`,
          `feedback=${feedback}`
        );
        break;
      case "distortion":
        const drive = params.distortion_drive;
        const drivegain = params.distortion_gain;
        const drivelevel = params.distortion_level;
        const driveover = params.distortion_over;
        const overdrive = params.distortion_overdrive;
        const trigger = params.distortion_trigger;
        const vibrato = params.distortion_vibrato;
        gs_effectArgs.push(
          "!",
          `ladspa-guitarix-distortion-so-guitarix-distortion`,
          `drive=${drive}`,
          `drivegain=${drivegain}`,
          `drivelevel=${drivelevel}`,
          `driveover=${driveover}`,
          `overdrive=${overdrive}`,
          `trigger=${trigger}`,
          `vibrato=${vibrato}`
        );
        break;
      case "reverb":
        const roomsize = params.reverb_roomsize;
        const damping = params.reverb_damping;
        const level = params.reverb_level;
        const width = params.reverb_width;
        gs_effectArgs.push(
          "!",
          `freeverb`,
          `room-size=${roomsize}`,
          `damping=${damping}`,
          `level=${level}`,
          `width=${width}`
        );
        break;
      case "scaletempo":
        const stride = params.scaletempo_stride;
        const overlap = params.scaletempo_overlap;
        const search = params.scaletempo_search;
        gs_effectArgs.push(
          "!",
          `scaletempo`,
          `stride=${stride}`,
          `overlap=${overlap}`,
          `search=${search}`
        );
        break;
      case "amplify1":
        const amplification1 = params.amplify1_amplification;
        gs_effectArgs.push(
          "!",
          `audioamplify`,
          `amplification=${amplification1}`
        );
        break;
      case "amplify2":
        const amplification2 = params.amplify2_amplification;
        gs_effectArgs.push(
          "!",
          `audioamplify`,
          `amplification=${amplification2}`
        );
        break;
      case "stereo":
        const stereo = params.stereo_stereo;
        gs_effectArgs.push("!", `stereo`, `stereo=${stereo}`);
        break;
      case "dynamicExpander":
        const exp_ratio = params.dynamicExpander_ratio;
        const exp_threshold = params.dynamicExpander_threshold;
        gs_effectArgs.push(
          "!",
          `audiodynamic`,
          `mode=expander`,
          `ratio=${exp_ratio}`,
          `threshold=${exp_threshold}`
        );
        break;
      case "dynamicCompressor":
        const comp_ratio = params.dynamicCompressor_ratio;
        const comp_threshold = params.dynamicCompressor_threshold;
        gs_effectArgs.push(
          "!",
          `audiodynamic`,
          `mode=compressor`,
          `ratio=${comp_ratio}`,
          `threshold=${comp_threshold}`
        );
        break;
      case "bandFilter":
        const lower_frequency = params.band_lower;
        const upper_frequency = params.band_upper;
        const mode = params.band_mode;
        const poles = params.band_poles;
        const ripple = params.band_ripple;
        const type = params.band_type;

        gs_effectArgs.push(
          "!",
          `audiochebband`,
          `lower-frequency=${lower_frequency}`,
          `upper-frequency=${upper_frequency}`,
          `mode=${mode}`,
          `poles=${poles}`,
          `ripple=${ripple}`,
          `type=${type}`
        );
        break;
    }
  }

  return gs_effectArgs;
}

function killGStreamer() {
  if (gStreamerProcess) {
    gStreamerProcess.kill("SIGTERM");
    gStreamerProcess = null;
  }
}

async function unloadPA_Module(moduleId) {
  if (moduleId == null || moduleId.trim() === "") {
    console.error("Invalid module ID provided for unloading.");
    return;
  }

  try {
    await execAsync(`pactl unload-module ${moduleId}`);
    console.log(`Successfully unloaded module with ID: ${moduleId}`);
  } catch (unloadError) {
    console.error(
      `Error unloading moduleID=${moduleId}: ${unloadError.message}`
    );
    console.error(`Error unloading moduleID=${moduleId}:`, unloadError);
  }
}
