const { ipcRenderer } = window.electron;
const { joinPath, writeFileSync, bufferFrom, getTargetDir } =
  window.nodeModules;
import {
  fileNameCollisionCheck,
  generateRandomString,
} from "../../utilities/utils.js";

import {
  initializeTooltips,
  getWebcamSources,
  setRemoveHeader,
} from "../component-utilities/component-utilities.js";

const screenSelMenuId = "screenshot-selectionUL";
const screen_sel_btn_id = "screenshot-screen-select-btn";
const tooltipClassName = "screenshot-screen-tooltip";

let mediaSource;
let autoCapture = false;
let captureInterval = null;
let autoCaptureFilenameFirst = "";
let autoCaptureFilenameLast = "";

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
    setRemoveHeader("screenshot-message", false, "", false);
  } else {
    screenshot.classList.remove("expanded");
    expand_button.textContent = "Expand";
    expand_button.setAttribute("data-action", "expand");
    if (!autoCapture) {
      //if no auto capture then leave, or else clear
      clearVideo();
    } else {
      setRemoveHeader("screenshot-message", true, "auto-capturing", true);
    }
  }

  populateScreenOptions(
    screenSelMenuId,
    screen_sel_btn_id,
    tooltipClassName,
    screenshotSelection
  );
};

document.getElementById("screenshot-refresh").onclick = () => {
  populateScreenOptions(
    screenSelMenuId,
    screen_sel_btn_id,
    tooltipClassName,
    screenshotSelection
  );
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
  } else if (source.type == "portal") {
    try {
      const sources = await ipcRenderer.invoke("getCaptureID");
      const userSelectedSource = sources[0];
      console.log(`window Wayland id = ${sources[0].id}`);
      if (!sources || sources.length === 0) {
        ipcRenderer.invoke("show-dialog", {
          type: "info",
          title: "No screen sources",
          message: `No sources available for capturing.`,
          buttons: ["OK"],
          defaultId: 0,
        });
        return;
      }

      if (!userSelectedSource) {
        ipcRenderer.invoke("show-dialog", {
          type: "info",
          title: "No selected source",
          message: `No source selected.`,
          buttons: ["OK"],
          defaultId: 0,
        });
        return;
      }
      videoConstraints = {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: userSelectedSource.id,
          frameRate: { ideal: 16, max: 24 },
        },
      };
    } catch (error) {
      ipcRenderer.invoke("show-dialog", {
        type: "error",
        title: "Cannot fetch source",
        message: `Error fetching screen/window sources:, ${error}`,
        buttons: ["OK"],
        defaultId: 0,
      });
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
    const videoElement = document.querySelector("#screenshot-feed video");

    mediaSource = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false,
    });

    videoElement.srcObject = mediaSource;
    videoElement.play(); // Start playing the video stream
    mediaInactiveHandle();
  } catch (error) {
    ipcRenderer.invoke("show-dialog", {
      type: "error",
      title: "Error capturing screen",
      message: `Error capturing screen: ${error} `,
      buttons: ["OK"],
      defaultId: 0,
    });
  }
}

function mediaInactiveHandle() {
  // Handle the stream becoming inactive
  mediaSource.oninactive = () => {
    clearVideo();

    if (
      document.getElementById("screenshot-screen-select-btn").textContent ==
      "none"
    ) {
      return;
    }

    console.info("The stream has become inactive.");
    ipcRenderer.invoke("show-dialog", {
      type: "info",
      title: "Stream Inactive",
      message: "The captured window was closed or lost.",
      buttons: ["OK"],
      defaultId: 0,
    });
  };
}

function clearVideo() {
  if (mediaSource) {
    const tracks = mediaSource.getTracks();
    tracks.forEach((track) => track.stop()); // Ensure all tracks are stopped
  }

  mediaSource = null; // Clear the global reference

  const videoElement = document.querySelector("#screenshot-feed video");
  videoElement.srcObject = null; // Remove the media stream source
  videoElement.pause(); // Pause the video playback

  // Clear the selection in the dropdown
  const selectElement = document.getElementById("screenshot-screen-select-btn");
  selectElement.textContent = "none";

  document.getElementById("screenshot-filename-input").value = "";

  if (autoCapture) {
    setRemoveHeader("screenshot-message", false, "", false);

    if (document.getElementById("screenshot-gif-checkbox")?.checked) {
      document.getElementById("screenshot-stop-auto").click();
    } else {
      autoCaptureFilenameFirst = "";
      autoCaptureFilenameLast = "";
    }

    autoCapture = false;
  }
}

// select a screen to snap
document.getElementById("screenshot-snap").onclick = async () => {
  let fileName = document.getElementById("screenshot-filename-input").value;
  const videoElement = document.querySelector("#screenshot-feed video");
  const selectElement = document.getElementById("screenshot-screen-select-btn");

  if (!fileName) {
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
  const imageData = canvas
    .toDataURL("image/png")
    .replace(/^data:image\/\w+;base64,/, "");
  const buffer = bufferFrom(imageData, "base64");
  // Save the image data to a file
  const filePath = await getSavingFilePath(fileName);

  try {
    await writeFileSync({ filePath, buffer });
    writeMessageLabel("saved screenshot", "green");

    if (
      autoCapture &&
      document.getElementById("screenshot-gif-checkbox")?.checked
    ) {
      if (autoCaptureFilenameFirst.length > 0)
        autoCaptureFilenameLast = fileName;

      if (autoCaptureFilenameFirst.length == 0)
        autoCaptureFilenameFirst = fileName;
    }

    await updateFilenameForNextSave();
  } catch (error) {
    document.getElementById("screenshot-stop-auto").click();
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
export async function populateScreenOptions(
  dropdownMenuId,
  buttonId,
  tooltipClassName,
  optionClickCallBack,
  screens = true,
  webcams = true
) {
  const dropdownMenu = document.getElementById(dropdownMenuId);
  dropdownMenu.innerHTML = "";

  try {
    //fetch available screen capture sources combine with webcam sources
    let allSources = [];
    const X11orWayland = await ipcRenderer.invoke("system-X11-or-wayland");

    if (screens) {
      if (X11orWayland == "x11") {
        const sources = await ipcRenderer.invoke("getCaptureID");
        allSources = allSources.concat(sources);
      } else if (X11orWayland == "wayland") {
        const portal_option = {
          id: "portal",
          name: "select screen/window",
          thumbnail: "", // wayland portal doesn't have thumbnails
          type: "portal",
        };

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

    addScreenDropOptions(
      dropdownMenu,
      buttonId,
      tooltipClassName,
      optionClickCallBack,
      { name: "none", type: "none" }
    );
    allSources.forEach((source) => {
      addScreenDropOptions(
        dropdownMenu,
        buttonId,
        tooltipClassName,
        optionClickCallBack,
        source
      );
    });

    initializeTooltips("." + tooltipClassName);
  } catch (error) {
    console.error("Error populating screen options:", error);
    return;
  }
}

export function addScreenDropOptions(
  dropdownMenu,
  buttonId,
  tooltipClassName,
  optionClickCallBack,
  source
) {
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

document.getElementById("screenshot-filename-input").oninput = async (
  event
) => {
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

async function updateFilenameForNextSave(returnNames = false) {
  const filenameInput = document.getElementById("screenshot-filename-input");
  let currentFilename = filenameInput.value;

  if (!currentFilename || currentFilename.length == 0) {
    currentFilename = generateRandomString(5);
    // currentFilename += "-";
    const fileExists = await fileNameCollisionCheck(currentFilename, [
      ".png",
      ".jpg",
    ]);
    if (fileExists) {
      currentFilename = generateRandomString(5);
      // currentFilename += "-";
    }
  }

  // Regular expression to separate the base filename, number part, and extension
  const filenameRegex = /^(.*?)(\d*)(\.[^.]+)?$/;
  const matches = currentFilename.match(filenameRegex);

  const baseFilename = matches[1];
  let numberPart = matches[2];
  let extension = matches[3] || ""; // Include the extension if present

  if (numberPart) {
    let incrementedNumber = parseInt(numberPart, 10) + 1;
    //let paddedNumber = incrementedNumber.toString().padStart(numberPart.length, "0");
    let paddedNumber = incrementedNumber.toString().padStart(4, "0");
    currentFilename = baseFilename + paddedNumber + extension;
  } else {
    currentFilename = baseFilename + "0001" + extension;
  }

  filenameInput.value = currentFilename;

  // Optionally return the filenames if requested
  if (returnNames) {
    return { currentFilename, baseFilename };
  }
}

// * autocapture functionality
document.getElementById("screenshot-start-auto").onclick = () => {
  const snapButton = document.getElementById("screenshot-snap");

  const intervalInput = document.getElementById("screenshot-interval-input");
  let intervalTime = parseFloat(intervalInput.value) * 1000; // Convert seconds to milliseconds
  const minInterval = parseFloat(intervalInput.min) * 1000; // Convert min from seconds to milliseconds
  const maxInterval = parseFloat(intervalInput.max) * 1000; // Convert max from seconds to milliseconds

  if (
    !autoCapture &&
    mediaSource &&
    !snapButton.disabled &&
    intervalTime >= minInterval &&
    intervalTime <= maxInterval
  ) {
    autoCapture = true;

    document.getElementById("screenshot-start-auto").disabled = true;
    document.getElementById("screenshot-stop-auto").disabled = false; // Enable stop button

    updateFilenameForGifCreation();

    // Set the interval to simulate the snap button click
    captureInterval = setInterval(() => {
      if (!snapButton.disabled) {
        // Check if the snap button is still enabled
        snapButton.click();
      } else {
        clearInterval(captureInterval); // Stop the interval if snap button is disabled

        document.getElementById("screenshot-stop-auto").click();
        document.getElementById("screenshot-start-auto").disabled = false; // Re-enable the start button
        document.getElementById("screenshot-stop-auto").disabled = true; // Disable stop button
      }
    }, intervalTime);
  } else {
    ipcRenderer.invoke("show-dialog", {
      type: "info",
      title: "Problem starting auto screen shot",
      message:
        "Please enter a valid interval for time or some other issue exist.",
      buttons: ["OK"],
      defaultId: 0,
    });
  }
};

document.getElementById("screenshot-stop-auto").onclick = () => {
  if (autoCapture) {
    clearInterval(captureInterval); // Clear the interval
    document.getElementById("screenshot-start-auto").disabled = false; // Re-enable the start button
    document.getElementById("screenshot-stop-auto").disabled = true; // Disable stop button
    autoCapture = false; // Reset autoCapture state

    // Check if the checkbox for saving a GIF is selected
    const gifCheckbox = document.getElementById("screenshot-gif-checkbox");

    if (gifCheckbox.checked) {
      const fpsInput = document.getElementById("screenshot-gif-interval-input");
      const fps = parseFloat(fpsInput.value);

      // Optionally, you can add further logic here to handle GIF creation
      const { baseFilename, numDigits, startNumber, endNumber } =
        getBaseFilename(autoCaptureFilenameFirst, autoCaptureFilenameLast);
      ipcRenderer.invoke(
        "create-gif",
        baseFilename,
        numDigits,
        startNumber,
        endNumber,
        fps
      );
    }
  }

  autoCaptureFilenameFirst = "";
  autoCaptureFilenameLast = "";
  autoCapture = false;
};

function getBaseFilename(firstFileName, lastFileName) {
  // Regular expression to separate the base filename, number part
  const filenameRegex = /^(.*?)(\d*)(\.[^.]+)?$/;
  const matchesFirst = firstFileName.match(filenameRegex);
  const matchesSecond = lastFileName.match(filenameRegex);

  if (!matchesFirst || !matchesSecond) return null; // Handle the case where the filename doesn't match the expected format

  // Extract base filename and the number part
  const baseFilenameFirst = matchesFirst[1];
  const baseFilenameSecond = matchesSecond[1];

  if (baseFilenameFirst != baseFilenameSecond) return null;

  const numDigitsFirst = matchesFirst[2].length;
  const numDigitsSecond = matchesSecond[2].length;

  if (numDigitsFirst != numDigitsSecond) return null;

  const startNumber = parseInt(matchesFirst[2], 10);
  const endNumber = parseInt(matchesSecond[2], 10);

  return {
    baseFilename: baseFilenameFirst,
    numDigits: numDigitsFirst,
    startNumber,
    endNumber,
  };
}

document.addEventListener("DOMContentLoaded", function () {
  const intervalInput = document.getElementById("screenshot-interval-input");
  intervalInput.addEventListener("change", function () {
    let value = parseFloat(this.value);
    const min = parseFloat(this.min);
    const max = parseFloat(this.max);

    if (isNaN(value)) {
      this.value = 1.0; // Default value if the input is not a number
    } else if (value < min) {
      this.value = min; // Reset to minimum if value is below the min
    } else if (value > max) {
      this.value = max; // Cap at maximum if value exceeds the max
    }
  });

  const fpsInput = document.getElementById("screenshot-gif-interval-input");
  fpsInput.addEventListener("change", function () {
    const min = parseFloat(fpsInput.min);
    const max = parseFloat(fpsInput.max);
    let value = parseFloat(fpsInput.value);

    if (value < min) {
      fpsInput.value = min;
      // fpsInput.style.borderColor = 'red'; // Change border color to red if out of range
    } else if (value > max) {
      fpsInput.value = max;
      // fpsInput.style.borderColor = 'red'; // Change border color to red if out of range
    } else {
      fpsInput.style.borderColor = ""; // Reset border color if within range
    }
  });

  const checkbox = document.getElementById("screenshot-gif-checkbox");
  const intervalDiv = document.getElementById("screenshot-gif-interval-div");

  // Initially hide the interval div if the checkbox is not checked
  intervalDiv.style.display = checkbox.checked ? "flex" : "none";

  // Add event listener to toggle visibility based on checkbox state
  checkbox.addEventListener("change", function () {
    intervalDiv.style.display = this.checked ? "flex" : "none";
  });
});

function updateFilenameForGifCreation() {
  const gifCheckbox = document.getElementById("screenshot-gif-checkbox");
  const filenameInput = document.getElementById("screenshot-filename-input");

  if (gifCheckbox.checked) {
    let currentFilename = filenameInput.value;

    // Generate a random base string if the current filename is empty
    if (!currentFilename || currentFilename.length === 0) {
      currentFilename = generateRandomString(5) + "0001";
    }

    // Regular expression to separate the base filename, number part, and extension
    const filenameRegex = /^(.*?)(\d*)(\.[^.]+)?$/;
    const matches = currentFilename.match(filenameRegex);

    if (!matches) {
      // Handle invalid filename format
      return;
    }

    let baseFilename = matches[1];
    let numberPart = matches[2];
    let extension = matches[3] || ""; // Include the extension if present

    // Ensure the number part is a 4-digit number with leading zeros
    if (numberPart) {
      let paddedNumber = parseInt(numberPart, 10).toString().padStart(4, "0");
      currentFilename = baseFilename + paddedNumber + extension;
    } else {
      currentFilename = baseFilename + "0001" + extension;
    }

    filenameInput.value = currentFilename;
  }
}

function hasFourDigitsAtEnd(str) {
  const regex = /\d{4}$/;
  return regex.test(str);
}
