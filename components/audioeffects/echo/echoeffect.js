//GStreamer 'audioecho'
var labelText = "audioecho Params";
var divArea = document.getElementById("audioeffects-controls");
//delay is echo time after original audio, zero is no echo, 5.0 is max, and 0.5 is moderate (0.1 to 1.0)
export var delay = 0.0;
var delay_shown = 0.0;
var minDelay = 0.0;
var maxDelay = 5.0;
//intensity the loudness of the echo compared to the original sound; min 0, max 1.0, moderate 0.3 to 0.6
export var intensity = 0.0;
var minIntensity = 0.0;
var maxIntensity = 1.0;
//feedback the number of echos, so 0.0 is a single echo, and 1.0 continuous, moderate is 0.2 to 0.5
export var feedback = 0.0;
var minFeedback = 0.0;
var maxFeedback = 1;
export function populateEffectArea_Echo() {
    divArea.innerHTML = "<div id=\"sliderContainer\">\n                          \n                        <label id=\"echoSliderLabel\" for=\"\">delay=".concat(delay_shown, ", intensity=").concat(intensity, ", feedback=").concat(feedback, "</label>\n                          \n                        <div class=\"sliderGroup\">\n                        <label for=\"echoSlider-delay\">delay</label>\n                          <div class=\"sliderWithValues\">\n                              <span class=\"minValue\">").concat(minDelay, "</span>\n                              <input type=\"range\" id=\"echoSlider-delay\" min=\"").concat(minDelay, "\" max=\"").concat(maxDelay, "\" step=\"0.1\" value=\"").concat(delay_shown, "\">\n                              <span class=\"maxValue\">").concat(maxDelay, "</span>\n                          </div>\n                        </div>\n\n                        <div class=\"sliderGroup\">\n                          <label for=\"echoSlider-intensity\">intensity</label>\n                          <div class=\"sliderWithValues\">\n                              <span class=\"minValue\">").concat(minIntensity, "</span>\n                              <input type=\"range\" id=\"echoSlider-intensity\" min=\"").concat(minIntensity, "\" max=\"").concat(maxIntensity, "\" step=\"0.1\" value=\"").concat(intensity, "\">\n                              <span class=\"maxValue\">").concat(maxIntensity, "</span>\n                          </div>\n                        </div>\n\n                        <div class=\"sliderGroup\">\n                          <label for=\"echoSlider-feedback\">feedback</label>\n                          <div class=\"sliderWithValues\">\n                              <span class=\"minValue\">").concat(minFeedback, "</span>\n                              <input type=\"range\" id=\"echoSlider-feedback\" min=\"").concat(minFeedback, "\" max=\"").concat(maxFeedback, "\" step=\"0.1\" value=\"").concat(feedback, "\">\n                              <span class=\"maxValue\">").concat(maxFeedback, "</span>\n                          </div>\n                        </div>\n\n                      </div>\n                        ");
    document.querySelectorAll(".sliderWithValues input[type='range']").forEach(function (element) {
        var slider = element;
        slider.onchange = updateFlangerParam;
    });
    function updateFlangerParam(event) {
        var target = event.target;
        var sliderId = target.id;
        var value = parseFloat(target.value);
        var scale_delay = 1000000000; // Scale factor (1 second = 1,000,000,000 nanoseconds)
        switch (sliderId) {
            case "echoSlider-delay":
                delay_shown = value;
                delay = delay_shown * scale_delay;
                break;
            case "echoSlider-intensity":
                intensity = value;
                break;
            case "echoSlider-feedback":
                feedback = value;
                break;
            default:
                break;
        }
        document.getElementById("echoSliderLabel").innerText = "delay=".concat(delay_shown, ", intensity=").concat(intensity, ", feedback=").concat(feedback);
    }
}
// document.getElementById("echoSlider-depth").onchange = (event) => {
//     const target = event.target as HTMLInputElement;
//     depthValue = target.valueAsNumber; //parseFloat(target.value);
//     document.getElementById("echoSliderLabel").innerText = `depth=${depthValue}`;
//   };
//# sourceMappingURL=echoeffect.js.map