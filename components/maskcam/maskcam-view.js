const { ipcRenderer } = window.electron;

document.addEventListener("DOMContentLoaded", async () => {
  const videoElement = document.getElementById("maskcam-webcam-feed");

  if (navigator.mediaDevices.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoElement.srcObject = stream;
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          resolve();
        };
      });

      // Now that the video's metadata is loaded, we can access its dimensions
      const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;

      // Send a message to the main process to resize the window
      // This requires ipcRenderer to be exposed to your renderer process
      ipcRenderer.send("resize-window", { aspectRatio });
    } catch (error) {
      console.log("Something went wrong with accessing the webcam!", error);
    }
  } else {
    console.log("getUserMedia not supported by your browser!");
  }
});
