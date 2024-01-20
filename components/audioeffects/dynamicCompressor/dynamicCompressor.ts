//GStreamer 'scaletempo'
let divArea = document.getElementById("audioeffects-controls");

// ratio, how much the signal is reduced below the threshold
export let dynamicCompressor_ratio: number = 1;
const minRatio = 0;
const maxRatio = 20;

// Overlap percentage, higher more smooth but can produce artifacts
export let dynamicCompressor_threshold: number = 0.8;
const minThreshold = 0.0;
const maxThreshold = 1.0;

export function populateEffectArea_DynamicCompressor() {
  divArea.innerHTML = `<div id="sliderContainer">
                            
                            <label id="scaleDynamicCompressorSliderLabel" for="">ratio=${dynamicCompressor_ratio}, threshold=${dynamicCompressor_threshold}</label>
                            
                            <div class="sliderGroup">
                            <label for="scaleDynamicCompressorSlider-ratio">ratio</label>
                            <div class="sliderWithValues">
                                <span class="minValue">${minRatio}</span>
                                <input type="range" id="scaleDynamicCompressorSlider-ratio" min="${minRatio}" max="${maxRatio}" step="0.5" value="${dynamicCompressor_ratio}">
                                <span class="maxValue">${maxRatio}</span>
                            </div>
                            </div>

                            <div class="sliderGroup">
                            <label for="scaleDynamicCompressorSlider-threshold">threshold</label>
                            <div class="sliderWithValues">
                                <span class="minValue">${minThreshold}</span>
                                <input type="range" id="scaleDynamicCompressorSlider-threshold" min="${minThreshold}" max="${maxThreshold}" step="0.05" value="${dynamicCompressor_threshold}">
                                <span class="maxValue">${maxThreshold}</span>
                            </div>
                            </div>


                        </div>
                            `;

  document.querySelectorAll("#sliderContainer .sliderWithValues input[type='range']").forEach((element) => {
    const slider = element as HTMLInputElement;
    slider.onchange = updateDynamicCompressorParam;
    // for the init
    slider.style.setProperty("--thumb-color", getSliderColors(slider.id, parseFloat(slider.value)));
  });
}

function updateDynamicCompressorParam(event: InputEvent) {
  const target = event.target as HTMLInputElement;
  const sliderId = target.id;
  const value = parseFloat(target.value);

  switch (sliderId) {
    case "scaleDynamicCompressorSlider-ratio":
      dynamicCompressor_ratio = value;
      target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));

      break;
    case "scaleDynamicCompressorSlider-threshold":
      dynamicCompressor_threshold = value;
      target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));

      break;

    default:
      break;
  }

  document.getElementById("scaleDynamicCompressorSliderLabel").innerText = `ratio=${dynamicCompressor_ratio}, threshold=${dynamicCompressor_threshold}`;
}

function getSliderColors(sliderId: string, value: number): string {
  switch (sliderId) {
    case "scaleDynamicCompressorSlider-ratio":
      if (value == 1.0) {
        return "black";
      } else if ((value > 1.0 && value <= 10.0) || (value >= 0.5 && value < 0)) {
        return "blue";
      } else {
        return "red";
      }

    case "scaleDynamicCompressorSlider-threshold":
      if (value == 1.0) {
        return "black";
      } else if (value > 0.1) {
        return "blue";
      } else {
        return "red";
      }

    default:
      break;
  }
}
