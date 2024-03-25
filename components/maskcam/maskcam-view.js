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
    emotion: { enabled: false },
  },
  gesture: { enabled: true },
};
//hand: { enabled: false, minConfidence: 0.1, maxDetected: 1, landmarks: true, rotation: false },
//attention: { enabled: true },
//body: { enabled: false, minConfidence: 0.1, maxDetected: 1, modelPath: 'blazepose-heavy.json' },

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

let webcam_show = true;
let mesh_show = true;
let basic_mask_show = true;

let maskcam_stop = false;

ipcRenderer.on("toggle-mask-view", (event, settings) => {
  //console.log(settings);
  let needsRedraw = false;
  maskcam_stop = false;

  if (settings.hasOwnProperty("webcam_show")) {
    webcam_show = settings.webcam_show;
    videoElement.style.visibility = webcam_show ? "visible" : "hidden";

    if (webcam_show) {
      // Ensure the video element has correct dimensions
      setTimeout(() => {
        adjustVideoSize(); // Adjust video and canvas size
        processVideoFrame(); // Start processing frames
      }, 0);
    }
  }
  if (settings.hasOwnProperty("mesh_show")) {
    mesh_show = settings.mesh_show;
    needsRedraw = true;
  }
  if (settings.hasOwnProperty("basic_mask_show")) {
    basic_mask_show = settings.basic_mask_show;
    needsRedraw = true;
  }

  //console.log(webcam_show, mesh_show, basic_mask_show);

  if (needsRedraw) {
    processVideoFrame();
  }
});

//called from main process to signal
ipcRenderer.on("stop-maskcam", (event) => {
  maskcam_stop = true;
});

ipcRenderer.on("anchor-mask-view", (event) => {
  const draggableElement = document.getElementById("maskcam-view-top");
  draggableElement.style.webkitAppRegion = "no-drag";
  document.body.style.pointerEvents = "none";
});

document.addEventListener("DOMContentLoaded", async () => {
  maskcam_stop = false;
  videoElement = document.getElementById("maskcam-webcam-feed");
  webcam_show ? (videoElement.style.visibility = "visible") : (videoElement.style.visibility = "hidden");

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
          ipcRenderer.send("webcam-size", { width: videoElement.videoWidth, height: videoElement.videoHeight }); // Initial resize
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

async function processVideoFrame() {
  if (maskcam_stop) return;
  if (videoElement.paused || videoElement.ended) return;

  // Run detection
  const result = await human.detect(videoElement);
  //console.log(result);

  // You can access various results, e.g., face landmarks
  if (result.face.length > 0) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings

    result.face.forEach((face) => {
      if (mesh_show) drawMesh(face.mesh, ctx); // You can also use meshRaw depending on your needs
      if (basic_mask_show) drawMask(face, ctx);
    });
    //console.log(result); // result.face[0].mesh.drawMesh // result.hand// result.body // result.face[0].annotations;
  }

  requestAnimationFrame(processVideoFrame);
}

//////////////////////////////////////
//draw a 'mask'
//////////////////////////////////////
function drawMask(face, ctx) {
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  const scaleX = videoElement.offsetWidth / videoElement.videoWidth;
  const scaleY = videoElement.offsetHeight / videoElement.videoHeight;

  const outline = face.annotations.silhouette;
  ctx.beginPath();
  outline.forEach((point, index) => {
    const x = point[0] * scaleX;
    const y = point[1] * scaleY;
    ctx[index === 0 ? "moveTo" : "lineTo"](x, y);
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.fill();

  //iris
  drawFeature(face.annotations.leftEyeIris, ctx, scaleX, scaleY);
  drawFeature(face.annotations.rightEyeIris, ctx, scaleX, scaleY);
  //mouth
  drawPairedFeatures(face.annotations.lipsUpperInner, face.annotations.lipsLowerInner, ctx, scaleX, scaleY);
  drawPairedFeatures(face.annotations.lipsUpperSemiOuter, face.annotations.lipsLowerSemiOuter, ctx, scaleX, scaleY);
  //eyes core
  drawPairedFeatures(face.annotations.leftEyeUpper0, face.annotations.leftEyeLower0, ctx, scaleX, scaleY);
  drawPairedFeatures(face.annotations.rightEyeUpper0, face.annotations.rightEyeLower0, ctx, scaleX, scaleY);
  //eyebrows
  drawPairedFeatures(face.annotations.leftEyebrowUpper, face.annotations.leftEyebrowLower, ctx, scaleX, scaleY);
  drawPairedFeatures(face.annotations.rightEyebrowUpper, face.annotations.rightEyebrowLower, ctx, scaleX, scaleY);
  //nose
  drawNose(
    {
      noseBottom: face.annotations.noseBottom,
      noseLeftCorner: face.annotations.noseLeftCorner,
      noseRightCorner: face.annotations.noseRightCorner,
      noseTip: face.annotations.noseTip,
      midwayBetweenEyes: face.annotations.midwayBetweenEyes,
    },
    ctx,
    scaleX,
    scaleY
  );
  //eyes periphery
  //drawPairedFeatures(face.annotations.leftEyeUpper1, face.annotations.leftEyeLower1, ctx, scaleX, scaleY);
  //drawPairedFeatures(face.annotations.rightEyeUpper1, face.annotations.rightEyeLower1, ctx, scaleX, scaleY);

  // for (const annotation of Object.keys(face.annotations)) {
  //   if (face_annotations.includes(annotation)) {
  //     drawFeature(face.annotations[annotation], ctx, scaleX, scaleY);
  //   }
  // }
}

function drawFeature(featurePoints, ctx, scaleX, scaleY) {
  ctx.beginPath();
  featurePoints.forEach((point, index) => {
    const x = point[0] * scaleX;
    const y = point[1] * scaleY;
    ctx[index === 0 ? "moveTo" : "lineTo"](x, y);
  });
  ctx.closePath();
  ctx.stroke(); // Or fill, depending on the desired effect
}

function drawPairedFeatures(upperFeaturePoints, lowerFeaturePoints, ctx, scaleX, scaleY) {
  ctx.beginPath();

  // Draw the upper feature
  upperFeaturePoints.forEach((point, index) => {
    const x = point[0] * scaleX;
    const y = point[1] * scaleY;
    ctx[index === 0 ? "moveTo" : "lineTo"](x, y);
  });

  // Draw the lower feature in reverse order to connect the shape back to the start
  lowerFeaturePoints
    .slice()
    .reverse()
    .forEach((point, index) => {
      const x = point[0] * scaleX;
      const y = point[1] * scaleY;
      ctx.lineTo(x, y);
    });

  ctx.closePath();
  ctx.stroke(); // Or fill, depending on the desired effect
}

function drawNose(nosePoints, ctx, scaleX, scaleY) {
  const { noseBottom, noseLeftCorner, noseRightCorner, noseTip, midwayBetweenEyes } = nosePoints;

  // Scale the points
  const bottom = [noseBottom[0][0] * scaleX, noseBottom[0][1] * scaleY];
  const leftCorner = [noseLeftCorner[0][0] * scaleX, noseLeftCorner[0][1] * scaleY];
  const rightCorner = [noseRightCorner[0][0] * scaleX, noseRightCorner[0][1] * scaleY];
  const tip = [noseTip[0][0] * scaleX, noseTip[0][1] * scaleY];
  const midway = [midwayBetweenEyes[0][0] * scaleX, midwayBetweenEyes[0][1] * scaleY];

  // Draw the nose
  ctx.beginPath();
  // Start from the left corner, go to the tip, then to the right corner
  ctx.moveTo(leftCorner[0], leftCorner[1]);
  ctx.lineTo(tip[0], tip[1]);
  ctx.lineTo(rightCorner[0], rightCorner[1]);

  // Draw a line from the right corner to the bottom and then connect to the left corner
  ctx.lineTo(bottom[0], bottom[1]);
  ctx.lineTo(leftCorner[0], leftCorner[1]);

  // Draw a line from the midway point between the eyes to the tip of the nose
  ctx.moveTo(midway[0], midway[1]);
  ctx.lineTo(tip[0], tip[1]);

  ctx.stroke();
}

//////////////////////////////////////
//draw the 'mesh'
//////////////////////////////////////
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

  ipcRenderer.send("webcam-size", { width: videoElement.videoWidth, height: videoElement.videoHeight });
}

//https://vladmandic.github.io/human/typedoc/interfaces/DrawOptions.html#fillPolygons
//https://github.com/vladmandic/human/blob/main/src/draw/options.ts#L39
// const drawOptions = {
//   drawPolygons: true,
//   lineWidth: 1,
//   pointSize: 2,
//   useDepth: false, // Set to true if you want to use the z-coordinate for depth effects
//   color: "blue", // Color for lines and points
//   drawPoints: true, // Set to true if you want to draw points at landmarks
//   fillPolygons: true,
// };
// human.draw.face(canvas, result.face, drawOptions);
