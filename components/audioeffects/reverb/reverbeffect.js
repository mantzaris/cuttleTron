//GStreamer 'freeverb' for reverb effect
let divArea = document.getElementById("audioeffects-controls");
//roomsize is size of the room, bigger room more long lasting reverb, zero is small room, 1.0 is huge hall, and 0.5 is moderate room size
export let reverb_roomsize = 0.4;
const minRoomsize = 0.0;
const maxRoomsize = 1.0;
//damping controls the high frequency supression to make it warmer,min 0, max 1.0, moderate 0.3 to 0.6
export let reverb_damping = 0.0;
const minDamping = 0.0;
const maxDamping = 1.0;
//level the how wet the sound is zero is no effect and 1 is extreme, and moderate is 0.3 to 0.6
export let reverb_level = 0.0;
const minLevel = 0.0;
const maxLevel = 1;
//width the stereo panorama width, default is 0.5 and range is 0.5 to 0.7
export let reverb_width = 0.5;
const minWidth = 0.0;
const maxWidth = 1;
export function populateEffectArea_Reverb() {
    divArea.innerHTML = `<div id="sliderContainer">
                          
                        <label id="reverbSliderLabel" for="">roomsize=${reverb_roomsize}, damping=${reverb_damping}, level=${reverb_level}, width=${reverb_width}</label>
                          
                        <div class="sliderGroup">
                        <label for="reverbSlider-roomsize">roomsize</label>
                          <div class="sliderWithValues">
                              <span class="minValue">${minRoomsize}</span>
                              <input type="range" id="reverbSlider-roomsize" min="${minRoomsize}" max="${maxRoomsize}" step="0.1" value="${reverb_roomsize}">
                              <span class="maxValue">${maxRoomsize}</span>
                          </div>
                        </div>

                        <div class="sliderGroup">
                          <label for="reverbSlider-damping">damping</label>
                          <div class="sliderWithValues">
                              <span class="minValue">${minDamping}</span>
                              <input type="range" id="reverbSlider-damping" min="${minDamping}" max="${maxDamping}" step="0.1" value="${reverb_damping}">
                              <span class="maxValue">${maxDamping}</span>
                          </div>
                        </div>

                        <div class="sliderGroup">
                          <label for="reverbSlider-level">level</label>
                          <div class="sliderWithValues">
                              <span class="minValue">${minLevel}</span>
                              <input type="range" id="reverbSlider-level" min="${minLevel}" max="${maxLevel}" step="0.1" value="${reverb_level}">
                              <span class="maxValue">${maxLevel}</span>
                          </div>
                        </div>

                        <div class="sliderGroup">
                          <label for="reverbSlider-width">width</label>
                          <div class="sliderWithValues">
                              <span class="minValue">${minWidth}</span>
                              <input type="range" id="reverbSlider-width" min="${minWidth}" max="${maxWidth}" step="0.1" value="${reverb_width}">
                              <span class="maxValue">${maxWidth}</span>
                          </div>
                        </div>

                      </div>
                        `;
    document.querySelectorAll("#sliderContainer .sliderWithValues input[type='range']").forEach((element) => {
        const slider = element;
        slider.onchange = updateReverbParam;
        // for the init
        slider.style.setProperty("--thumb-color", getSliderColors(slider.id, parseFloat(slider.value)));
    });
}
function updateReverbParam(event) {
    const target = event.target;
    const sliderId = target.id;
    const value = parseFloat(target.value);
    switch (sliderId) {
        case "reverbSlider-roomsize":
            reverb_roomsize = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        case "reverbSlider-damping":
            reverb_damping = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        case "reverbSlider-level":
            reverb_level = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        case "reverbSlider-width":
            reverb_width = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        default:
            break;
    }
    document.getElementById("reverbSliderLabel").innerText = `roomsize=${reverb_roomsize}, damping=${reverb_damping}, level=${reverb_level}, width=${reverb_width}`;
}
function getSliderColors(sliderId, value) {
    switch (sliderId) {
        case "reverbSlider-roomsize":
            if (value <= 0.7) {
                return "blue";
            }
            else {
                return "orange";
            }
        case "reverbSlider-damping":
            if (value == 0.0) {
                return "black";
            }
            else if (value <= 0.7) {
                return "blue";
            }
            else {
                return "orange";
            }
        case "reverbSlider-level":
            if (value == 0.0) {
                return "black";
            }
            else if (value <= 0.6) {
                return "blue";
            }
            else {
                return "red";
            }
        case "reverbSlider-width":
            if (value <= 0.2) {
                return "black";
            }
            else if (value <= 0.7) {
                return "blue";
            }
            else {
                return "orange";
            }
        default:
            return "grey";
    }
}
//# sourceMappingURL=reverbeffect.js.map