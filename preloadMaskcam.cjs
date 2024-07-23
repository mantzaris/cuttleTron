console.log("***maskcam Preload script loaded.");
const path = require("path");
const fs = require("fs");

try {
  const tf = require("@tensorflow/tfjs-node");
  const Human = require("@vladmandic/human").default;
  const THREE = require("three");

  if (typeof window !== "undefined") {
    window.tf = tf;
    window.Human = Human;
    window.THREE = require("three");
  } else {
    console.error("window is not defined in the preload script context.");
  }
} catch (err) {
  console.error("Error loading TensorFlow or Human module:", err);
}

window.tf = tf;
window.Human = Human;
window.THREE = THREE;

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
window.human = human;
