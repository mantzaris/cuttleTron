export function initializeTooltips() {
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
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
  element.setAttribute("data-bs-original-title", `<img src='${newImagePath}' alt='Tooltip Image' class='tooltip-image'>`);

  // Update the tooltip if it's already shown
  const bootstrapTooltip = bootstrap.Tooltip.getInstance(element);
  if (bootstrapTooltip) {
    bootstrapTooltip.update();
  }
}
