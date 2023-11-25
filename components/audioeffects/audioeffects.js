var ipcRenderer = window.electron.ipcRenderer;
document.getElementById("audioeffects-expand").onclick = function () {
    var audioeffects = document.querySelector("#audioeffects");
    var expand_button = document.getElementById("audioeffects-expand");
    if (expand_button.getAttribute("data-action") === "expand") {
        audioeffects.classList.add("expanded");
        expand_button.textContent = "Hide";
        expand_button.setAttribute("data-action", "hide");
    }
    else {
        audioeffects.classList.remove("expanded");
        expand_button.textContent = "Expand";
        expand_button.setAttribute("data-action", "expand");
    }
    //populateScreenOptions();
};
//# sourceMappingURL=audioeffects.js.map