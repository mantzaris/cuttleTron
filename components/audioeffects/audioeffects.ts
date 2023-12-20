const { ipcRenderer } = window.electron;

type AudioEffectOption = "none" | "pitch";
const audioEffectOptions: AudioEffectOption[] = ["none", "pitch"];

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
      document.getElementById("audioeffects-start").style.display = "block";
      document.getElementById("audioeffects-stop").style.display = "none";
    } else {
      document.getElementById("audioeffects-start").style.display = "none";
      document.getElementById("audioeffects-stop").style.display = "block";
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

document.getElementById("audioeffects-start").onclick = async () => {
  const chosen_sink_monitor = (document.getElementById("audioeffects-audionameselect") as HTMLSelectElement).value;
  const chosenEffectElement = document.getElementById("audioeffects-audioeffectselect") as HTMLSelectElement;
  const chosenEffectValue = chosenEffectElement.value;

  const chosenEffect: AudioEffectOption = audioEffectOptions.includes(chosenEffectValue as AudioEffectOption) ? (chosenEffectValue as AudioEffectOption) : "none";

  const audio_effects_params = {
    source: chosen_sink_monitor,
    type: chosenEffect,
  };

  if (chosenEffect === "none") {
    console.error("Invalid audio effect option selected or defaulted to 'none'.");
    // Handle the error or default case as needed
  } else if (chosenEffect == "pitch") {
    audio_effects_params["params"] = {
      pitchValue,
    };
  }

  if (chosen_sink_monitor != "none") {
    try {
      const status = await ipcRenderer.invoke("audioeffects-start", audio_effects_params);
      document.getElementById("audioeffects-status-label").innerText = status;
      console.log("Status:", status); // Log the status string returned from the main process

      document.getElementById("audioeffects-start").style.display = "none";
      document.getElementById("audioeffects-stop").style.display = "block";
      streaming = true;

      status_str = "streaming audio effects";
      setRemoveHeader(true, status_str, true);
      return;
    } catch (error) {
      console.error("Error:", error);
    }
  }
};

document.getElementById("audioeffects-stop").onclick = () => {
  streaming = false;
  status_str = "";
  ipcRenderer.invoke("audioeffects-stop");
  document.getElementById("audioeffects-status-label").innerText = "";
  setRemoveHeader(false, status_str, false);
  document.getElementById("audioeffects-start").style.display = "block";
  document.getElementById("audioeffects-stop").style.display = "none";
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
