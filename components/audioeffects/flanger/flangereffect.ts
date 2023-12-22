const labelText = "Flanger Params";
let divArea = document.getElementById("audioeffects-controls");

//depth is how intense the time delay modulation is, zero is no modulation 1.0 is max, and 0.5 is moderate (0.3 to 0.7)
export let depthValue: number = 0.0;
const minDepth = 0.0;
const maxDepth = 1.0;
//feedback is the intensity of the effect, zero is no feedback, 1.0 max, and 0.5 is moderate with moderate rand 0.3 to 0.7
export let feedbackValue: number = 0.0;
const minFeedback = 0.0;
const maxFeedback = 1.0;
//speed is the delay time of the modulation of the effect, 1.0 is moderate range 0.5 to 1.5 and, zero is minimum, low is 0.1 to 0.5, max 10
export let speedValue: number = 0.0;
const minSpeed = 0.0;
const maxSpeed = 10;

export function populateEffectArea_Flanger() {
  divArea.innerHTML = `<div id="sliderContainer">
                          
                        <label id="flangerSliderLabel" for="">depth=${depthValue}, feedback=${feedbackValue}, speed=${speedValue}</label>
                          
                        <label for="">depth</label>
                          <div class="sliderWithValues">
                              <span class="minValue">${minDepth}</span>
                              <input type="range" id="flangerSlider-depth" min="${minDepth}" max="${maxDepth}" step="0.01" value="${depthValue}">
                              <span class="maxValue">${maxDepth}</span>
                          </div>

                          <label for="">feedback</label>
                          <div class="sliderWithValues">
                              <span class="minValue">${minFeedback}</span>
                              <input type="range" id="flangerSlider-feedback" min="${minFeedback}" max="${maxFeedback}" step="0.01" value="${feedbackValue}">
                              <span class="maxValue">${maxFeedback}</span>
                          </div>

                          <label for="">speed</label>
                          <div class="sliderWithValues">
                              <span class="minValue">${minSpeed}</span>
                              <input type="range" id="flangerSlider-speed" min="${minSpeed}" max="${maxSpeed}" step="0.01" value="${speedValue}">
                              <span class="maxValue">${maxSpeed}</span>
                          </div>

                      </div>
                        `;

  document.querySelectorAll(".sliderWithValues input[type='range']").forEach((element) => {
    const slider = element as HTMLInputElement;
    slider.onchange = updateFlangerParam;
  });

  function updateFlangerParam(event) {
    const target = event.target;
    const sliderId = target.id;
    const value = parseFloat(target.value);

    switch (sliderId) {
      case "flangerSlider-depth":
        depthValue = value;
        break;
      case "flangerSlider-feedback":
        feedbackValue = value;
        break;
      case "flangerSlider-speed":
        speedValue = value;
        break;
      default:
        break;
    }

    document.getElementById("flangerSliderLabel").innerText = `depth=${depthValue}, feedback=${feedbackValue}, speed=${speedValue}`;
  }
}

// document.getElementById("flangerSlider-depth").onchange = (event) => {
//     const target = event.target as HTMLInputElement;
//     depthValue = target.valueAsNumber; //parseFloat(target.value);
//     document.getElementById("flangerSliderLabel").innerText = `depth=${depthValue}`;
//   };
