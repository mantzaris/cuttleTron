const { ipcRenderer } = window.electron;

document.getElementById("audioeffects-expand").onclick = () => {
  const audioeffects = document.querySelector("#audioeffects");
  const expand_button = document.getElementById("audioeffects-expand");

  if (expand_button.getAttribute("data-action") === "expand") {
    audioeffects.classList.add("expanded");
    expand_button.textContent = "Hide";
    expand_button.setAttribute("data-action", "hide");
  } else {
    audioeffects.classList.remove("expanded");
    expand_button.textContent = "Expand";
    expand_button.setAttribute("data-action", "expand");
  }

  //populateScreenOptions();
};
