const { ipcRenderer } = window.electron;
const { joinPath, writeFileSync, getDirname, getTargetDir } = window.nodeModules;
import { generateRandomString } from "../../utilities/utils.js";

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

    setRemoveHeader(false, "", false);
  } else {
    // does not stop the streaming/actions if active to reopen later as an option
    screenrecord.classList.remove("expanded");
    expand_button.textContent = "Expand";
    expand_button.setAttribute("data-action", "expand");

    if (status_str == "") {
      setRemoveHeader(false, status_str, false);
      clearVideoAudio();
      return;
    }

    if (status_str == "Recording" || status_str == "Paused") {
      setRemoveHeader(true, status_str, true);
    } else {
      setRemoveHeader(true, status_str, false);
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
  ipcRenderer.invoke("getSinks").then((sinks) => {
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
  ipcRenderer.invoke("getCaptureID").then((sources) => {
    let selection_sources = document.getElementById("screenrecord-nameselect");
    selection_sources.innerHTML = "";

    const src = document.createElement("option");
    src.innerHTML = "none";
    src.value = "none";
    selection_sources.appendChild(src);

    for (const source of sources) {
      const src = document.createElement("option");
      src.innerHTML = source.name;
      src.value = source.id;
      selection_sources.appendChild(src);
    }
  });
}

function clearVideoAudio() {
  const videoElement = document.querySelector("#screenrecord-feed video");
  videoElement.srcObject = null; // Remove the media stream source
  videoElement.pause(); // Pause the video playback

  // Clear the selection in the dropdown(s)
  const selectElement = document.getElementById("screenrecord-nameselect");
  selectElement.value = "none";
  const selectElementAudio = document.getElementById("screenrecord-audionameselect");
  selectElementAudio.value = "none";
}

document.getElementById("screenrecord-nameselect").onchange = async () => {
  const selectElement = document.getElementById("screenrecord-nameselect");
  const screen_value = selectElement.value;
  console.log("screen_value:", screen_value);
  if (screen_value == "none") {
    clearVideoAudio();
    return;
  }

  let media_source;

  const video_setup = {
    mandatory: {
      frameRate: { ideal: 16, max: 24 },
      chromeMediaSource: "desktop",
      chromeMediaSourceId: screen_value,
    },
  };

  try {
    media_source = await navigator.mediaDevices.getUserMedia({
      video: video_setup,
      audio: false,
    });

    // Assign the media stream to the video element to start streaming
    const videoElement = document.querySelector("#screenrecord-feed video");
    videoElement.srcObject = media_source;
    videoElement.play(); // Start playing the video stream
  } catch (error) {
    alert("Error capturing screen:", error);
  }
};

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
  const selectElement = document.getElementById("screenrecord-nameselect");

  if (videoElement.srcObject == null || selectElement.value == "none") {
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

function setRemoveHeader(add_message, message, flash_bool) {
  const scroll_flash_text = "scroll-flash-text";
  const scroll_text = "scroll-text";
  const flash_text = "flash-text";

  var container = document.getElementById("screenrecord-message");
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
