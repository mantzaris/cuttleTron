//GStreamer 'ladspa-guitarix-distortion-so-guitarix-distortion' for distortion effect
let divArea = document.getElementById("audioeffects-controls");
//drive is distortion
export let distortion_drive = 0.0;
const minDrive = 0.0;
const maxDrive = 1.0;
//drive again
export let distortion_gain = -20;
const minDriveGain = -20;
const maxDriveGain = 20;
//drive level
export let distortion_level = 0;
const minDriveLevel = 0;
const maxDriveLevel = 1;
//drive over toggles more overtones (Boolean)
export let distortion_over = false;
let distortion_over_shown = 0;
const minDriveOver = 0;
const maxDriveOver = 1;
//increasing the distortion effect intensifying
export let distortion_overdrive = 1;
const minDriveOverDrive = 1;
const maxDriveOverDrive = 20;
//
export let distortion_trigger = 1;
const minTrigger = 0;
const maxTrigger = 1;
//varying pitch like a wave
export let distortion_vibrato = 0.01;
const minVibrato = 0.01;
const maxVibrato = 1;
export function populateEffectArea_Distortion() {
    divArea.innerHTML = `<div id="sliderContainer">
                            
                          <label id="distortionSliderLabel" for="">drive=${distortion_drive}, drive-gain=${distortion_gain}, drive-level=${distortion_level}, drive-over=${distortion_over_shown}, overdrive=${distortion_overdrive}, vibrato=${distortion_vibrato}, trigger=${distortion_trigger}</label>
                          
                          <div class="sliderGroup">
                          <label for="distortionSlider-drive">drive</label>
                            <div class="sliderWithValues">
                                <span class="minValue">${minDrive}</span>
                                <input type="range" id="distortionSlider-drive" min="${minDrive}" max="${maxDrive}" step="0.1" value="${distortion_drive}">
                                <span class="maxValue">${maxDrive}</span>
                            </div>
                          </div>
  
                          <div class="sliderGroup">
                            <label for="distortionSlider-again">drive-gain</label>
                            <div class="sliderWithValues">
                                <span class="minValue">${minDriveGain}</span>
                                <input type="range" id="distortionSlider-gain" min="${minDriveGain}" max="${maxDriveGain}" step="1" value="${distortion_gain}">
                                <span class="maxValue">${maxDriveGain}</span>
                            </div>
                          </div>

                          <div class="sliderGroup">
                            <label for="distortionSlider-level">level</label>
                            <div class="sliderWithValues">
                                <span class="minValue">${minDriveLevel}</span>
                                <input type="range" id="distortionSlider-level" min="${minDriveLevel}" max="${maxDriveLevel}" step="0.1" value="${distortion_level}">
                                <span class="maxValue">${maxDriveLevel}</span>
                            </div>
                          </div>

                          <div class="sliderGroup">
                            <label for="distortionSlider-overdrive">overdrive</label>
                            <div class="sliderWithValues">
                                <span class="minValue">${minDriveOverDrive}</span>
                                <input type="range" id="distortionSlider-overdrive" min="${minDriveOverDrive}" max="${maxDriveOverDrive}" step="1" value="${distortion_overdrive}">
                                <span class="maxValue">${maxDriveOverDrive}</span>
                            </div>
                          </div>

                          <div class="sliderGroup">
                            <label for="distortionSlider-trigger">trigger</label>
                            <div class="sliderWithValues">
                                <span class="minValue">${minTrigger}</span>
                                <input type="range" id="distortionSlider-trigger" min="${minTrigger}" max="${maxTrigger}" step="0.1" value="${distortion_trigger}">
                                <span class="maxValue">${maxTrigger}</span>
                            </div>
                          </div>

                          <div class="sliderGroup">
                            <label for="distortionSlider-vibrato">vibrato</label>
                            <div class="sliderWithValues">
                                <span class="minValue">${minVibrato}</span>
                                <input type="range" id="distortionSlider-vibrato" min="${minVibrato}" max="${maxVibrato}" step="0.05" value="${distortion_vibrato}">
                                <span class="maxValue">${maxVibrato}</span>
                            </div>
                          </div>

                          <div class="sliderGroup">
                            <label for="distortionSlider-over">drive-over</label>
                            <div class="sliderWithValues">
                                <span class="minValue">${minDriveOver}</span>
                                <input type="range" id="distortionSlider-over" min="${minDriveOver}" max="${maxDriveOver}" step="1" value="${distortion_over_shown}">
                                <span class="maxValue">${maxDriveOver}</span>
                            </div>
                          </div>
  
                        </div>
                          `;
    document.querySelectorAll("#sliderContainer .sliderWithValues input[type='range']").forEach((element) => {
        const slider = element;
        slider.onchange = updateDistortionParam;
        // for the init
        slider.style.setProperty("--thumb-color", getSliderColors(slider.id, parseFloat(slider.value)));
    });
}
function updateDistortionParam(event) {
    const target = event.target;
    const sliderId = target.id;
    const value = parseFloat(target.value);
    switch (sliderId) {
        case "distortionSlider-drive":
            distortion_drive = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        case "distortionSlider-gain":
            distortion_gain = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        case "distortionSlider-level":
            distortion_level = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        case "distortionSlider-overdrive":
            distortion_overdrive = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        case "distortionSlider-trigger":
            distortion_trigger = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        case "distortionSlider-vibrato":
            distortion_vibrato = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        case "distortionSlider-over":
            distortion_over_shown = value;
            distortion_over = Boolean(distortion_over_shown);
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        default:
            break;
    }
    document.getElementById("distortionSliderLabel").innerText = `drive=${distortion_drive}, drive-gain=${distortion_gain}, drive-level=${distortion_level}, drive-over=${distortion_over_shown}, overdrive=${distortion_overdrive}, vibrato=${distortion_vibrato}, trigger=${distortion_trigger}`;
}
function getSliderColors(sliderId, value) {
    switch (sliderId) {
        case "distortionSlider-drive":
            if (value == 0) {
                return "black";
            }
            else if (value > 0.0 && value <= 0.7) {
                return "blue";
            }
            else {
                return "red";
            }
        case "distortionSlider-gain":
            if (value == -20) {
                return "black";
            }
            else if ((value > -20 && value < -4) || (value > 4 && value < 8)) {
                return "gray";
            }
            else if (value >= -4 && value <= 4) {
                return "blue";
            }
            else {
                return "red";
            }
        case "distortionSlider-level":
            if (value == 0.0) {
                return "black";
            }
            else if (value > 0.0 && value <= 0.2) {
                return "gray";
            }
            else if (value > 0.2 && value <= 0.7) {
                return "blue";
            }
            else {
                return "red";
            }
        case "distortionSlider-overdrive":
            if (value >= 1.0 && value < 5.0) {
                return "gray";
            }
            else if (value >= 5.0 && value <= 10.0) {
                return "blue";
            }
            else {
                return "red";
            }
        case "distortionSlider-trigger":
            return "blue";
        case "distortionSlider-vibrato":
            if (value >= 0.01 && value < 0.2) {
                return "gray";
            }
            else if (value >= 0.2 && value <= 0.5) {
                return "blue";
            }
            else {
                return "red";
            }
        case "distortionSlider-over":
            return "blue";
        default:
            return "gray";
    }
}
//# sourceMappingURL=distortioneffect.js.map