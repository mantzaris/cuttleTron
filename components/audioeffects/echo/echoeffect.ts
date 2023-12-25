//GStreamer 'audioecho'
const labelText = "audioecho Params";
let divArea = document.getElementById("audioeffects-controls");

//delay is echo time after original audio, zero is no echo, 5.0 is max, and 0.5 is moderate (0.1 to 1.0)
export let delay: number = 0.0;
let delay_shown: number = 0.0;
const minDelay = 0.0;
const maxDelay = 5.0;
//intensity the loudness of the echo compared to the original sound; min 0, max 1.0, moderate 0.3 to 0.6
export let intensity: number = 0.0;
const minIntensity = 0.0;
const maxIntensity = 1.0;
//feedback the number of echos, so 0.0 is a single echo, and 1.0 continuous, moderate is 0.2 to 0.5
export let feedback: number = 0.0;
const minFeedback = 0.0;
const maxFeedback = 1;

export function populateEffectArea_Echo() {
  divArea.innerHTML = `<div id="sliderContainer">
                          
                        <label id="echoSliderLabel" for="">delay=${delay_shown}, intensity=${intensity}, feedback=${feedback}</label>
                          
                        <div class="sliderGroup">
                        <label for="echoSlider-delay">delay</label>
                          <div class="sliderWithValues">
                              <span class="minValue">${minDelay}</span>
                              <input type="range" id="echoSlider-delay" min="${minDelay}" max="${maxDelay}" step="0.1" value="${delay_shown}">
                              <span class="maxValue">${maxDelay}</span>
                          </div>
                        </div>

                        <div class="sliderGroup">
                          <label for="echoSlider-intensity">intensity</label>
                          <div class="sliderWithValues">
                              <span class="minValue">${minIntensity}</span>
                              <input type="range" id="echoSlider-intensity" min="${minIntensity}" max="${maxIntensity}" step="0.1" value="${intensity}">
                              <span class="maxValue">${maxIntensity}</span>
                          </div>
                        </div>

                        <div class="sliderGroup">
                          <label for="echoSlider-feedback">feedback</label>
                          <div class="sliderWithValues">
                              <span class="minValue">${minFeedback}</span>
                              <input type="range" id="echoSlider-feedback" min="${minFeedback}" max="${maxFeedback}" step="0.1" value="${feedback}">
                              <span class="maxValue">${maxFeedback}</span>
                          </div>
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

    const scale_delay = 1000000000; // Scale factor (1 second = 1,000,000,000 nanoseconds)

    switch (sliderId) {
      case "echoSlider-delay":
        delay_shown = value;
        delay = delay_shown * scale_delay;
        break;
      case "echoSlider-intensity":
        intensity = value;
        break;
      case "echoSlider-feedback":
        feedback = value;
        break;
      default:
        break;
    }

    document.getElementById("echoSliderLabel").innerText = `delay=${delay_shown}, intensity=${intensity}, feedback=${feedback}`;
  }
}

// document.getElementById("echoSlider-depth").onchange = (event) => {
//     const target = event.target as HTMLInputElement;
//     depthValue = target.valueAsNumber; //parseFloat(target.value);
//     document.getElementById("echoSliderLabel").innerText = `depth=${depthValue}`;
//   };
