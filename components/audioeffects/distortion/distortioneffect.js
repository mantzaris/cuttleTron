//GStreamer 'ladspa-guitarix-distortion-so-guitarix-distortion' for distortion effect
var divArea = document.getElementById("audioeffects-controls");
//drive is distortion
export var distortion_drive = 0.0;
var minDrive = 0.0;
var maxDrive = 1.0;
//drive again
export var distortion_gain = -20;
var minDriveGain = -20;
var maxDriveGain = 20;
//drive level
export var distortion_level = 0;
var minDriveLevel = 0;
var maxDriveLevel = 1;
//drive over toggles more overtones (Boolean)
export var distortion_over = false;
var distortion_over_shown = 0;
var minDriveOver = 0;
var maxDriveOver = 1;
//increasing the distortion effect intensifying
export var distortion_overdrive = 1;
var minDriveOverDrive = 1;
var maxDriveOverDrive = 20;
//
export var distortion_trigger = 1;
var minTrigger = 0;
var maxTrigger = 1;
//varying pitch like a wave
export var distortion_vibrato = 0.01;
var minVibrato = 0.01;
var maxVibrato = 1;
export function populateEffectArea_Distortion() {
    divArea.innerHTML = "<div id=\"sliderContainer\">\n                            \n                          <label id=\"distortionSliderLabel\" for=\"\">drive=".concat(distortion_drive, ", drive-gain=").concat(distortion_gain, ", drive-level=").concat(distortion_level, ", drive-over=").concat(distortion_over_shown, ", overdrive=").concat(distortion_overdrive, ", vibrato=").concat(distortion_vibrato, ", trigger=").concat(distortion_trigger, "</label>\n                          \n                          <div class=\"sliderGroup\">\n                          <label for=\"distortionSlider-drive\">drive</label>\n                            <div class=\"sliderWithValues\">\n                                <span class=\"minValue\">").concat(minDrive, "</span>\n                                <input type=\"range\" id=\"distortionSlider-drive\" min=\"").concat(minDrive, "\" max=\"").concat(maxDrive, "\" step=\"0.1\" value=\"").concat(distortion_drive, "\">\n                                <span class=\"maxValue\">").concat(maxDrive, "</span>\n                            </div>\n                          </div>\n  \n                          <div class=\"sliderGroup\">\n                            <label for=\"distortionSlider-again\">drive-gain</label>\n                            <div class=\"sliderWithValues\">\n                                <span class=\"minValue\">").concat(minDriveGain, "</span>\n                                <input type=\"range\" id=\"distortionSlider-gain\" min=\"").concat(minDriveGain, "\" max=\"").concat(maxDriveGain, "\" step=\"1\" value=\"").concat(distortion_gain, "\">\n                                <span class=\"maxValue\">").concat(maxDriveGain, "</span>\n                            </div>\n                          </div>\n\n                          <div class=\"sliderGroup\">\n                            <label for=\"distortionSlider-level\">level</label>\n                            <div class=\"sliderWithValues\">\n                                <span class=\"minValue\">").concat(minDriveLevel, "</span>\n                                <input type=\"range\" id=\"distortionSlider-level\" min=\"").concat(minDriveLevel, "\" max=\"").concat(maxDriveLevel, "\" step=\"0.1\" value=\"").concat(distortion_level, "\">\n                                <span class=\"maxValue\">").concat(maxDriveLevel, "</span>\n                            </div>\n                          </div>\n\n                          <div class=\"sliderGroup\">\n                            <label for=\"distortionSlider-overdrive\">overdrive</label>\n                            <div class=\"sliderWithValues\">\n                                <span class=\"minValue\">").concat(minDriveOverDrive, "</span>\n                                <input type=\"range\" id=\"distortionSlider-overdrive\" min=\"").concat(minDriveOverDrive, "\" max=\"").concat(maxDriveOverDrive, "\" step=\"1\" value=\"").concat(distortion_overdrive, "\">\n                                <span class=\"maxValue\">").concat(maxDriveOverDrive, "</span>\n                            </div>\n                          </div>\n\n                          <div class=\"sliderGroup\">\n                            <label for=\"distortionSlider-trigger\">trigger</label>\n                            <div class=\"sliderWithValues\">\n                                <span class=\"minValue\">").concat(minTrigger, "</span>\n                                <input type=\"range\" id=\"distortionSlider-trigger\" min=\"").concat(minTrigger, "\" max=\"").concat(maxTrigger, "\" step=\"0.1\" value=\"").concat(distortion_trigger, "\">\n                                <span class=\"maxValue\">").concat(maxTrigger, "</span>\n                            </div>\n                          </div>\n\n                          <div class=\"sliderGroup\">\n                            <label for=\"distortionSlider-vibrato\">vibrato</label>\n                            <div class=\"sliderWithValues\">\n                                <span class=\"minValue\">").concat(minVibrato, "</span>\n                                <input type=\"range\" id=\"distortionSlider-vibrato\" min=\"").concat(minVibrato, "\" max=\"").concat(maxVibrato, "\" step=\"0.05\" value=\"").concat(distortion_vibrato, "\">\n                                <span class=\"maxValue\">").concat(maxVibrato, "</span>\n                            </div>\n                          </div>\n\n                          <div class=\"sliderGroup\">\n                            <label for=\"distortionSlider-over\">drive-over</label>\n                            <div class=\"sliderWithValues\">\n                                <span class=\"minValue\">").concat(minDriveOver, "</span>\n                                <input type=\"range\" id=\"distortionSlider-over\" min=\"").concat(minDriveOver, "\" max=\"").concat(maxDriveOver, "\" step=\"1\" value=\"").concat(distortion_over_shown, "\">\n                                <span class=\"maxValue\">").concat(maxDriveOver, "</span>\n                            </div>\n                          </div>\n  \n                        </div>\n                          ");
    document.querySelectorAll("#sliderContainer .sliderWithValues input[type='range']").forEach(function (element) {
        var slider = element;
        slider.onchange = updateDistortionParam;
        // for the init
        slider.style.setProperty("--thumb-color", getSliderColors(slider.id, parseFloat(slider.value)));
    });
}
function updateDistortionParam(event) {
    var target = event.target;
    var sliderId = target.id;
    var value = parseFloat(target.value);
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
    document.getElementById("distortionSliderLabel").innerText = "drive=".concat(distortion_drive, ", drive-gain=").concat(distortion_gain, ", drive-level=").concat(distortion_level, ", drive-over=").concat(distortion_over_shown, ", overdrive=").concat(distortion_overdrive, ", vibrato=").concat(distortion_vibrato, ", trigger=").concat(distortion_trigger);
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