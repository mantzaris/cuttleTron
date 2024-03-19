const { ipcRenderer } = window.electron;

import { initializeTooltips, getWebcamSources } from "../main-components/main-utilities.js";

document.getElementById("maskcam-expand").onclick = () => {
  const maskcam = document.querySelector("#maskcam");
  const expand_button = document.getElementById("maskcam-expand");

  if (expand_button.getAttribute("data-action") === "expand") {
    maskcam.classList.add("expanded");
    expand_button.textContent = "Hide";
    expand_button.setAttribute("data-action", "hide");
  } else {
    clearVideo();
    maskcam.classList.remove("expanded");
    expand_button.textContent = "Expand";
    expand_button.setAttribute("data-action", "expand");
  }

  //populateScreenOptions(screenSelMenuId, screen_sel_btn_id, tooltipClassName, maskcamSelection);
};

document.getElementById("maskcam-start").onclick = async () => {
  const webcam_show = document.getElementById("webcamFeedCheck").checked;
  const mesh_show = document.getElementById("faceMeshCheck").checked;
  const basic_mask_show = document.getElementById("basicMaskCheck").checked;

  const mask_settings = {
    webcam_show,
    mesh_show,
    basic_mask_show,
  };

  const isMaskCamWindowOpen = await ipcRenderer.invoke("mask-opened");
  console.log("maskcam window open?:", isMaskCamWindowOpen);

  if (!isMaskCamWindowOpen) {
    // Send an IPC message to the main process to open the maskcam window
    await ipcRenderer.send("start-maskcam", mask_settings);
  }

  ipcRenderer.send("update-mask-view-settings", mask_settings);
};

document.getElementById("maskcam-stop").onclick = async () => {
  await ipcRenderer.send("stop-maskcam");
};
