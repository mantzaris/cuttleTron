//GStreamer 'scaletempo'
var divArea = document.getElementById("audioeffects-controls");
// ratio, how much the signal is reduced below the threshold
export var dynamicCompressor_ratio = 1;
var minRatio = 0;
var maxRatio = 20;
// Overlap percentage, higher more smooth but can produce artifacts
export var dynamicCompressor_threshold = 0.8;
var minThreshold = 0.0;
var maxThreshold = 1.0;
export function populateEffectArea_DynamicCompressor() {
    divArea.innerHTML = "<div id=\"sliderContainer\">\n                            \n                            <label id=\"scaleDynamicCompressorSliderLabel\" for=\"\">ratio=".concat(dynamicCompressor_ratio, ", threshold=").concat(dynamicCompressor_threshold, "</label>\n                            \n                            <div class=\"sliderGroup\">\n                            <label for=\"scaleDynamicCompressorSlider-ratio\">ratio</label>\n                            <div class=\"sliderWithValues\">\n                                <span class=\"minValue\">").concat(minRatio, "</span>\n                                <input type=\"range\" id=\"scaleDynamicCompressorSlider-ratio\" min=\"").concat(minRatio, "\" max=\"").concat(maxRatio, "\" step=\"0.5\" value=\"").concat(dynamicCompressor_ratio, "\">\n                                <span class=\"maxValue\">").concat(maxRatio, "</span>\n                            </div>\n                            </div>\n\n                            <div class=\"sliderGroup\">\n                            <label for=\"scaleDynamicCompressorSlider-threshold\">threshold</label>\n                            <div class=\"sliderWithValues\">\n                                <span class=\"minValue\">").concat(minThreshold, "</span>\n                                <input type=\"range\" id=\"scaleDynamicCompressorSlider-threshold\" min=\"").concat(minThreshold, "\" max=\"").concat(maxThreshold, "\" step=\"0.05\" value=\"").concat(dynamicCompressor_threshold, "\">\n                                <span class=\"maxValue\">").concat(maxThreshold, "</span>\n                            </div>\n                            </div>\n\n\n                        </div>\n                            ");
    document.querySelectorAll("#sliderContainer .sliderWithValues input[type='range']").forEach(function (element) {
        var slider = element;
        slider.onchange = updateDynamicCompressorParam;
        // for the init
        slider.style.setProperty("--thumb-color", getSliderColors(slider.id, parseFloat(slider.value)));
    });
}
function updateDynamicCompressorParam(event) {
    var target = event.target;
    var sliderId = target.id;
    var value = parseFloat(target.value);
    switch (sliderId) {
        case "scaleDynamicCompressorSlider-ratio":
            dynamicCompressor_ratio = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        case "scaleDynamicCompressorSlider-threshold":
            dynamicCompressor_threshold = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        default:
            break;
    }
    document.getElementById("scaleDynamicCompressorSliderLabel").innerText = "ratio=".concat(dynamicCompressor_ratio, ", threshold=").concat(dynamicCompressor_threshold);
}
function getSliderColors(sliderId, value) {
    switch (sliderId) {
        case "scaleDynamicCompressorSlider-ratio":
            if (value == 1.0) {
                return "black";
            }
            else if ((value > 1.0 && value <= 10.0) || (value >= 0.5 && value < 0)) {
                return "blue";
            }
            else {
                return "red";
            }
        case "scaleDynamicCompressorSlider-threshold":
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
//# sourceMappingURL=dynamicCompressor.js.map