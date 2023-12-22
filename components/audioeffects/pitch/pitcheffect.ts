const labelText = "Select Pitch Value";
let divArea = document.getElementById("audioeffects-controls");
export let pitchValue: number = 1.0;
const minPitch = 0.1;
const maxPitch = 3;

export function populateEffectArea_Pitch() {
  divArea.innerHTML = `<div id="sliderContainer">
                          <label id="pitchSliderLabel" for="pitchSlider">${labelText}:${pitchValue}</label>
                          <div class="sliderWithValues">
                              <span class="minValue">${minPitch}</span>
                              <input type="range" id="pitchSlider" min="${minPitch}" max="${maxPitch}" step="0.01" value="${pitchValue}">
                              <span class="maxValue">${maxPitch}</span>
                          </div>
                      </div>
                        `;

  document.getElementById("pitchSlider").onchange = (event) => {
    const target = event.target as HTMLInputElement;
    pitchValue = target.valueAsNumber; //parseFloat(target.value);
    document.getElementById("pitchSliderLabel").innerText = labelText + ": " + target.value;
  };
}
