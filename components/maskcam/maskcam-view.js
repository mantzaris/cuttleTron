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
    meshRaw: { enabled: true, return: true },
    iris: { enabled: true, return: true },
    distance: { enabled: true, return: true },
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
let videoContainer;
let canvas;
let ctx;
let webcam_aspectRatio;

document.addEventListener("DOMContentLoaded", async () => {
  videoElement = document.getElementById("maskcam-webcam-feed");
  videoContainer = document.getElementById("video-container");
  canvas = document.getElementById("face-mesh-canvas");
  ctx = canvas.getContext("2d");

  if (navigator.mediaDevices.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(webcam_constraints);
      videoElement.srcObject = stream;
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
          ipcRenderer.send("resize-window", { aspectRatio }); // Initial resize
          webcam_aspectRatio = aspectRatio;
          adjustVideoSize(); // Adjust video and canvas size within the container
          resolve();
        };
      });

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
    const canvas = document.getElementById("face-mesh-canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings

    result.face.forEach((face) => {
      drawMesh(face.mesh, ctx); // You can also use meshRaw depending on your needs
    });

    console.log(result);
    console.log(result.face[0].rotation);
    console.log("distance:", result.face[0].distance);
    console.log("Face detected:", result.face[0].age);
    // result.hand
    // result.body
    // result.face[0].meshRaw
    // result.face[0].iris
    // result.face[0].mesh
    // You can use face landmarks to overlay graphics or perform other operations
  }

  if (attempts < 180) requestAnimationFrame(processVideoFrame);
  attempts++;
}

function drawMesh(mesh, ctx) {
  const scaleX = videoElement.offsetWidth / videoElement.videoWidth;
  const scaleY = videoElement.offsetHeight / videoElement.videoHeight;

  mesh.forEach((point) => {
    const size = 2; // Size of the square around the point
    const x = point[0] * scaleX; //- size / 2;
    const y = point[1] * scaleY; // - size / 2;

    ctx.fillStyle = "blue"; // Draw blue boxes around mesh points
    ctx.fillRect(x, y, size, size);
  });

  // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear previous frame
  // ctx.fillStyle = "red";
  // ctx.fillRect(10, 10, 50, 50); // Draw a red box for testing
}

window.addEventListener("resize", adjustVideoSize);

function adjustVideoSize() {
  if (!videoContainer) {
    console.warn("Video container not initialized.");
    return;
  }

  const containerWidth = videoContainer.offsetWidth;
  const containerHeight = videoContainer.offsetHeight;
  const containerAspectRatio = containerWidth / containerHeight;

  if (containerAspectRatio > webcam_aspectRatio) {
    videoElement.style.width = `${containerHeight * webcam_aspectRatio}px`;
    videoElement.style.height = `${containerHeight}px`;
  } else {
    videoElement.style.width = `${containerWidth}px`;
    videoElement.style.height = `${containerWidth / webcam_aspectRatio}px`;
  }

  canvas.width = videoElement.offsetWidth;
  canvas.height = videoElement.offsetHeight;
}
