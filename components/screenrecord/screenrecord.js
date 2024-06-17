const { ipcRenderer } = window.electron;
const { joinPath, writeFileSync, getDirname, getTargetDir } = window.nodeModules;
import { generateRandomString } from "../../utilities/utils.js";

import { initializeTooltips, getWebcamSources, setRemoveHeader } from "../component-utilities/component-utilities.js";

let targetDir;
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let isCancelled = false;
let currentSavingPath_video = "";
let currentSavingPath_audio = "";
let currentSavingPath_final = "";
let videoSaved = false;
let audioSaved = false;

let status_str = "";

function mergeVideoAudio() {
  if (videoSaved && audioSaved) {
    ipcRenderer.send("recordings-completed", {
      videoPath: currentSavingPath_video,
      audioPath: currentSavingPath_audio,
      outputPath: currentSavingPath_final,
    });

    videoSaved = false;
    audioSaved = false;
    currentSavingPath_video = "";
    currentSavingPath_audio = "";
    status_str = "";
  }
}

async function setSavingFilePath() {
  const randomString = generateRandomString(5);
  currentSavingPath_video = await joinPath([targetDir, `screenrecord_${randomString}.webm`]);
  currentSavingPath_audio = await joinPath([targetDir, `screenrecord_${randomString}.wav`]);
  currentSavingPath_final = await joinPath([targetDir, `screenrecord_${randomString}f.webm`]);
}

function writeMessageLabel(message, color) {
  const saveMessageLabel = document.getElementById("screenrecord-label");
  saveMessageLabel.textContent = message;
  saveMessageLabel.style.color = color; // Color for an error message
  saveMessageLabel.style.opacity = "1";

  // Hide the message after 1 seconds
  setTimeout(() => {
    saveMessageLabel.style.opacity = "0";
  }, 1000);
}

document.getElementById("screenrecord-expand").onclick = async () => {
  const screenrecord = document.querySelector("#screenrecord");
  const expand_button = document.getElementById("screenrecord-expand");

  if (expand_button.getAttribute("data-action") === "expand") {
    targetDir = await getTargetDir();
    screenrecord.classList.add("expanded");
    expand_button.textContent = "Hide";
    expand_button.setAttribute("data-action", "hide");

    if (status_str == "") {
      populateScreenOptions();
      populatAudioSinkOptions();
    }

    setRemoveHeader("screenrecord-message", false, "", false);
  } else {
    // does not stop the streaming/actions if active to reopen later as an option
    screenrecord.classList.remove("expanded");
    expand_button.textContent = "Expand";
    expand_button.setAttribute("data-action", "expand");

    if (status_str == "") {
      setRemoveHeader("screenrecord-message", false, status_str, false);
      clearVideoAudio();
      return;
    }

    if (status_str == "Recording" || status_str == "Paused") {
      setRemoveHeader("screenrecord-message", true, status_str, true);
    } else {
      setRemoveHeader("screenrecord-message", true, status_str, false);
    }
  }
};

document.getElementById("screenrecord-refresh").onclick = () => {
  populateScreenOptions();
  populatAudioSinkOptions();
};

//sinks are the speakers, headphones (audio endpoints) which we can grab that audio from to record
//pulse audio (classic linux audio server) has monitors we can take audio from
async function populatAudioSinkOptions() {
  ipcRenderer.invoke("get-sinks-sources").then((sinks) => {
    // returns the pactl commandline from the OS for sinks
    let selection_sources = document.getElementById("screenrecord-audionameselect");
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
  });
}

// Fetch available screen capture sources and populate the dropdown
function populateScreenOptions() {
  ipcRenderer.invoke("getCaptureID").then(async (sources) => {
    let dropdownMenu = document.getElementById("screenrecord-selectionUL");
    dropdownMenu.innerHTML = "";

    // Add 'None' option
    let noneItem = document.createElement("li");
    let noneAnchor = document.createElement("a");
    noneAnchor.classList.add("dropdown-item");
    noneAnchor.href = "#";
    noneAnchor.textContent = "none";
    noneAnchor.addEventListener("click", function (event) {
      event.preventDefault();
      document.getElementById("screenrecord-screen-select-btn").textContent = this.textContent;
      screenrecordSelection({ type: "none" }); // Call the handler function
    });
    noneItem.appendChild(noneAnchor);
    dropdownMenu.appendChild(noneItem);

    const webcamSources = await getWebcamSources();
    const allSources = sources.concat(webcamSources);

    allSources.forEach((source) => {
      let listItem = document.createElement("li");
      let anchor = document.createElement("a");
      anchor.classList.add("dropdown-item");
      anchor.classList.add("class", "screenrecorder-screen-tooltip");
      anchor.href = "#";
      anchor.textContent = source.name;
      anchor.setAttribute("data-bs-toggle", "tooltip");

      if ("type" in source && source.type == "webcam") {
        anchor.setAttribute("title", `no thumbnail for webcam`);
      } else {
        anchor.setAttribute("title", `<img src='${source.thumbnail}' alt='Thumbnail'>`);
      }

      anchor.setAttribute("data-tooltip-init", "false"); // Custom attribute to control tooltip initialization

      // Attach click event listener to each dropdown item
      anchor.addEventListener("click", function (event) {
        event.preventDefault();

        // Update the button text to reflect the selected item
        document.getElementById("screenrecord-screen-select-btn").textContent = this.textContent;
        screenrecordSelection(source); // Call the handler function
      });

      listItem.appendChild(anchor);
      dropdownMenu.appendChild(listItem);
    });

    initializeTooltips(".screenrecorder-screen-tooltip");
  });
}

function clearVideoAudio() {
  const videoElement = document.querySelector("#screenrecord-feed video");
  videoElement.srcObject = null; // Remove the media stream source
  videoElement.pause(); // Pause the video playback

  // Clear the selection in the dropdown(s)
  const selectElement = document.getElementById("screenrecord-screen-select-btn");
  selectElement.textContent = "none";
  const selectElementAudio = document.getElementById("screenrecord-audionameselect");
  selectElementAudio.value = "none";
}

async function screenrecordSelection(source) {
  if ("type" in source && source.type == "none") {
    clearVideoAudio();
    return;
  }

  let videoConstraints;
  if ("type" in source && source.type == "webcam") {
    videoConstraints = {
      deviceId: source.id, // Use the webcam's device ID
      frameRate: { ideal: 16, max: 24 },
      // You can add more constraints here, like width, height, etc.
    };
  } else {
    videoConstraints = {
      mandatory: {
        frameRate: { ideal: 16, max: 24 },
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    };
  }

  try {
    let media_source;
    const videoElement = document.querySelector("#screenrecord-feed video");

    // Request access to the webcam
    media_source = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false, // Set to true if you also want to capture audio
    });
    // Assign the media stream to the video element to start streaming

    videoElement.srcObject = media_source;
    videoElement.play(); // Start playing the video stream
  } catch (error) {
    alert("Error capturing screen:", error);
  }
}

function startMediaRecorder() {
  //get the screen data into the recordedChunks
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = async () => {
    mediaRecorder = null;
    isRecording = false;
    status_str = "";

    if (isCancelled) {
      isCancelled = false; // Reset the flag
      recordedChunks = [];
      return;
    }

    if (recordedChunks.length === 0) {
      console.error("No recorded chunks available");
      return;
    }

    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const data = await blobToArrayBuffer(blob);

    try {
      await writeFileSync({ filePath: currentSavingPath_video, buffer: data, encoding: "binary" });

      writeMessageLabel("Saved!", "green");
      videoSaved = true;
      mergeVideoAudio();
    } catch (error) {
      writeMessageLabel("Error saving recording", "red");
      console.error("Error writing file:", error);
    }

    recordedChunks = [];
  };
}

// select a screen to record
document.getElementById("screenrecord-record").onclick = async () => {
  if (mediaRecorder && mediaRecorder.state === "paused") {
    mediaRecorder.resume();

    //resume the audio recording
    const chosenSinkMonitor = document.getElementById("screenrecord-audionameselect").value;
    if (chosenSinkMonitor != "none") {
      ipcRenderer.invoke("resumeAudioRecording", chosenSinkMonitor, currentSavingPath_audio);
    }

    isRecording = true;
    writeMessageLabel("Recording", "red");
    buttonsStateControl("screenrecord-record");
    status_str = "Recording";
    return;
  }

  const videoElement = document.querySelector("#screenrecord-feed video");
  const selectElement = document.getElementById("screenrecord-screen-select-btn");

  if (videoElement.srcObject == null || selectElement.textContent == "none") {
    writeMessageLabel("select screen", "gray");
    status_str = "";
    return;
  }

  // new recording
  const mediaStream = videoElement.srcObject;

  if (mediaStream) {
    if (!mediaRecorder) {
      mediaRecorder = new MediaRecorder(mediaStream);

      await setSavingFilePath();
      startMediaRecorder();

      mediaRecorder.start();
      isRecording = true;

      //start the audio recording
      const chosenSinkMonitor = document.getElementById("screenrecord-audionameselect").value;
      if (chosenSinkMonitor != "none") {
        ipcRenderer.invoke("startAudioRecording", chosenSinkMonitor, currentSavingPath_audio);
      }

      buttonsStateControl("screenrecord-record");
      writeMessageLabel("Recording", "red");
      status_str = "Recording";
    }
  }
};

document.getElementById("screenrecord-pause").onclick = () => {
  if (mediaRecorder && isRecording) {
    mediaRecorder.pause();

    //pause the audio recording
    const chosenSinkMonitor = document.getElementById("screenrecord-audionameselect").value;
    if (chosenSinkMonitor != "none") {
      ipcRenderer.invoke("pauseAudioRecording");
    }

    isRecording = false;
    buttonsStateControl("screenrecord-pause");
    writeMessageLabel("Paused", "brown");
    status_str = "Paused";
  }
};

document.getElementById("screenrecord-cancel").onclick = () => {
  if (mediaRecorder && (mediaRecorder.state === "recording" || mediaRecorder.state === "paused")) {
    isCancelled = true;

    mediaRecorder.stop();

    //cancel the audio recording
    const chosenSinkMonitor = document.getElementById("screenrecord-audionameselect").value;
    if (chosenSinkMonitor != "none") {
      ipcRenderer.invoke("cancelAudioRecording", currentSavingPath_audio);
    }
    currentSavingPath_audio = "";

    buttonsStateControl("screenrecord-cancel");
    writeMessageLabel("Canceled", "orange");
    status_str = "";
  }
};

document.getElementById("screenrecord-save").onclick = async () => {
  try {
    if (mediaRecorder && (mediaRecorder.state === "recording" || mediaRecorder.state === "paused")) {
      await mediaRecorder.stop();

      //get the audio monitor selection value
      const chosenSinkMonitor = document.getElementById("screenrecord-audionameselect").value;
      if (chosenSinkMonitor != "none") {
        await ipcRenderer.invoke("stopAudioRecording", mediaRecorder.state === "recording");
      }

      audioSaved = true;
      mergeVideoAudio();

      writeMessageLabel("Saved", "green");
      buttonsStateControl("screenrecord-save");
      status_str = "";
    }
  } catch (error) {
    console.error("Error while saving recording:", error);
    writeMessageLabel("Error saving", "red");
  }
};

function blobToArrayBuffer(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

function buttonsStateControl(buttonPressedId) {
  const recordButton = document.getElementById("screenrecord-record");
  const pauseButton = document.getElementById("screenrecord-pause");
  const cancelButton = document.getElementById("screenrecord-cancel");
  const saveButton = document.getElementById("screenrecord-save");

  if (buttonPressedId == "screenrecord-record") {
    recordButton.style.display = "none";
    recordButton.innerText = "Record";
    pauseButton.style.display = "block";
    cancelButton.style.display = "block";
    saveButton.style.display = "block";
  } else if (buttonPressedId == "screenrecord-pause") {
    recordButton.style.display = "block";
    recordButton.innerText = "Resume";
    pauseButton.style.display = "none";
    cancelButton.style.display = "block";
    saveButton.style.display = "block";
  } else if (buttonPressedId == "screenrecord-cancel") {
    recordButton.style.display = "block";
    recordButton.innerText = "Record";
    pauseButton.style.display = "none";
    cancelButton.style.display = "none";
    saveButton.style.display = "none";
  } else if (buttonPressedId == "screenrecord-save") {
    recordButton.style.display = "block";
    recordButton.innerText = "Record";
    pauseButton.style.display = "none";
    cancelButton.style.display = "none";
    saveButton.style.display = "none";
  }
}
