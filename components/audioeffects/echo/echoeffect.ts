//GStreamer 'audioecho'
let divArea = document.getElementById("audioeffects-controls");

//delay is echo time after original audio, zero is no echo, 5.0 is max, and 0.5 is moderate (0.1 to 1.0)
export let echo_delay: number = 0.0;
let delay_shown: number = 0.0;
const minDelay = 0.0;
const maxDelay = 5.0;
//intensity the loudness of the echo compared to the original sound; min 0, max 1.0, moderate 0.3 to 0.6
export let echo_intensity: number = 0.0;
const minIntensity = 0.0;
const maxIntensity = 1.0;
//feedback the number of echos, so 0.0 is a single echo, and 1.0 continuous, moderate is 0.2 to 0.5
export let echo_feedback: number = 0.0;
const minFeedback = 0.0;
const maxFeedback = 1;

export function populateEffectArea_Echo() {
  divArea.innerHTML = `<div id="sliderContainer">
                          
                        <label id="echoSliderLabel" for="">delay=${delay_shown}, intensity=${echo_intensity}, feedback=${echo_feedback}</label>
                          
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
                              <input type="range" id="echoSlider-intensity" min="${minIntensity}" max="${maxIntensity}" step="0.1" value="${echo_intensity}">
                              <span class="maxValue">${maxIntensity}</span>
                          </div>
                        </div>

                        <div class="sliderGroup">
                          <label for="echoSlider-feedback">feedback</label>
                          <div class="sliderWithValues">
                              <span class="minValue">${minFeedback}</span>
                              <input type="range" id="echoSlider-feedback" min="${minFeedback}" max="${maxFeedback}" step="0.1" value="${echo_feedback}">
                              <span class="maxValue">${maxFeedback}</span>
                          </div>
                        </div>

                      </div>
                        `;

  document.querySelectorAll("#sliderContainer .sliderWithValues input[type='range']").forEach((element) => {
    const slider = element as HTMLInputElement;
    slider.onchange = updateEchoParam;
    // for the init
    slider.style.setProperty("--thumb-color", getSliderColors(slider.id, parseFloat(slider.value)));
  });
}

function updateEchoParam(event: InputEvent) {
  const target = event.target as HTMLInputElement;
  const sliderId = target.id;
  const value = parseFloat(target.value);

  const scale_delay = 1000000000; // Scale factor (1 second = 1,000,000,000 nanoseconds)

  switch (sliderId) {
    case "echoSlider-delay":
      delay_shown = value;
      echo_delay = delay_shown * scale_delay;
      target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));

      break;
    case "echoSlider-intensity":
      echo_intensity = value;
      target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));

      break;
    case "echoSlider-feedback":
      echo_feedback = value;
      target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));

      break;
    default:
      break;
  }

  document.getElementById("echoSliderLabel").innerText = `delay=${delay_shown}, intensity=${echo_intensity}, feedback=${echo_feedback}`;
}

function getSliderColors(sliderId: string, value: number): string {
  switch (sliderId) {
    case "echoSlider-delay":
      if (value == 0) {
        return "black";
      } else if (value >= 0.1 && value <= 1.0) {
        return "blue";
      } else {
        return "red";
      }

    case "echoSlider-intensity":
      if (value == 0) {
        return "black";
      } else if (value >= 0.3 && value <= 0.6) {
        return "blue";
      } else {
        return "red";
      }

    case "echoSlider-feedback":
      if (value >= 0.0 && value <= 0.5) {
        return "blue";
      } else {
        return "red";
      }

    default:
      break;
  }
}
