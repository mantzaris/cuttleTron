//GStreamer 'scaletempo'
let divArea = document.getElementById("audioeffects-controls");
// ratio, how much the signal is reduced below the threshold
export let dynamicExpander_ratio = 1;
const minRatio = 0;
const maxRatio = 20;
// Overlap percentage, higher more smooth but can produce artifacts
export let dynamicExpander_threshold = 0.8;
const minThreshold = 0.0;
const maxThreshold = 1.0;
export function populateEffectArea_DynamicExpander() {
    divArea.innerHTML = `<div id="sliderContainer">
                            
                            <label id="scaleDynamicExpanderSliderLabel" for="">ratio=${dynamicExpander_ratio}, threshold=${dynamicExpander_threshold}</label>
                            
                            <div class="sliderGroup">
                            <label for="scaleDynamicExpanderSlider-ratio">ratio</label>
                            <div class="sliderWithValues">
                                <span class="minValue">${minRatio}</span>
                                <input type="range" id="scaleDynamicExpanderSlider-ratio" min="${minRatio}" max="${maxRatio}" step="0.5" value="${dynamicExpander_ratio}">
                                <span class="maxValue">${maxRatio}</span>
                            </div>
                            </div>

                            <div class="sliderGroup">
                            <label for="scaleDynamicExpanderSlider-threshold">threshold</label>
                            <div class="sliderWithValues">
                                <span class="minValue">${minThreshold}</span>
                                <input type="range" id="scaleDynamicExpanderSlider-threshold" min="${minThreshold}" max="${maxThreshold}" step="0.05" value="${dynamicExpander_threshold}">
                                <span class="maxValue">${maxThreshold}</span>
                            </div>
                            </div>


                        </div>
                            `;
    document.querySelectorAll("#sliderContainer .sliderWithValues input[type='range']").forEach((element) => {
        const slider = element;
        slider.onchange = updateDynamicExpanderParam;
        // for the init
        slider.style.setProperty("--thumb-color", getSliderColors(slider.id, parseFloat(slider.value)));
    });
}
function updateDynamicExpanderParam(event) {
    const target = event.target;
    const sliderId = target.id;
    const value = parseFloat(target.value);
    switch (sliderId) {
        case "scaleDynamicExpanderSlider-ratio":
            dynamicExpander_ratio = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        case "scaleDynamicExpanderSlider-threshold":
            dynamicExpander_threshold = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        default:
            break;
    }
    document.getElementById("scaleDynamicExpanderSliderLabel").innerText = `ratio=${dynamicExpander_ratio}, threshold=${dynamicExpander_threshold}`;
}
function getSliderColors(sliderId, value) {
    switch (sliderId) {
        case "scaleDynamicExpanderSlider-ratio":
            if (value == 1.0) {
                return "black";
            }
            else if ((value > 1.0 && value <= 10.0) || (value >= 0.5 && value < 0)) {
                return "blue";
            }
            else {
                return "red";
            }
        case "scaleDynamicExpanderSlider-threshold":
            if (value == 1.0) {
                return "black";
            }
            else if (value > 0.1) {
                return "blue";
            }
            else {
                return "red";
            }
        default:
            break;
    }
}
//# sourceMappingURL=dynamicExpander.js.map