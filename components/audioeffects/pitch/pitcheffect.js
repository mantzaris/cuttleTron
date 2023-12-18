var labelText = "Select Pitch Value";
var divArea = document.getElementById("audioeffects-controls");
export var pitchValue = 1.0;
export function populateEffectArea() {
    divArea.innerHTML = "<div id=\"sliderContainer\">\n                          <label id=\"pitchSliderLabel\" for=\"pitchSlider\">".concat(labelText, ":").concat(pitchValue, "</label>\n                          <div class=\"sliderWithValues\">\n                              <span class=\"minValue\">0.1</span>\n                              <input type=\"range\" id=\"pitchSlider\" min=\"0.1\" max=\"4\" step=\"0.01\" value=\"").concat(pitchValue, "\">\n                              <span class=\"maxValue\">4</span>\n                          </div>\n                      </div>\n                        ");
    document.getElementById("pitchSlider").onchange = function (event) {
        var target = event.target;
        pitchValue = target.valueAsNumber; //parseFloat(target.value);
        document.getElementById("pitchSliderLabel").innerText = labelText + ": " + target.value;
    };
}
//# sourceMappingURL=pitcheffect.js.map