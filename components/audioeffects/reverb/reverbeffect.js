//GStreamer 'freeverb' for reverb effect
var divArea = document.getElementById("audioeffects-controls");
//roomsize is size of the room, bigger room more long lasting reverb, zero is small room, 1.0 is huge hall, and 0.5 is moderate room size
export var reverb_roomsize = 0.4;
var minRoomsize = 0.0;
var maxRoomsize = 1.0;
//damping controls the high frequency supression to make it warmer,min 0, max 1.0, moderate 0.3 to 0.6
export var reverb_damping = 0.0;
var minDamping = 0.0;
var maxDamping = 1.0;
//level the how wet the sound is zero is no effect and 1 is extreme, and moderate is 0.3 to 0.6
export var reverb_level = 0.0;
var minLevel = 0.0;
var maxLevel = 1;
//width the stereo panorama width, default is 0.5 and range is 0.5 to 0.7
export var reverb_width = 0.5;
var minWidth = 0.0;
var maxWidth = 1;
export function populateEffectArea_Reverb() {
    divArea.innerHTML = "<div id=\"sliderContainer\">\n                          \n                        <label id=\"reverbSliderLabel\" for=\"\">roomsize=".concat(reverb_roomsize, ", damping=").concat(reverb_damping, ", level=").concat(reverb_level, ", width=").concat(reverb_width, "</label>\n                          \n                        <div class=\"sliderGroup\">\n                        <label for=\"reverbSlider-roomsize\">roomsize</label>\n                          <div class=\"sliderWithValues\">\n                              <span class=\"minValue\">").concat(minRoomsize, "</span>\n                              <input type=\"range\" id=\"reverbSlider-roomsize\" min=\"").concat(minRoomsize, "\" max=\"").concat(maxRoomsize, "\" step=\"0.1\" value=\"").concat(reverb_roomsize, "\">\n                              <span class=\"maxValue\">").concat(maxRoomsize, "</span>\n                          </div>\n                        </div>\n\n                        <div class=\"sliderGroup\">\n                          <label for=\"reverbSlider-damping\">damping</label>\n                          <div class=\"sliderWithValues\">\n                              <span class=\"minValue\">").concat(minDamping, "</span>\n                              <input type=\"range\" id=\"reverbSlider-damping\" min=\"").concat(minDamping, "\" max=\"").concat(maxDamping, "\" step=\"0.1\" value=\"").concat(reverb_damping, "\">\n                              <span class=\"maxValue\">").concat(maxDamping, "</span>\n                          </div>\n                        </div>\n\n                        <div class=\"sliderGroup\">\n                          <label for=\"reverbSlider-level\">level</label>\n                          <div class=\"sliderWithValues\">\n                              <span class=\"minValue\">").concat(minLevel, "</span>\n                              <input type=\"range\" id=\"reverbSlider-level\" min=\"").concat(minLevel, "\" max=\"").concat(maxLevel, "\" step=\"0.1\" value=\"").concat(reverb_level, "\">\n                              <span class=\"maxValue\">").concat(maxLevel, "</span>\n                          </div>\n                        </div>\n\n                        <div class=\"sliderGroup\">\n                          <label for=\"reverbSlider-width\">width</label>\n                          <div class=\"sliderWithValues\">\n                              <span class=\"minValue\">").concat(minWidth, "</span>\n                              <input type=\"range\" id=\"reverbSlider-width\" min=\"").concat(minWidth, "\" max=\"").concat(maxWidth, "\" step=\"0.1\" value=\"").concat(reverb_width, "\">\n                              <span class=\"maxValue\">").concat(maxWidth, "</span>\n                          </div>\n                        </div>\n\n                      </div>\n                        ");
    document.querySelectorAll("#sliderContainer .sliderWithValues input[type='range']").forEach(function (element) {
        var slider = element;
        slider.onchange = updateReverbParam;
        // for the init
        slider.style.setProperty("--thumb-color", getSliderColors(slider.id, parseFloat(slider.value)));
    });
}
function updateReverbParam(event) {
    var target = event.target;
    var sliderId = target.id;
    var value = parseFloat(target.value);
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
    document.getElementById("reverbSliderLabel").innerText = "roomsize=".concat(reverb_roomsize, ", damping=").concat(reverb_damping, ", level=").concat(reverb_level, ", width=").concat(reverb_width);
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