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
  const mediaDevices = await navigator.mediaDevices.enumerateDevices();
  console.log("mediaDevices: ", mediaDevices);
  return mediaDevices
    .filter((device) => device.kind === "videoinput")
    .map((device) => ({
      id: device.deviceId,
      name: device.label,
      thumbnail: "", // Webcams don't have thumbnails
      type: "webcam",
    }));
}
