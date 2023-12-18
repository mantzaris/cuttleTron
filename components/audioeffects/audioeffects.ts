const { ipcRenderer } = window.electron;

const audio_effect_options = ["none", "pitch"];

import { populateEffectArea, pitchValue } from "./pitch/pitcheffect.js";

let streaming = false;
let status_str = "";

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

  for (const effect of audio_effect_options) {
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

document.getElementById("audioeffects-stream").onclick = () => {
  streaming = true;
  status_str = "streaming audio effects";

  const chosen_sink_monitor = (document.getElementById("audioeffects-audionameselect") as HTMLSelectElement).value;
  const chosen_effect = (document.getElementById("audioeffects-audioeffectselect") as HTMLSelectElement).value;
  const audio_effects_params = {
    source: chosen_sink_monitor,
    type: chosen_effect,
    params: {
      pitchValue,
    },
  };

  if (chosen_sink_monitor != "none") {
    ipcRenderer.invoke("audioeffects-start", audio_effects_params);
    console.log("streaming audio");
  }
};

document.getElementById("audioeffects-stop").onclick = () => {
  streaming = false;
  status_str = "";
  ipcRenderer.invoke("audioeffects-stop");
  console.log("stopping stream");
};

document.getElementById("audioeffects-audioeffectselect").onchange = () => {
  const chosen_effect = (document.getElementById("audioeffects-audioeffectselect") as HTMLSelectElement).value;
  if (chosen_effect == "none") {
    document.getElementById("audioeffects-controls").innerHTML = "";
  } else if (chosen_effect == "pitch") {
    populateEffectArea();
  }
};
