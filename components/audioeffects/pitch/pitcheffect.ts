const labelText = "pitch";
let divArea = document.getElementById("audioeffects-controls");
//pitch is non altered with 1.0, min is 0.1 max 3 and moderate is 0.7 to 1.4
export let pitchValue: number = 1.0;
const minPitch = 0.1;
const maxPitch = 3;

export function populateEffectArea_Pitch() {
  divArea.innerHTML = `<div id="sliderContainer">
                          <label id="pitchSliderLabel" for="pitchSlider">${labelText}:${pitchValue}</label>
                          <div class="sliderWithValues">
                              <span class="minValue">${minPitch}</span>
                              <input type="range" id="pitchSlider" min="${minPitch}" max="${maxPitch}" step="0.1" value="${pitchValue}">
                              <span class="maxValue">${maxPitch}</span>
                          </div>
                      </div>
                        `;

  const pitchSlider = document.getElementById("pitchSlider") as HTMLInputElement;

  pitchSlider.onchange = (event) => {
    const target = event.target as HTMLInputElement;
    pitchValue = target.valueAsNumber; //parseFloat(target.value);
    updateSlider(pitchSlider, pitchValue);

    document.getElementById("pitchSliderLabel").innerText = labelText + ": " + target.value;
  };

  updateSlider(pitchSlider, pitchValue);
}

function updateSlider(slider: HTMLInputElement, value: number) {
  const color = sliderColor(value);
  slider.style.setProperty("--thumb-color", color);
}

function sliderColor(value: number): string {
  if (value === 1.0) {
    return "black";
  } else if (value >= 0.7 && value <= 1.5) {
    return "blue";
  } else {
    return "red";
  }
}
