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

document.getElementById("testMask").onclick = async () => {
  console.log("foo");

  // Send an IPC message to the main process to open the maskcam window
  await ipcRenderer.send("start-maskcam");

  const isMaskCamWindowOpen = await ipcRenderer.invoke("mask-opened");
  console.log("Is maskcam window open:", isMaskCamWindowOpen);
};
