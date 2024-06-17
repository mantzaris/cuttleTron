const { ipcRenderer } = window.electron;
//TODO: change name of file to window-utilities

export function initializeTooltips(className) {
  var tooltipTriggerList = [].slice.call(document.querySelectorAll(className));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl, {
      html: true, // Ensure HTML content is allowed
    });
  });
}

export function updateTooltipImage(elementId, newImagePath) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Element not found:", elementId);
    return;
  }

  // Set the new title with the image
  element.setAttribute("data-bs-original-title", `<img src='${newImagePath}' alt='Tooltip Image' class='screenshot-tooltip-image'>`);

  // Update the tooltip if it's already shown
  const bootstrapTooltip = bootstrap.Tooltip.getInstance(element);
  if (bootstrapTooltip) {
    bootstrapTooltip.update();
  }
}

export async function getWebcamSources() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.error("MediaDevices API is not available.");
    return null;  // Indicate that the feature isn't supported.
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === "videoinput");
    
    if (videoDevices.length === 0) {
      console.log("No webcam devices found.");
      return [];  // Return an empty array if no video devices are found.
    }

    return videoDevices.map((device, index) => ({
      id: device.deviceId,
      name: device.label || `Unnamed Webcam ${index + 1}`, // Numbered label if no name
      thumbnail: "",  // Webcams don't have thumbnails
      type: "webcam",
    }));
  } catch (error) {
    console.error("Error enumerating devices:", error);
    return null;  // Return null to indicate an error during the fetching process.
  }
  // const mediaDevices = await navigator.mediaDevices.enumerateDevices();

  // return mediaDevices
  //   .filter((device) => device.kind === "videoinput")
  //   .map((device) => ({
  //     id: device.deviceId,
  //     name: device.label,
  //     thumbnail: "", // Webcams don't have thumbnails
  //     type: "webcam",
  //   }));
}

export function setRemoveHeader(div_id, add_message, message, flash_bool = false) {
  const scroll_flash_text = "scroll-flash-text";
  const scroll_text = "scroll-text";
  const flash_text = "flash-text";

  var container = document.getElementById(div_id);
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
