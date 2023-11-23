const { ipcRenderer } = window.electron;
const { joinPath, writeFileSync, bufferFrom, getTargetDir } = window.nodeModules;
import { generateRandomString } from "../../utilities/utils.js";

import { initializeTooltips, getWebcamSources } from "../main-components/main-utilities.js";

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
  ipcRenderer.invoke("getCaptureID").then(async (sources) => {
    let dropdownMenu = document.getElementById("screenshot-selectionUL");
    dropdownMenu.innerHTML = "";

    // Add 'None' option
    let noneItem = document.createElement("li");
    let noneAnchor = document.createElement("a");
    noneAnchor.classList.add("dropdown-item");
    noneAnchor.href = "#";
    noneAnchor.textContent = "none";
    noneAnchor.addEventListener("click", function (event) {
      event.preventDefault();
      document.getElementById("screenshot-screen-select-btn").textContent = this.textContent;
      screenshotSelection({ type: "none" }); // Call the handler function
    });
    noneItem.appendChild(noneAnchor);
    dropdownMenu.appendChild(noneItem);

    const webcamSources = await getWebcamSources();
    const allSources = sources.concat(webcamSources);

    allSources.forEach((source) => {
      let listItem = document.createElement("li");
      let anchor = document.createElement("a");
      anchor.classList.add("dropdown-item");
      anchor.classList.add("class", "screenshot-screen-tooltip");
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
        document.getElementById("screenshot-screen-select-btn").textContent = this.textContent;
        screenshotSelection(source); // Call the handler function
      });

      listItem.appendChild(anchor);
      dropdownMenu.appendChild(listItem);
    });

    initializeTooltips(".screenshot-screen-tooltip");
  });
}

document.getElementById("screenshot-refresh").onclick = () => {
  populateScreenOptions();
};

async function screenshotSelection(source) {
  if ("type" in source && source.type == "none") {
    clearVideo();
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
    const videoElement = document.querySelector("#screenshot-feed video");

    media_source = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false,
    });

    videoElement.srcObject = media_source;
    videoElement.play(); // Start playing the video stream
  } catch (error) {
    alert("Error capturing screen:", error);
  }
}

function clearVideo() {
  const videoElement = document.querySelector("#screenshot-feed video");
  videoElement.srcObject = null; // Remove the media stream source
  videoElement.pause(); // Pause the video playback

  // Clear the selection in the dropdown
  const selectElement = document.getElementById("screenshot-screen-select-btn");
  selectElement.textContent = "none";
}

// select a screen to snap
document.getElementById("screenshot-snap").onclick = async () => {
  const videoElement = document.querySelector("#screenshot-feed video");
  const selectElement = document.getElementById("screenshot-screen-select-btn");

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
