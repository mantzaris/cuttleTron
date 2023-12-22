var labelText = "Flanger Params";
var divArea = document.getElementById("audioeffects-controls");
//depth is how intense the time delay modulation is, zero is no modulation 1.0 is max, and 0.5 is moderate (0.3 to 0.7)
export var depthValue = 0.0;
var minDepth = 0.0;
var maxDepth = 1.0;
//feedback is the intensity of the effect, zero is no feedback, 1.0 max, and 0.5 is moderate with moderate rand 0.3 to 0.7
export var feedbackValue = 0.0;
var minFeedback = 0.0;
var maxFeedback = 1.0;
//speed is the delay time of the modulation of the effect, 1.0 is moderate range 0.5 to 1.5 and, zero is minimum, low is 0.1 to 0.5, max 10
export var speedValue = 0.0;
var minSpeed = 0.0;
var maxSpeed = 10;
export function populateEffectArea_Flanger() {
    divArea.innerHTML = "<div id=\"sliderContainer\">\n                          \n                        <label id=\"flangerSliderLabel\" for=\"\">depth=".concat(depthValue, ", feedback=").concat(feedbackValue, ", speed=").concat(speedValue, "</label>\n                          \n                        <label for=\"\">depth</label>\n                          <div class=\"sliderWithValues\">\n                              <span class=\"minValue\">").concat(minDepth, "</span>\n                              <input type=\"range\" id=\"flangerSlider-depth\" min=\"").concat(minDepth, "\" max=\"").concat(maxDepth, "\" step=\"0.01\" value=\"").concat(depthValue, "\">\n                              <span class=\"maxValue\">").concat(maxDepth, "</span>\n                          </div>\n\n                          <label for=\"\">feedback</label>\n                          <div class=\"sliderWithValues\">\n                              <span class=\"minValue\">").concat(minFeedback, "</span>\n                              <input type=\"range\" id=\"flangerSlider-feedback\" min=\"").concat(minFeedback, "\" max=\"").concat(maxFeedback, "\" step=\"0.01\" value=\"").concat(feedbackValue, "\">\n                              <span class=\"maxValue\">").concat(maxFeedback, "</span>\n                          </div>\n\n                          <label for=\"\">speed</label>\n                          <div class=\"sliderWithValues\">\n                              <span class=\"minValue\">").concat(minSpeed, "</span>\n                              <input type=\"range\" id=\"flangerSlider-speed\" min=\"").concat(minSpeed, "\" max=\"").concat(maxSpeed, "\" step=\"0.01\" value=\"").concat(speedValue, "\">\n                              <span class=\"maxValue\">").concat(maxSpeed, "</span>\n                          </div>\n\n                      </div>\n                        ");
    document.querySelectorAll(".sliderWithValues input[type='range']").forEach(function (element) {
        var slider = element;
        slider.onchange = updateFlangerParam;
    });
    function updateFlangerParam(event) {
        var target = event.target;
        var sliderId = target.id;
        var value = parseFloat(target.value);
        switch (sliderId) {
            case "flangerSlider-depth":
                depthValue = value;
                break;
            case "flangerSlider-feedback":
                feedbackValue = value;
                break;
            case "flangerSlider-speed":
                speedValue = value;
                break;
            default:
                break;
        }
        document.getElementById("flangerSliderLabel").innerText = "depth=".concat(depthValue, ", feedback=").concat(feedbackValue, ", speed=").concat(speedValue);
    }
}
// document.getElementById("flangerSlider-depth").onchange = (event) => {
//     const target = event.target as HTMLInputElement;
//     depthValue = target.valueAsNumber; //parseFloat(target.value);
//     document.getElementById("flangerSliderLabel").innerText = `depth=${depthValue}`;
//   };
//# sourceMappingURL=flangereffect.js.map