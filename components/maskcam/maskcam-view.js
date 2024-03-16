const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

const tf = require("@tensorflow/tfjs");
const Human = require("@vladmandic/human").default;

const model_path = path.join(__dirname, "models");

const human_config = {
  backend: "webgl", // Specify the backend to use, wasm alternative
  modelBasePath: model_path,
  face: {
    enabled: true,
    detector: { rotation: true, maxDetected: 5, return: true },
    mesh: { enabled: true, return: true },
    iris: { enabled: true, return: true },
    description: { enabled: true },
  },
};

const human = new Human(human_config);

const webcam_constraints = {
  video: {
    frameRate: { ideal: 20, max: 24 }, // Target frame rate between 14-24 fps
  },
};

let videoElement;

document.addEventListener("DOMContentLoaded", async () => {
  videoElement = document.getElementById("maskcam-webcam-feed");

  if (navigator.mediaDevices.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(webcam_constraints);
      videoElement.srcObject = stream;
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          resolve();
        };
      });

      // Now that the video's metadata is loaded, we can access its dimensions
      const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;

      // Send a message to the main process to resize the window
      ipcRenderer.send("resize-window", { aspectRatio });

      requestAnimationFrame(processVideoFrame);
    } catch (error) {
      console.log("Something went wrong with accessing the webcam!", error);
    }
  } else {
    console.log("getUserMedia not supported by your browser!");
  }
});

let attempts = 0;

async function processVideoFrame() {
  if (videoElement.paused || videoElement.ended) return;

  // Run detection
  const result = await human.detect(videoElement);

  // You can access various results, e.g., face landmarks
  if (result.face.length > 0) {
    console.log(result);
    console.log("Face detected:", result.face[0].age);
    // You can use face landmarks to overlay graphics or perform other operations
  }

  if (attempts < 10) requestAnimationFrame(processVideoFrame);
  attempts++;
}

// async function runDetection(imageData) {
//   try {
//     const result = await window.humanAPI.detect(imageData);
//     console.log(result);
//   } catch (error) {
//     console.error('Error running detection:', error);
//   }
// }
