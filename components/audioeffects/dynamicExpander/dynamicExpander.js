//GStreamer 'scaletempo'
var divArea = document.getElementById("audioeffects-controls");
// ratio, how much the signal is reduced below the threshold
export var dynamicExpander_ratio = 1;
var minRatio = 0;
var maxRatio = 20;
// Overlap percentage, higher more smooth but can produce artifacts
export var dynamicExpander_threshold = 0.8;
var minThreshold = 0.0;
var maxThreshold = 1.0;
export function populateEffectArea_DynamicExpander() {
    divArea.innerHTML = "<div id=\"sliderContainer\">\n                            \n                            <label id=\"scaleDynamicExpanderSliderLabel\" for=\"\">ratio=".concat(dynamicExpander_ratio, ", threshold=").concat(dynamicExpander_threshold, "</label>\n                            \n                            <div class=\"sliderGroup\">\n                            <label for=\"scaleDynamicExpanderSlider-ratio\">ratio</label>\n                            <div class=\"sliderWithValues\">\n                                <span class=\"minValue\">").concat(minRatio, "</span>\n                                <input type=\"range\" id=\"scaleDynamicExpanderSlider-ratio\" min=\"").concat(minRatio, "\" max=\"").concat(maxRatio, "\" step=\"0.5\" value=\"").concat(dynamicExpander_ratio, "\">\n                                <span class=\"maxValue\">").concat(maxRatio, "</span>\n                            </div>\n                            </div>\n\n                            <div class=\"sliderGroup\">\n                            <label for=\"scaleDynamicExpanderSlider-threshold\">threshold</label>\n                            <div class=\"sliderWithValues\">\n                                <span class=\"minValue\">").concat(minThreshold, "</span>\n                                <input type=\"range\" id=\"scaleDynamicExpanderSlider-threshold\" min=\"").concat(minThreshold, "\" max=\"").concat(maxThreshold, "\" step=\"0.05\" value=\"").concat(dynamicExpander_threshold, "\">\n                                <span class=\"maxValue\">").concat(maxThreshold, "</span>\n                            </div>\n                            </div>\n\n\n                        </div>\n                            ");
    document.querySelectorAll("#sliderContainer .sliderWithValues input[type='range']").forEach(function (element) {
        var slider = element;
        slider.onchange = updateDynamicExpanderParam;
        // for the init
        slider.style.setProperty("--thumb-color", getSliderColors(slider.id, parseFloat(slider.value)));
    });
}
function updateDynamicExpanderParam(event) {
    var target = event.target;
    var sliderId = target.id;
    var value = parseFloat(target.value);
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
    document.getElementById("scaleDynamicExpanderSliderLabel").innerText = "ratio=".concat(dynamicExpander_ratio, ", threshold=").concat(dynamicExpander_threshold);
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