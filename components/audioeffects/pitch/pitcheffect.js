var labelText = "pitch";
var divArea = document.getElementById("audioeffects-controls");
//pitch is non altered with 1.0, min is 0.1 max 3 and moderate is 0.7 to 1.4
export var pitchValue = 1.0;
var minPitch = 0.1;
var maxPitch = 3;
export function populateEffectArea_Pitch() {
    divArea.innerHTML = "<div id=\"sliderContainer\">\n                          <label id=\"pitchSliderLabel\" for=\"pitchSlider\">".concat(labelText, ":").concat(pitchValue, "</label>\n                          <div class=\"sliderWithValues\">\n                              <span class=\"minValue\">").concat(minPitch, "</span>\n                              <input type=\"range\" id=\"pitchSlider\" min=\"").concat(minPitch, "\" max=\"").concat(maxPitch, "\" step=\"0.1\" value=\"").concat(pitchValue, "\">\n                              <span class=\"maxValue\">").concat(maxPitch, "</span>\n                          </div>\n                      </div>\n                        ");
    var pitchSlider = document.getElementById("pitchSlider");
    pitchSlider.onchange = function (event) {
        var target = event.target;
        pitchValue = target.valueAsNumber; //parseFloat(target.value);
        updateSlider(pitchSlider, pitchValue);
        document.getElementById("pitchSliderLabel").innerText = labelText + ": " + target.value;
    };
    updateSlider(pitchSlider, pitchValue);
}
function updateSlider(slider, value) {
    var color = sliderColor(value);
    console.log(color);
    slider.style.setProperty("--thumb-color", color);
}
function sliderColor(value) {
    if (value === 1.0) {
        console.log("blck");
        return "black";
    }
    else if (value >= 0.7 && value <= 1.5) {
        return "blue";
    }
    else {
        return "red";
    }
}
//# sourceMappingURL=pitcheffect.js.map