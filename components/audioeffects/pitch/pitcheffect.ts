const labelText = "Select Pitch Value";
let divArea = document.getElementById("audioeffects-controls");
export let pitchValue: number = 1.0;

export function populateEffectArea() {
  divArea.innerHTML = `<div id="sliderContainer">
                          <label id="pitchSliderLabel" for="pitchSlider">${labelText}:${pitchValue}</label>
                          <div class="sliderWithValues">
                              <span class="minValue">0.1</span>
                              <input type="range" id="pitchSlider" min="0.1" max="4" step="0.01" value="${pitchValue}">
                              <span class="maxValue">4</span>
                          </div>
                      </div>
                        `;

  document.getElementById("pitchSlider").onchange = (event) => {
    const target = event.target as HTMLInputElement;
    pitchValue = target.valueAsNumber; //parseFloat(target.value);
    document.getElementById("pitchSliderLabel").innerText = labelText + ": " + target.value;
  };
}
