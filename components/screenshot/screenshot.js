const { ipcRenderer } = window.electron;
const { joinPath, writeFileSync, bufferFrom, getDirname, getTargetDir } = window.nodeModules;
import { generateRandomString } from "../../utilities/utils.js";

async function getSavingFilePath() {
  const targetDir = await getTargetDir();

  const randomString = generateRandomString(5);
  return await joinPath([targetDir, `screenshot__${randomString}.png`]);
}

document.getElementById("screenshot-expand").onclick = () => {
  const screenshot = document.querySelector("#screenshot");
  const expand_button = document.getElementById("screenshot-expand");

  if (expand_button.getAttribute("data-action") === "expand") {
    screenshot.classList.add("expanded");
    expand_button.textContent = "Hide";
    expand_button.setAttribute("data-action", "hide");
  } else {
    clearVideo();
    screenshot.classList.remove("expanded");
    expand_button.textContent = "Expand";
    expand_button.setAttribute("data-action", "expand");
  }

  populateScreenOptions();
};

// Fetch available screen capture sources and populate the dropdown
function populateScreenOptions() {
  ipcRenderer.invoke("getCaptureID").then((sources) => {
    let selection_sources = document.getElementById("screenshot-nameselect");
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

document.getElementById("screenshot-refresh").onclick = () => {
  populateScreenOptions();
};

function clearVideo() {
  const videoElement = document.querySelector("#screenshot-feed video");
  videoElement.srcObject = null; // Remove the media stream source
  videoElement.pause(); // Pause the video playback

  // Clear the selection in the dropdown
  const selectElement = document.getElementById("screenshot-nameselect");
  selectElement.value = "none";
}

document.getElementById("screenshot-nameselect").onchange = async () => {
  const selectElement = document.getElementById("screenshot-nameselect");
  const screen_value = selectElement.value;

  if (screen_value == "none") {
    clearVideo();
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
    const videoElement = document.querySelector("#screenshot-feed video");
    videoElement.srcObject = media_source;
    videoElement.play(); // Start playing the video stream
  } catch (error) {
    alert("Error capturing screen:", error);
  }
};

// select a screen to snap
document.getElementById("screenshot-snap").onclick = async () => {
  const videoElement = document.querySelector("#screenshot-feed video");
  const selectElement = document.getElementById("screenshot-nameselect");

  if (videoElement.srcObject == null || selectElement.value == "none") {
    writeMessageLabel("select screen feed", "gray");
    return;
  }

  const canvas = document.getElementById("screenshot-canvas");
  const ctx = canvas.getContext("2d");

  // Set canvas dimensions to match video
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  // Draw the current frame of the video onto the canvas
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  // Convert canvas content to PNG image data
  const imageData = canvas.toDataURL("image/png").replace(/^data:image\/\w+;base64,/, "");
  const buffer = bufferFrom(imageData, "base64");
  // Save the image data to a file
  const filePath = await getSavingFilePath();
  try {
    await writeFileSync({ filePath, buffer });
    writeMessageLabel("saved screenshot", "green");
  } catch (error) {
    writeMessageLabel("can't save", "red");
    console.error("Error writing file:", error);
  }
};

function writeMessageLabel(message, color) {
  const saveMessageLabel = document.getElementById("screenshot-saved");
  saveMessageLabel.textContent = message;
  saveMessageLabel.style.color = color; // Color for an error message
  saveMessageLabel.style.opacity = "1";

  // Hide the message after 1 seconds
  setTimeout(() => {
    saveMessageLabel.style.opacity = "0";
  }, 1200);
}
