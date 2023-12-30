//GStreamer 'audiochebband' for banduency filter effect
let divArea = document.getElementById("audioeffects-controls");

export const band_poles = 4; //default
export const band_ripple = 0.25; //default
export const band_type = 1; //default

//the lower end of the band 0Hz to 20KHz for voice
export let band_lower: number = 0.0;
const minLower = 0.0;
const maxLower = 20_000;
//the upper end of the band 0Hz to 20KHz for voice
export let band_upper: number = 20_000;
const minUpper = 0.0;
const maxUpper = 20_000;
//the mode of band pass or reject
export let band_mode: number = 0.0;
const minMode = 0.0;
const maxMode = 1;

export function populateEffectArea_BandFilter() {
  divArea.innerHTML = `<div id="sliderContainer">
                          
                        <label id="filterSliderLabel" for="">lower=${band_lower}, upper=${band_upper}, mode=${band_mode}</label>
                          
                        <div class="sliderGroup">
                        <label for="filterSlider-lower">lower</label>
                          <div class="sliderWithValues">
                              <span class="minValue">${minLower}</span>
                              <input type="range" id="filterSlider-lower" min="${minLower}" max="${maxLower}" step="500" value="${band_lower}">
                              <span class="maxValue">${maxLower}</span>
                          </div>
                        </div>

                        <div class="sliderGroup">
                          <label for="filterSlider-upper">upper</label>
                          <div class="sliderWithValues">
                              <span class="minValue">${minUpper}</span>
                              <input type="range" id="filterSlider-upper" min="${minUpper}" max="${maxUpper}" step="500" value="${band_upper}">
                              <span class="maxValue">${maxUpper}</span>
                          </div>
                        </div>

                        <div class="sliderGroup">
                          <label style="min-width:50%;" for="filterSlider-mode">band pass(0)-reject(1)</label>
                          <div class="sliderWithValues" style="max-width:25%;">
                              <span class="minValue">${minMode}</span>
                              <input type="range" id="filterSlider-mode" min="${minMode}" max="${maxMode}" step="1" value="${band_mode}">
                              <span class="maxValue">${maxMode}</span>
                          </div>
                        </div>

                      </div>
                        `;

  document.querySelectorAll("#sliderContainer .sliderWithValues input[type='range']").forEach((element) => {
    const slider = element as HTMLInputElement;
    slider.onchange = updateBandFilterParam;
    // for the init
    slider.style.setProperty("--thumb-color", getSliderColors(slider.id, parseFloat(slider.value)));
  });
}

function updateBandFilterParam(event: InputEvent) {
  const target = event.target as HTMLInputElement;
  const sliderId = target.id;
  const value = parseFloat(target.value);
  const minGap = 500; //Minimum gap in Hz

  switch (sliderId) {
    case "filterSlider-lower":
      if (value > band_upper - minGap) {
        const adjustedValue = band_upper - minGap;
        target.value = adjustedValue.toString();
        band_lower = adjustedValue;
        //alert("Lower banduency must be at least 1000 Hz below the upper banduency.");
      } else {
        target.value = value.toString();
        band_lower = value;
      }
      break;
    case "filterSlider-upper":
      if (value < band_lower + minGap) {
        const adjustedValue = band_lower + minGap;
        target.value = adjustedValue.toString();
        band_upper = adjustedValue;
        //alert("Upper banduency must be at least 1000 Hz above the lower banduency.");
      } else {
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

  document.getElementById("filterSliderLabel").innerText = `lower=${band_lower}, upper=${band_upper}, mode=${band_mode}`;
}

function getSliderColors(sliderId: string, value: number): string {
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
