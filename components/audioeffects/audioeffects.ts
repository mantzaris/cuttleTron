const { ipcRenderer } = window.electron;

type AudioEffectOption = "none" | "pitch" | "echo" | "distortion" | "reverb" | "scaletempo" | "bandFilter";
const audioEffectOptions: AudioEffectOption[] = ["none", "pitch", "echo", "distortion", "reverb", "scaletempo", "bandFilter"];

type Status = "streaming" | "stopped";

import { populateEffectArea_Pitch, pitchValue } from "./pitch/pitcheffect.js";
import { populateEffectArea_Echo, echo_delay, echo_intensity, echo_feedback } from "./echo/echoeffect.js";
import {
  populateEffectArea_Distortion,
  distortion_drive,
  distortion_gain,
  distortion_level,
  distortion_over,
  distortion_overdrive,
  distortion_trigger,
  distortion_vibrato,
} from "./distortion/distortioneffect.js";
import { populateEffectArea_Reverb, reverb_roomsize, reverb_damping, reverb_level, reverb_width } from "./reverb/reverbeffect.js";
import { populateEffectArea_ScaleTempo, scaletempo_stride, scaletempo_overlap, scaletempo_search } from "./scaletempo/scaletempo.js";
import { populateEffectArea_BandFilter, band_lower, band_upper, band_mode, band_poles, band_ripple, band_type } from "./bandfilter/bandfilter.js";

let initialCleaningDone = false;
let streaming = false;
let status_str = "";

function initialCleaning() {
  if (!initialCleaningDone) {
    ipcRenderer.invoke("audioeffects-cleanup");
    initialCleaningDone = true;
  }
}
initialCleaning();

document.getElementById("audioeffects-expand").onclick = () => {
  const audioeffects = document.querySelector("#audioeffects");
  const expand_button = document.getElementById("audioeffects-expand");

  if (expand_button.getAttribute("data-action") === "expand") {
    audioeffects.classList.add("expanded");
    expand_button.textContent = "Hide";
    expand_button.setAttribute("data-action", "hide");

    if (!streaming) {
      populateAudioSinkOptions();
      populateAudeioEffectOptions();
      document.getElementById("audioeffects-start").style.display = "block";
      document.getElementById("audioeffects-stop").style.display = "none";
      document.getElementById("audioeffects-update").style.display = "none";
      toggleDivFreeze(false);
    } else {
      document.getElementById("audioeffects-start").style.display = "none";
      document.getElementById("audioeffects-stop").style.display = "block";
      document.getElementById("audioeffects-stop").style.display = "block";
      toggleDivFreeze(true);
    }
  } else {
    audioeffects.classList.remove("expanded");
    expand_button.textContent = "Expand";
    expand_button.setAttribute("data-action", "expand");
  }
};

async function populateAudioSinkOptions() {
  ipcRenderer.invoke("get-sinks-sources").then((sinks) => {
    // returns the pactl commandline from the OS for sinks
    let selection_sources = document.getElementById("audioeffects-audionameselect") as HTMLSelectElement;
    selection_sources.innerHTML = "";

    const src = document.createElement("option");
    src.innerHTML = "none";
    src.value = "none";
    selection_sources.appendChild(src);

    for (const sink of sinks) {
      const src = document.createElement("option");
      src.innerHTML = sink.description;
      src.value = sink.monitorSource;
      selection_sources.appendChild(src);
    }

    selection_sources.value = "none";
  });
}

async function populateAudeioEffectOptions() {
  let selection_sources = document.getElementById("audioeffects-audioeffectselect");
  selection_sources.innerHTML = "";

  for (const effect of audioEffectOptions) {
    const src = document.createElement("option");
    src.innerHTML = effect;
    src.value = effect;
    selection_sources.appendChild(src);
  }
}

document.getElementById("audioeffects-refresh").onclick = () => {
  if (!streaming) {
    populateAudioSinkOptions();
    populateAudeioEffectOptions();
  }
};

//Audio Effect List START
document.getElementById("audioeffects-controls").addEventListener("change", function (event) {
  const chosen_effect = (document.getElementById("audioeffects-audioeffectselect") as HTMLSelectElement).value;
  const current_effects = [];

  document.querySelectorAll("#audioeffects-added .list-group-item").forEach((item) => {
    current_effects.push(item.getAttribute("data-effect-name"));
  });

  if (current_effects.includes(chosen_effect)) {
    return;
  }

  const effect_entry = `
                        <li class="list-group-item list-group-item-compact d-flex justify-content-between align-items-center" data-effect-name="${chosen_effect}">
                          <span>${chosen_effect}</span>
                          <button class="btn btn-danger btn-sm btn-compact remove-effect" id="remove-${chosen_effect}">Remove</button>
                        </li>  
                        `;

  document.getElementById("audioeffects-ul").innerHTML += effect_entry;
});

document.getElementById("audioeffects-added").addEventListener("click", function (event) {
  const target = event.target as Element;

  if (target.classList.contains("remove-effect")) {
    const listItem = target.closest("li");
    listItem.remove();
  }
});
//Audio Effect List END

function getEffectParams(effectName: AudioEffectOption) {
  switch (effectName) {
    case "pitch":
      return { pitchValue };

    case "echo":
      return { echo_delay, echo_intensity, echo_feedback };

    case "distortion":
      return {
        distortion_drive,
        distortion_gain,
        distortion_level,
        distortion_over,
        distortion_overdrive,
        distortion_trigger,
        distortion_vibrato,
      };

    case "reverb":
      return { reverb_roomsize, reverb_damping, reverb_level, reverb_width };

    case "scaletempo":
      return { scaletempo_stride, scaletempo_overlap, scaletempo_search };

    case "bandFilter":
      return { band_lower, band_upper, band_mode, band_poles, band_ripple, band_type };

    default:
      return {};
  }
}

document.getElementById("audioeffects-start").onclick = async () => {
  const audio_effects_params = getAllEffectParams();
  if (audio_effects_params == undefined) {
    return;
  }
  console.log(audio_effects_params);

  try {
    const status = await ipcRenderer.invoke("audioeffects-start", audio_effects_params);

    if (status.success == false) {
      showModal(
        status.message +
          `\n Remember to Install: ["gstreamer1.0-tools", "gstreamer1.0-plugins-base", "gstreamer1.0-plugins-good", "gstreamer1.0-plugins-bad", "gstreamer1.0-plugins-ugly"]`
      );
      await ipcRenderer.invoke("audioeffects-stop");
      return;
    }
    console.log("Status:", status); // Log the status string returned from the main process
    innerDisplayState("streaming", status.message);

    return;
  } catch (error) {
    console.error("Error:", error);
  }
};

document.getElementById("audioeffects-stop").onclick = () => {
  ipcRenderer.invoke("audioeffects-stop");
  innerDisplayState("stopped", "");
  console.log("stopping stream");
};

document.getElementById("audioeffects-update").onclick = async () => {
  //ipcRenderer.invoke("audioeffects-stop");
  const audio_effects_params = getAllEffectParams();
  console.log(audio_effects_params);
  console.log("updating stream");
  const status = await ipcRenderer.invoke("audioeffects-start", audio_effects_params);

  if (status.success) {
    showBriefMessage("Updated");
  }
};

document.getElementById("audioeffects-audioeffectselect").onchange = () => {
  const chosenEffectElement = document.getElementById("audioeffects-audioeffectselect") as HTMLSelectElement;
  const chosenEffect = chosenEffectElement.value as AudioEffectOption;

  switch (chosenEffect) {
    case "pitch":
      populateEffectArea_Pitch();
      break;
    case "echo":
      populateEffectArea_Echo();
      break;
    case "distortion":
      populateEffectArea_Distortion();
      break;
    case "reverb":
      populateEffectArea_Reverb();
      break;
    case "scaletempo":
      populateEffectArea_ScaleTempo();
      break;
    case "bandFilter":
      populateEffectArea_BandFilter();
      break;
    case "none":
      document.getElementById("audioeffects-controls").innerHTML = "";
      break;
    default:
      console.error(`Unknown effect: ${chosenEffect}`);
      // Handle unknown effect case, maybe reset to default state
      break;
  }
};

function getAllEffectParams() {
  const chosen_sink_monitor = (document.getElementById("audioeffects-audionameselect") as HTMLSelectElement).value;

  const current_effects = Array.from(document.querySelectorAll("#audioeffects-added .list-group-item"))
    .map((item) => item.getAttribute("data-effect-name"))
    .filter((effect) => effect && audioEffectOptions.includes(effect as AudioEffectOption));

  if (current_effects.length === 0 || chosen_sink_monitor === "none") {
    const statusLabel = document.getElementById("audioeffects-status-label");
    statusLabel.innerText = "configure audio selection & effect";
    setTimeout(() => {
      statusLabel.innerText = "";
    }, 1200);
    return;
  }

  const audio_effects_params = {
    source: chosen_sink_monitor,
    effects: current_effects.map((effectName) => ({
      type: effectName,
      params: getEffectParams(effectName as AudioEffectOption),
    })),
  };

  return audio_effects_params;
}

function innerDisplayState(status: Status, labelMsg = "") {
  switch (status) {
    case "streaming":
      streaming = true;
      status_str = "streaming audio effects";
      document.getElementById("audioeffects-status-label").innerText = labelMsg;
      document.getElementById("audioeffects-start").style.display = "none";
      document.getElementById("audioeffects-stop").style.display = "block";
      document.getElementById("audioeffects-update").style.display = "block";
      document.getElementById("audioeffects-refresh").style.display = "none";
      toggleDivFreeze(true);
      setRemoveHeader(true, status_str, true);
      break;
    case "stopped":
      streaming = false;
      status_str = "";
      document.getElementById("audioeffects-status-label").innerText = labelMsg;
      document.getElementById("audioeffects-start").style.display = "block";
      document.getElementById("audioeffects-stop").style.display = "none";
      document.getElementById("audioeffects-update").style.display = "none";
      document.getElementById("audioeffects-refresh").style.display = "block";
      toggleDivFreeze(false);
      setRemoveHeader(false, status_str, false);
      break;
  }
}

function setRemoveHeader(add_message: boolean, message: string, flash_bool: boolean) {
  const scroll_flash_text = "scroll-flash-text";
  const scroll_text = "scroll-text";
  const flash_text = "flash-text";

  var container = document.getElementById("audioeffects-message");
  var textElement = container.querySelector("div"); // Assuming the text is in a div inside the container

  textElement.classList.remove(scroll_flash_text);
  textElement.classList.remove(scroll_text);
  textElement.classList.remove(flash_text);

  if (!add_message) {
    textElement.innerText = "";
    return;
  }

  textElement.innerText = message;

  if (textElement.scrollWidth > container.clientWidth) {
    // Text is too long
    if (flash_bool) {
      textElement.classList.add(scroll_flash_text);
    } else {
      textElement.classList.add(scroll_text);
    }
  } else {
    // Text fits in the container
    if (flash_bool) {
      textElement.classList.add(flash_text);
    }
  }

  textElement.style.display = "block";
}

//notify the user if the neccessary GStreamer packages are found
function showModal(message: string) {
  document.getElementById("audioeffects-model-message").innerText = message; // Set the message
  document.getElementById("audioeffects-close-modal").innerText = "close";

  const modal = document.getElementById("audioeffects-modal");
  modal.classList.remove("hidden");

  document.getElementById("audioeffects-close-modal").onclick = () => {
    const modal = document.getElementById("audioeffects-modal");
    modal.classList.add("hidden");
  };
}

//deactivate the divs which are for user input when streaming
function toggleDivFreeze(freeze: boolean) {
  const divIds = ["audioeffects-col1"]; //, "audioeffects-col2", "audioeffects-controls", "audioeffects-added"];

  divIds.forEach((divId) => {
    const div = document.getElementById(divId);
    if (div) {
      if (freeze) {
        div.classList.add("disabled-div");
      } else {
        div.classList.remove("disabled-div");
      }
    }
  });
}

function showBriefMessage(message) {
  const audioEffectsStatusLabel = document.getElementById("audioeffects-status-label");
  const originalMessage = audioEffectsStatusLabel.textContent;

  audioEffectsStatusLabel.textContent = message;

  setTimeout(() => {
    audioEffectsStatusLabel.textContent = originalMessage;
  }, 1000);
}
