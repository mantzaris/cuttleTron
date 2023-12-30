//GStreamer 'audiochebband' for banduency filter effect
var divArea = document.getElementById("audioeffects-controls");
export var band_poles = 4; //default
export var band_ripple = 0.25; //default
export var band_type = 1; //default
//the lower end of the band 0Hz to 20KHz for voice
export var band_lower = 0.0;
var minLower = 0.0;
var maxLower = 20000;
//the upper end of the band 0Hz to 20KHz for voice
export var band_upper = 20000;
var minUpper = 0.0;
var maxUpper = 20000;
//the mode of band pass or reject
export var band_mode = 0.0;
var minMode = 0.0;
var maxMode = 1;
export function populateEffectArea_BandFilter() {
    divArea.innerHTML = "<div id=\"sliderContainer\">\n                          \n                        <label id=\"filterSliderLabel\" for=\"\">lower=".concat(band_lower, ", upper=").concat(band_upper, ", mode=").concat(band_mode, "</label>\n                          \n                        <div class=\"sliderGroup\">\n                        <label for=\"filterSlider-lower\">lower</label>\n                          <div class=\"sliderWithValues\">\n                              <span class=\"minValue\">").concat(minLower, "</span>\n                              <input type=\"range\" id=\"filterSlider-lower\" min=\"").concat(minLower, "\" max=\"").concat(maxLower, "\" step=\"500\" value=\"").concat(band_lower, "\">\n                              <span class=\"maxValue\">").concat(maxLower, "</span>\n                          </div>\n                        </div>\n\n                        <div class=\"sliderGroup\">\n                          <label for=\"filterSlider-upper\">upper</label>\n                          <div class=\"sliderWithValues\">\n                              <span class=\"minValue\">").concat(minUpper, "</span>\n                              <input type=\"range\" id=\"filterSlider-upper\" min=\"").concat(minUpper, "\" max=\"").concat(maxUpper, "\" step=\"500\" value=\"").concat(band_upper, "\">\n                              <span class=\"maxValue\">").concat(maxUpper, "</span>\n                          </div>\n                        </div>\n\n                        <div class=\"sliderGroup\">\n                          <label style=\"min-width:50%;\" for=\"filterSlider-mode\">band pass(0)-reject(1)</label>\n                          <div class=\"sliderWithValues\" style=\"max-width:25%;\">\n                              <span class=\"minValue\">").concat(minMode, "</span>\n                              <input type=\"range\" id=\"filterSlider-mode\" min=\"").concat(minMode, "\" max=\"").concat(maxMode, "\" step=\"1\" value=\"").concat(band_mode, "\">\n                              <span class=\"maxValue\">").concat(maxMode, "</span>\n                          </div>\n                        </div>\n\n                      </div>\n                        ");
    document.querySelectorAll("#sliderContainer .sliderWithValues input[type='range']").forEach(function (element) {
        var slider = element;
        slider.onchange = updateBandFilterParam;
        // for the init
        slider.style.setProperty("--thumb-color", getSliderColors(slider.id, parseFloat(slider.value)));
    });
}
function updateBandFilterParam(event) {
    var target = event.target;
    var sliderId = target.id;
    var value = parseFloat(target.value);
    var minGap = 500; //Minimum gap in Hz
    switch (sliderId) {
        case "filterSlider-lower":
            if (value > band_upper - minGap) {
                var adjustedValue = band_upper - minGap;
                target.value = adjustedValue.toString();
                band_lower = adjustedValue;
                //alert("Lower banduency must be at least 1000 Hz below the upper banduency.");
            }
            else {
                target.value = value.toString();
                band_lower = value;
            }
            break;
        case "filterSlider-upper":
            if (value < band_lower + minGap) {
                var adjustedValue = band_lower + minGap;
                target.value = adjustedValue.toString();
                band_upper = adjustedValue;
                //alert("Upper banduency must be at least 1000 Hz above the lower banduency.");
            }
            else {
                target.value = value.toString();
                band_upper = value;
            }
            break;
        case "filterSlider-mode":
            band_mode = value;
            break;
        default:
            break;
    }
    document.getElementById("filterSliderLabel").innerText = "lower=".concat(band_lower, ", upper=").concat(band_upper, ", mode=").concat(band_mode);
}
function getSliderColors(sliderId, value) {
    return "blue";
    // switch (sliderId) {
    //   case "filterSlider-lower":
    //     if (value <= 0.7) {
    //       return "blue";
    //     } else {
    //       return "orange";
    //     }
    //   case "filterSlider-upper":
    //     if (value == 0.0) {
    //       return "black";
    //     } else if (value <= 0.7) {
    //       return "blue";
    //     } else {
    //       return "orange";
    //     }
    //   case "filterSlider-mode":
    //     if (value == 0.0) {
    //       return "black";
    //     } else if (value <= 0.6) {
    //       return "blue";
    //     } else {
    //       return "red";
    //     }
    //   default:
    //     return "grey";
    // }
}
//# sourceMappingURL=bandfilter.js.map