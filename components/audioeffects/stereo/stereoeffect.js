//GStreamer 'audioamplify'
var divArea = document.getElementById("audioeffects-controls");
// Amplification scales sound (range offered is theoretical and not practical: (-3.402823e+38 to 3.402823e+38)
export var stereo_stereo = 0.1;
var minStereo = 0.0;
var maxStereo = 1;
export function populateEffectArea_Stereo() {
    divArea.innerHTML = "<div id=\"sliderContainer\">\n                            \n                            <label id=\"scaleStereoLabel\" for=\"\">stereo=".concat(stereo_stereo, "</label>\n                            \n                            <div class=\"sliderGroup\">\n                            <label for=\"scaleStereoSlider-stereo\">stereo</label>\n                            <div class=\"sliderWithValues\">\n                                <span class=\"minValue\">").concat(minStereo, "</span>\n                                <input type=\"range\" id=\"scaleStereoSlider-stereo\" min=\"").concat(minStereo, "\" max=\"").concat(maxStereo, "\" step=\"0.1\" value=\"").concat(stereo_stereo, "\">\n                                <span class=\"maxValue\">").concat(maxStereo, "</span>\n                            </div>\n                            </div>\n\n                        </div>\n                            ");
    document.querySelectorAll("#sliderContainer .sliderWithValues input[type='range']").forEach(function (element) {
        var slider = element;
        slider.onchange = updateStereoParam;
        // for the init
        slider.style.setProperty("--thumb-color", getSliderColors(slider.id, parseFloat(slider.value)));
    });
}
function updateStereoParam(event) {
    var target = event.target;
    var sliderId = target.id;
    var value = parseFloat(target.value);
    switch (sliderId) {
        case "scaleStereoSlider-stereo":
            stereo_stereo = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        default:
            break;
    }
    document.getElementById("scaleStereoLabel").innerText = "amplification=".concat(stereo_stereo);
}
function getSliderColors(sliderId, value) {
    switch (sliderId) {
        case "scaleStereoSlider-stereo":
            if (value == 0) {
                return "black";
            }
            else if (value > 0.0 && value <= 0.6) {
                return "blue";
            }
            else {
                return "red";
            }
        default:
            break;
    }
}
//# sourceMappingURL=stereoeffect.js.map