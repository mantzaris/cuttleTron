//GStreamer 'audioamplify'
let divArea = document.getElementById("audioeffects-controls");

// Amplification scales sound (range offered is theoretical and not practical: (-3.402823e+38 to 3.402823e+38)
export let amplify2_amplification: number = 1;
const minAmplify = -1.0;
const maxAmplify = 25;

export function populateEffectArea_Amplify2() {
  divArea.innerHTML = `<div id="sliderContainer">
                            
                            <label id="scaleAmplificationLabel" for="">amplification=${amplify2_amplification}</label>
                            
                            <div class="sliderGroup">
                            <label for="scaleAmplificationSlider-amplication">amplication</label>
                            <div class="sliderWithValues">
                                <span class="minValue">${minAmplify}</span>
                                <input type="range" id="scaleAmplificationSlider-amplication" min="${minAmplify}" max="${maxAmplify}" step="0.5" value="${amplify2_amplification}">
                                <span class="maxValue">${maxAmplify}</span>
                            </div>
                            </div>

                        </div>
                            `;

  document.querySelectorAll("#sliderContainer .sliderWithValues input[type='range']").forEach((element) => {
    const slider = element as HTMLInputElement;
    slider.onchange = updateAmplificationParam;
    // for the init
    slider.style.setProperty("--thumb-color", getSliderColors(slider.id, parseFloat(slider.value)));
  });
}

function updateAmplificationParam(event: InputEvent) {
  const target = event.target as HTMLInputElement;
  const sliderId = target.id;
  const value = parseFloat(target.value);

  switch (sliderId) {
    case "scaleAmplificationSlider-amplication":
      amplify2_amplification = value;
      target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));

      break;

    default:
      break;
  }

  document.getElementById("scaleAmplificationLabel").innerText = `amplification=${amplify2_amplification}`;
}

function getSliderColors(sliderId: string, value: number): string {
  switch (sliderId) {
    case "scaleAmplificationSlider-amplication":
      if (value == 1.0) {
        return "black";
      } else if (value > 0.5 && value <= 15.0) {
        return "blue";
      } else {
        return "red";
      }

    default:
      break;
  }
}
