const { ipcRenderer } = window.electron;

document.getElementById("install-dependencies").onclick = () => {
  ipcRenderer.invoke("install-dependencies").then((response) => {
    if (response.success) {
      console.log("Dependencies installed successfully.");
      alert("Dependencies installed successfully.");
    } else {
      console.error(`Installation failed: ${response.error}`);
      alert(`Installation failed: ${response.error}`);
    }
  });
};
