//GStreamer 'scaletempo'
var divArea = document.getElementById("audioeffects-controls");
// Stride duration in milliseconds to be processed, very large is choppy
export var scaletempo_stride = 30;
var minStride = 5;
var maxStride = 1000;
// Overlap percentage, higher more smooth but can produce artifacts
export var scaletempo_overlap = 0.2;
var minOverlap = 0.0;
var maxOverlap = 0.9;
// Search window size for overlap in milliseconds (can be larger than stride) - larger more smooth
export var scaletempo_search = 50;
var minSearch = 0;
var maxSearch = 300;
export function populateEffectArea_ScaleTempo() {
    divArea.innerHTML = "<div id=\"sliderContainer\">\n                            \n                            <label id=\"scaletempoSliderLabel\" for=\"\">stride=".concat(scaletempo_stride, ", overlap=").concat(scaletempo_overlap, ", search=").concat(scaletempo_search, "</label>\n                            \n                            <div class=\"sliderGroup\">\n                            <label for=\"scaletempoSlider-stride\">stride</label>\n                            <div class=\"sliderWithValues\">\n                                <span class=\"minValue\">").concat(minStride, "</span>\n                                <input type=\"range\" id=\"scaletempoSlider-stride\" min=\"").concat(minStride, "\" max=\"").concat(maxStride, "\" step=\"5\" value=\"").concat(scaletempo_stride, "\">\n                                <span class=\"maxValue\">").concat(maxStride, "</span>\n                            </div>\n                            </div>\n\n                            <div class=\"sliderGroup\">\n                            <label for=\"scaletempoSlider-overlap\">overlap</label>\n                            <div class=\"sliderWithValues\">\n                                <span class=\"minValue\">").concat(minOverlap, "</span>\n                                <input type=\"range\" id=\"scaletempoSlider-overlap\" min=\"").concat(minOverlap, "\" max=\"").concat(maxOverlap, "\" step=\"0.05\" value=\"").concat(scaletempo_overlap, "\">\n                                <span class=\"maxValue\">").concat(maxOverlap, "</span>\n                            </div>\n                            </div>\n\n                            <div class=\"sliderGroup\">\n                            <label for=\"scaletempoSlider-search\">search</label>\n                            <div class=\"sliderWithValues\">\n                                <span class=\"minValue\">").concat(minSearch, "</span>\n                                <input type=\"range\" id=\"scaletempoSlider-search\" min=\"").concat(minSearch, "\" max=\"").concat(maxSearch, "\" step=\"5\" value=\"").concat(scaletempo_search, "\">\n                                <span class=\"maxValue\">").concat(maxSearch, "</span>\n                            </div>\n                            </div>\n\n                        </div>\n                            ");
    document.querySelectorAll("#sliderContainer .sliderWithValues input[type='range']").forEach(function (element) {
        var slider = element;
        slider.onchange = updateScaleTempoParam;
        // for the init
        slider.style.setProperty("--thumb-color", getSliderColors(slider.id, parseFloat(slider.value)));
    });
}
function updateScaleTempoParam(event) {
    var target = event.target;
    var sliderId = target.id;
    var value = parseFloat(target.value);
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
    document.getElementById("scaletempoSliderLabel").innerText = "stride=".concat(scaletempo_stride, ", overlap=").concat(scaletempo_overlap, ", search=").concat(scaletempo_search);
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