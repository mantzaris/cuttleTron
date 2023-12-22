const { ipcRenderer } = window.electron;

type AudioEffectOption = "none" | "pitch";
const audioEffectOptions: AudioEffectOption[] = ["none", "pitch"];

import { populateEffectArea, pitchValue } from "./pitch/pitcheffect.js";

let initialCleaningDone = false;
let streaming = false;
let status_str = "";

function initialCleaning() {
  if (!initialCleaningDone) {
    ipcRenderer.invoke("audioeffects-cleanup");
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
      toggleDivFreeze(false);
    } else {
      document.getElementById("audioeffects-start").style.display = "none";
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

document.getElementById("audioeffects-start").onclick = async () => {
  const chosen_sink_monitor = (document.getElementById("audioeffects-audionameselect") as HTMLSelectElement).value;
  const chosenEffectElement = document.getElementById("audioeffects-audioeffectselect") as HTMLSelectElement;
  const chosenEffectValue = chosenEffectElement.value;

  const chosenEffect: AudioEffectOption = audioEffectOptions.includes(chosenEffectValue as AudioEffectOption) ? (chosenEffectValue as AudioEffectOption) : "none";

  const audio_effects_params = {
    source: chosen_sink_monitor,
    type: chosenEffect,
  };

  if (chosenEffect === "none" || chosen_sink_monitor == "none") {
    let message_tmp = "Select: ";

    if (chosenEffect == "none" && chosen_sink_monitor == "none") {
      message_tmp += "audio source & effect";
    } else if (chosenEffect == "none" && !(chosen_sink_monitor == "none")) {
      message_tmp += "audio effect";
    } else if (!(chosenEffect == "none") && chosen_sink_monitor == "none") {
      message_tmp += "audio source";
    }

    document.getElementById("audioeffects-status-label").innerText = message_tmp;
    setTimeout(() => {
      document.getElementById("audioeffects-status-label").innerText = "";
    }, 1200);

    return;
  } else if (chosenEffect == "pitch") {
    audio_effects_params["params"] = {
      pitchValue,
    };
  }

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
    document.getElementById("audioeffects-status-label").innerText = status.message;
    console.log("Status:", status); // Log the status string returned from the main process

    document.getElementById("audioeffects-start").style.display = "none";
    document.getElementById("audioeffects-stop").style.display = "block";
    document.getElementById("audioeffects-refresh").style.display = "none";
    toggleDivFreeze(true);
    streaming = true;

    status_str = "streaming audio effects";
    setRemoveHeader(true, status_str, true);
    return;
  } catch (error) {
    console.error("Error:", error);
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
  document.getElementById("audioeffects-refresh").style.display = "block";
  toggleDivFreeze(false);
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
  const divIds = ["audioeffects-col1", "audioeffects-col2", "audioeffects-controls"];

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

// const gstreamerCheck = await ipcRenderer.invoke("check-GStreamer");
//     console.log(`result the GStreamer package check: ${gstreamerCheck}`);
