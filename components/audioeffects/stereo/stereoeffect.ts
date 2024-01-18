//GStreamer 'audioamplify'
let divArea = document.getElementById("audioeffects-controls");

// Amplification scales sound (range offered is theoretical and not practical: (-3.402823e+38 to 3.402823e+38)
export let stereo_stereo: number = 0.1;
const minStereo = 0.0;
const maxStereo = 1;

export function populateEffectArea_Stereo() {
  divArea.innerHTML = `<div id="sliderContainer">
                            
                            <label id="scaleStereoLabel" for="">stereo=${stereo_stereo}</label>
                            
                            <div class="sliderGroup">
                            <label for="scaleStereoSlider-stereo">stereo</label>
                            <div class="sliderWithValues">
                                <span class="minValue">${minStereo}</span>
                                <input type="range" id="scaleStereoSlider-stereo" min="${minStereo}" max="${maxStereo}" step="0.1" value="${stereo_stereo}">
                                <span class="maxValue">${maxStereo}</span>
                            </div>
                            </div>

                        </div>
                            `;

  document.querySelectorAll("#sliderContainer .sliderWithValues input[type='range']").forEach((element) => {
    const slider = element as HTMLInputElement;
    slider.onchange = updateStereoParam;
    // for the init
    slider.style.setProperty("--thumb-color", getSliderColors(slider.id, parseFloat(slider.value)));
  });
}

function updateStereoParam(event: InputEvent) {
  const target = event.target as HTMLInputElement;
  const sliderId = target.id;
  const value = parseFloat(target.value);

  switch (sliderId) {
    case "scaleStereoSlider-stereo":
      stereo_stereo = value;
      target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));

      break;

    default:
      break;
  }

  document.getElementById("scaleStereoLabel").innerText = `amplification=${stereo_stereo}`;
}

function getSliderColors(sliderId: string, value: number): string {
  switch (sliderId) {
    case "scaleStereoSlider-stereo":
      if (value == 0) {
        return "black";
      } else if (value > 0.0 && value <= 0.6) {
        return "blue";
      } else {
        return "red";
      }

    default:
      break;
  }
}
