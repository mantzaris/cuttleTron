//GStreamer 'scaletempo'
let divArea = document.getElementById("audioeffects-controls");
// Stride duration in milliseconds to be processed, very large is choppy
export let scaletempo_stride = 30;
const minStride = 5;
const maxStride = 1000;
// Overlap percentage, higher more smooth but can produce artifacts
export let scaletempo_overlap = 0.2;
const minOverlap = 0.0;
const maxOverlap = 0.9;
// Search window size for overlap in milliseconds (can be larger than stride) - larger more smooth
export let scaletempo_search = 50;
const minSearch = 0;
const maxSearch = 300;
export function populateEffectArea_ScaleTempo() {
    divArea.innerHTML = `<div id="sliderContainer">
                            
                            <label id="scaletempoSliderLabel" for="">stride=${scaletempo_stride}, overlap=${scaletempo_overlap}, search=${scaletempo_search}</label>
                            
                            <div class="sliderGroup">
                            <label for="scaletempoSlider-stride">stride</label>
                            <div class="sliderWithValues">
                                <span class="minValue">${minStride}</span>
                                <input type="range" id="scaletempoSlider-stride" min="${minStride}" max="${maxStride}" step="5" value="${scaletempo_stride}">
                                <span class="maxValue">${maxStride}</span>
                            </div>
                            </div>

                            <div class="sliderGroup">
                            <label for="scaletempoSlider-overlap">overlap</label>
                            <div class="sliderWithValues">
                                <span class="minValue">${minOverlap}</span>
                                <input type="range" id="scaletempoSlider-overlap" min="${minOverlap}" max="${maxOverlap}" step="0.05" value="${scaletempo_overlap}">
                                <span class="maxValue">${maxOverlap}</span>
                            </div>
                            </div>

                            <div class="sliderGroup">
                            <label for="scaletempoSlider-search">search</label>
                            <div class="sliderWithValues">
                                <span class="minValue">${minSearch}</span>
                                <input type="range" id="scaletempoSlider-search" min="${minSearch}" max="${maxSearch}" step="5" value="${scaletempo_search}">
                                <span class="maxValue">${maxSearch}</span>
                            </div>
                            </div>

                        </div>
                            `;
    document.querySelectorAll("#sliderContainer .sliderWithValues input[type='range']").forEach((element) => {
        const slider = element;
        slider.onchange = updateScaleTempoParam;
        // for the init
        slider.style.setProperty("--thumb-color", getSliderColors(slider.id, parseFloat(slider.value)));
    });
}
function updateScaleTempoParam(event) {
    const target = event.target;
    const sliderId = target.id;
    const value = parseFloat(target.value);
    switch (sliderId) {
        case "scaletempoSlider-stride":
            scaletempo_stride = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        case "scaletempoSlider-overlap":
            scaletempo_overlap = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        case "scaletempoSlider-search":
            scaletempo_search = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        default:
            break;
    }
    document.getElementById("scaletempoSliderLabel").innerText = `stride=${scaletempo_stride}, overlap=${scaletempo_overlap}, search=${scaletempo_search}`;
}
function getSliderColors(sliderId, value) {
    switch (sliderId) {
        case "scaletempoSlider-stride":
            if (value <= 10.0) {
                return "black";
            }
            else if (value > 10.0 && value <= 100.0) {
                return "blue";
            }
            else {
                return "red";
            }
        case "scaletempoSlider-overlap":
            if (value <= 0.1) {
                return "black";
            }
            else if (value > 0.1 && value <= 0.75) {
                return "blue";
            }
            else {
                return "red";
            }
        case "scaletempoSlider-search":
            if (value <= 25.0) {
                return "black";
            }
            else if (value > 25.0 && value <= 80.0) {
                return "blue";
            }
            else {
                return "red";
            }
        default:
            break;
    }
}
//# sourceMappingURL=scaletempo.js.map