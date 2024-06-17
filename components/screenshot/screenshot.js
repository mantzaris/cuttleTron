const { ipcRenderer } = window.electron;
const { joinPath, writeFileSync, bufferFrom, getTargetDir } = window.nodeModules;
import { fileNameCollisionCheck,generateRandomString } from "../../utilities/utils.js";

import { initializeTooltips, getWebcamSources } from "../component-utilities/component-utilities.js";

const screenSelMenuId = "screenshot-selectionUL";
const screen_sel_btn_id = "screenshot-screen-select-btn";
const tooltipClassName = "screenshot-screen-tooltip";

async function getSavingFilePath(filename) {
  const targetDir = await getTargetDir();

  if (!filename.toLowerCase().endsWith(".png")) {
    filename += ".png";
  }

  return await joinPath([targetDir, filename]);
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

  populateScreenOptions(screenSelMenuId, screen_sel_btn_id, tooltipClassName, screenshotSelection);
};

document.getElementById("screenshot-refresh").onclick = () => {
  populateScreenOptions(screenSelMenuId, screen_sel_btn_id, tooltipClassName, screenshotSelection);
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
  } else if(source.type == "portal") {
    try {
      const sources = await ipcRenderer.invoke("getCaptureID");
      const userSelectedSource = sources[0];
      
      if (!sources || sources.length === 0) {
        alert('No sources available for capturing.');
        return;
      }

      if (!userSelectedSource) {
        alert('No source selected.');
        return;
      }
      videoConstraints = {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: userSelectedSource.id,
          frameRate: { ideal: 16, max: 24 },
        }
      };
    } catch (error) {
      alert("Error fetching screen/window sources:", error);
      return;
    }

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
  let fileName = document.getElementById("screenshot-filename-input").value;
  const videoElement = document.querySelector("#screenshot-feed video");
  const selectElement = document.getElementById("screenshot-screen-select-btn");

  if(!fileName) {
    await updateFilenameForNextSave();
    fileName = document.getElementById("screenshot-filename-input").value;
  }

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
  const filePath = await getSavingFilePath(fileName);
  try {
    await writeFileSync({ filePath, buffer });
    writeMessageLabel("saved screenshot", "green");
    await updateFilenameForNextSave();
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

////////////////////////////////////////////////////////////////////////////////////
//produce the thumbnails for the screen selections on the selection
////////////////////////////////////////////////////////////////////////////////////
export async function populateScreenOptions(dropdownMenuId, buttonId, tooltipClassName, optionClickCallBack, screens = true, webcams = true) {
  const dropdownMenu = document.getElementById(dropdownMenuId);
  dropdownMenu.innerHTML = "";

  try {
    //fetch available screen capture sources combine with webcam sources
    let allSources = [];
    const X11orWayland = await ipcRenderer.invoke("systemX11orWayland");
    
    if (screens) {
      if(X11orWayland == 'x11') {
        const sources = await ipcRenderer.invoke("getCaptureID");
        allSources = allSources.concat(sources);
      } else if(X11orWayland == "wayland") {
        const portal_option = {
          id: "portal",
          name: "select screen/window",
          thumbnail: "",  // wayland portal doesn't have thumbnails
          type: "portal",
        }

        allSources = allSources.concat(portal_option);
      }
    }

    if (webcams) {
      const webcamSources = await getWebcamSources();
      if (webcamSources === null) {
        console.error("Failed to fetch webcam sources.");
        // Optionally handle the error, e.g., disable webcam-related UI elements
      } else if (webcamSources.length === 0) {
        console.log("No webcams found.");
        // Optionally handle no webcams found, e.g., display a message in the UI
      } else {
        allSources = allSources.concat(webcamSources);
      }
    }

    addScreenDropOptions(dropdownMenu, buttonId, tooltipClassName, optionClickCallBack, { name: "none", type: "none" });
    allSources.forEach((source) => {
      addScreenDropOptions(dropdownMenu, buttonId, tooltipClassName, optionClickCallBack, source);
    });

    initializeTooltips("." + tooltipClassName);
  } catch (error) {
    console.error("Error populating screen options:", error);
    return;
  }
}

export function addScreenDropOptions(dropdownMenu, buttonId, tooltipClassName, optionClickCallBack, source) {
  let listItem = document.createElement("li");
  let anchor = document.createElement("a");
  anchor.classList.add("dropdown-item");
  anchor.href = "#";
  anchor.textContent = source.name;
  anchor.addEventListener("click", function (event) {
    event.preventDefault();
    document.getElementById(buttonId).textContent = this.textContent;
    optionClickCallBack(source); // Call the handler function
  });

  if (source.type !== "none") {
    let tooltipContent;
    switch (source.type) {
      case "webcam":
        tooltipContent = "No thumbnail for webcam";
        break;
      case "portal":
        tooltipContent = "Click to select screen/window";
        break;
      default:
        tooltipContent = `<img src='${source.thumbnail}' alt='Thumbnail'>`;
        break;
    }

    anchor.classList.add(tooltipClassName);
    anchor.setAttribute("data-bs-toggle", "tooltip");
    anchor.setAttribute("title", tooltipContent);
    anchor.setAttribute("data-tooltip-init", "false"); // Custom attribute to control tooltip initialization

  }

  listItem.appendChild(anchor);
  dropdownMenu.appendChild(listItem);
}

document.getElementById("screenshot-filename-input").oninput = async (event) => {
  const fileName = event.target.value;
  const fileExists = await fileNameCollisionCheck(fileName, [".png", ".jpg"]);

  if (fileExists) {
    document.getElementById("screenshot-snap").disabled = true;
    writeMessageLabel("file exists", "brown");
    return;
  }

  if (document.getElementById("screenshot-snap").disabled) {
    document.getElementById("screenshot-snap").disabled = false;
  }
};

async function updateFilenameForNextSave() {
  const filenameInput = document.getElementById("screenshot-filename-input");
  let currentFilename = filenameInput.value;

  if(!currentFilename || currentFilename.length == 0) {
    currentFilename = generateRandomString(5);
    currentFilename += "-";
    const fileExists = await fileNameCollisionCheck(currentFilename, [".png", ".jpg"]);
    if(fileExists) {
      currentFilename = generateRandomString(5);
      currentFilename += "-";
    }
  }

  // Regular expression to separate the base filename, number part, and extension
  const filenameRegex = /^(.*?)(\d*)(\.[^.]+)?$/;
  const matches = currentFilename.match(filenameRegex);

  let baseFilename = matches[1];
  let numberPart = matches[2];
  let extension = matches[3] || ""; // Include the extension if present

  if (numberPart) {
    let incrementedNumber = parseInt(numberPart, 10) + 1;
    let paddedNumber = incrementedNumber.toString().padStart(numberPart.length, "0");
    currentFilename = baseFilename + paddedNumber + extension;
  } else {
    currentFilename = baseFilename + "001" + extension;
  }

  filenameInput.value = currentFilename;
}
