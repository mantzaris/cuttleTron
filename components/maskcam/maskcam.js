const { ipcRenderer } = window.electron;

import { setRemoveHeader } from "../component-utilities/component-utilities.js";

const start_btn = document.getElementById("maskcam-start");

document.getElementById("maskcam-expand").onclick = () => {
  const maskcam = document.querySelector("#maskcam");
  const expand_button = document.getElementById("maskcam-expand");

  if (expand_button.getAttribute("data-action") === "expand") {
    maskcam.classList.add("expanded");
    expand_button.textContent = "Hide";
    expand_button.setAttribute("data-action", "hide");
  } else {
    //clearVideo();
    maskcam.classList.remove("expanded");
    expand_button.textContent = "Expand";
    expand_button.setAttribute("data-action", "expand");
  }

  //populateScreenOptions(screenSelMenuId, screen_sel_btn_id, tooltipClassName, maskcamSelection);
};

start_btn.onclick = async () => {
  const webcam_show = document.getElementById("webcamFeedCheck").checked;
  const mesh_show = document.getElementById("faceMeshCheck").checked;
  const basic_mask_show = document.getElementById("basicMaskCheck").checked;

  const mask_settings = {
    webcam_show,
    mesh_show,
    basic_mask_show,
  };

  const isMaskCamWindowOpen = await ipcRenderer.invoke("mask-opened");
  console.log("maskcam start button, maskcam window open (in maskcam.js)?:", isMaskCamWindowOpen);
  console.log(`maskcam start button, maskcam_settings = `, mask_settings);
  const action = start_btn.getAttribute("data-action"); //init or stream

  if (action == "init") {
    start_btn.setAttribute("data-action", "stream");
    start_btn.textContent = "STREAM";

    if (!isMaskCamWindowOpen) {
      const message = await ipcRenderer.invoke("init-maskcam", mask_settings);
      setMaskcamStatusLabels("set up:", message);

      return;
    }
  } else if (action == "stream") {
    //activate stream start
    start_btn.textContent = "UPDATE";
    start_btn.setAttribute("data-action", "update");

    const message = await ipcRenderer.invoke("stream-maskcam", mask_settings);
    setRemoveHeader("maskcam-message", true, message, true);
    setMaskcamStatusLabels("streaming to:", message);
  } else if (action == "update") {
    ipcRenderer.send("update-maskcam", mask_settings);
  }
};

document.getElementById("maskcam-stop").onclick = async () => {
  const action = start_btn.getAttribute("data-action"); //init or stream

  start_btn.textContent = "INIT";
  start_btn.setAttribute("data-action", "init");
  await ipcRenderer.send("stop-maskcam");
  setMaskcamStatusLabels("", "");
  setRemoveHeader("maskcam-message", false, null, false);
};

function setMaskcamStatusLabels(status, message) {
  document.getElementById("maskcam-status-label").textContent = status;
  document.getElementById("maskcam-device-name").textContent = message;
}
