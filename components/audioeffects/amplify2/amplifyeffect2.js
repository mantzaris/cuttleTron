//GStreamer 'audioamplify'
var divArea = document.getElementById("audioeffects-controls");
// Amplification scales sound (range offered is theoretical and not practical: (-3.402823e+38 to 3.402823e+38)
export var amplify2_amplification = 1;
var minAmplify = -1.0;
var maxAmplify = 25;
export function populateEffectArea_Amplify2() {
    divArea.innerHTML = "<div id=\"sliderContainer\">\n                            \n                            <label id=\"scaleAmplificationLabel\" for=\"\">amplification=".concat(amplify2_amplification, "</label>\n                            \n                            <div class=\"sliderGroup\">\n                            <label for=\"scaleAmplificationSlider-amplication\">amplication</label>\n                            <div class=\"sliderWithValues\">\n                                <span class=\"minValue\">").concat(minAmplify, "</span>\n                                <input type=\"range\" id=\"scaleAmplificationSlider-amplication\" min=\"").concat(minAmplify, "\" max=\"").concat(maxAmplify, "\" step=\"0.5\" value=\"").concat(amplify2_amplification, "\">\n                                <span class=\"maxValue\">").concat(maxAmplify, "</span>\n                            </div>\n                            </div>\n\n                        </div>\n                            ");
    document.querySelectorAll("#sliderContainer .sliderWithValues input[type='range']").forEach(function (element) {
        var slider = element;
        slider.onchange = updateAmplificationParam;
        // for the init
        slider.style.setProperty("--thumb-color", getSliderColors(slider.id, parseFloat(slider.value)));
    });
}
function updateAmplificationParam(event) {
    var target = event.target;
    var sliderId = target.id;
    var value = parseFloat(target.value);
    switch (sliderId) {
        case "scaleAmplificationSlider-amplication":
            amplify2_amplification = value;
            target.style.setProperty("--thumb-color", getSliderColors(sliderId, value));
            break;
        default:
            break;
    }
    document.getElementById("scaleAmplificationLabel").innerText = "amplification=".concat(amplify2_amplification);
}
function getSliderColors(sliderId, value) {
    switch (sliderId) {
        case "scaleAmplificationSlider-amplication":
            if (value == 1.0) {
                return "black";
            }
            else if (value > 0.5 && value <= 15.0) {
                return "blue";
            }
            else {
                return "red";
            }
        default:
            break;
    }
}
//# sourceMappingURL=amplifyeffect2.js.map