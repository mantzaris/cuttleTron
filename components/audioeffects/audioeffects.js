var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var ipcRenderer = window.electron.ipcRenderer;
var audioEffectOptions = ["none", "pitch", "echo", "distortion", "reverb", "bandFilter"];
import { populateEffectArea_Pitch, pitchValue } from "./pitch/pitcheffect.js";
import { populateEffectArea_Echo, echo_delay, echo_intensity, echo_feedback } from "./echo/echoeffect.js";
import { populateEffectArea_Distortion, distortion_drive, distortion_gain, distortion_level, distortion_over, distortion_overdrive, distortion_trigger, distortion_vibrato, } from "./distortion/distortioneffect.js";
import { populateEffectArea_Reverb, reverb_roomsize, reverb_damping, reverb_level, reverb_width } from "./reverb/reverbeffect.js";
import { populateEffectArea_BandFilter, band_lower, band_upper, band_mode, band_poles, band_ripple, band_type } from "./bandfilter/bandfilter.js";
var initialCleaningDone = false;
var streaming = false;
var status_str = "";
function initialCleaning() {
    if (!initialCleaningDone) {
        ipcRenderer.invoke("audioeffects-cleanup");
        initialCleaningDone = true;
    }
}
initialCleaning();
document.getElementById("audioeffects-expand").onclick = function () {
    var audioeffects = document.querySelector("#audioeffects");
    var expand_button = document.getElementById("audioeffects-expand");
    if (expand_button.getAttribute("data-action") === "expand") {
        audioeffects.classList.add("expanded");
        expand_button.textContent = "Hide";
        expand_button.setAttribute("data-action", "hide");
        if (!streaming) {
            populateAudioSinkOptions();
            populateAudeioEffectOptions();
            document.getElementById("audioeffects-start").style.display = "block";
            document.getElementById("audioeffects-stop").style.display = "none";
            document.getElementById("audioeffects-update").style.display = "none";
            toggleDivFreeze(false);
        }
        else {
            document.getElementById("audioeffects-start").style.display = "none";
            document.getElementById("audioeffects-stop").style.display = "block";
            document.getElementById("audioeffects-stop").style.display = "block";
            toggleDivFreeze(true);
        }
    }
    else {
        audioeffects.classList.remove("expanded");
        expand_button.textContent = "Expand";
        expand_button.setAttribute("data-action", "expand");
    }
};
function populateAudioSinkOptions() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            ipcRenderer.invoke("get-sinks-sources").then(function (sinks) {
                // returns the pactl commandline from the OS for sinks
                var selection_sources = document.getElementById("audioeffects-audionameselect");
                selection_sources.innerHTML = "";
                var src = document.createElement("option");
                src.innerHTML = "none";
                src.value = "none";
                selection_sources.appendChild(src);
                for (var _i = 0, sinks_1 = sinks; _i < sinks_1.length; _i++) {
                    var sink = sinks_1[_i];
                    var src_1 = document.createElement("option");
                    src_1.innerHTML = sink.description;
                    src_1.value = sink.monitorSource;
                    selection_sources.appendChild(src_1);
                }
                selection_sources.value = "none";
            });
            return [2 /*return*/];
        });
    });
}
function populateAudeioEffectOptions() {
    return __awaiter(this, void 0, void 0, function () {
        var selection_sources, _i, audioEffectOptions_1, effect, src;
        return __generator(this, function (_a) {
            selection_sources = document.getElementById("audioeffects-audioeffectselect");
            selection_sources.innerHTML = "";
            for (_i = 0, audioEffectOptions_1 = audioEffectOptions; _i < audioEffectOptions_1.length; _i++) {
                effect = audioEffectOptions_1[_i];
                src = document.createElement("option");
                src.innerHTML = effect;
                src.value = effect;
                selection_sources.appendChild(src);
            }
            return [2 /*return*/];
        });
    });
}
document.getElementById("audioeffects-refresh").onclick = function () {
    if (!streaming) {
        populateAudioSinkOptions();
        populateAudeioEffectOptions();
    }
};
//Audio Effect List START
document.getElementById("audioeffects-controls").addEventListener("change", function (event) {
    var chosen_effect = document.getElementById("audioeffects-audioeffectselect").value;
    var current_effects = [];
    document.querySelectorAll("#audioeffects-added .list-group-item").forEach(function (item) {
        current_effects.push(item.getAttribute("data-effect-name"));
    });
    if (current_effects.includes(chosen_effect)) {
        return;
    }
    var effect_entry = "\n                        <li class=\"list-group-item list-group-item-compact d-flex justify-content-between align-items-center\" data-effect-name=\"".concat(chosen_effect, "\">\n                          <span>").concat(chosen_effect, "</span>\n                          <button class=\"btn btn-danger btn-sm btn-compact remove-effect\" id=\"remove-").concat(chosen_effect, "\">Remove</button>\n                        </li>  \n                        ");
    document.getElementById("audioeffects-ul").innerHTML += effect_entry;
});
document.getElementById("audioeffects-added").addEventListener("click", function (event) {
    var target = event.target;
    if (target.classList.contains("remove-effect")) {
        var listItem = target.closest("li");
        listItem.remove();
    }
});
//Audio Effect List END
function getEffectParams(effectName) {
    switch (effectName) {
        case "pitch":
            return { pitchValue: pitchValue };
        case "echo":
            return { echo_delay: echo_delay, echo_intensity: echo_intensity, echo_feedback: echo_feedback };
        case "distortion":
            return {
                distortion_drive: distortion_drive,
                distortion_gain: distortion_gain,
                distortion_level: distortion_level,
                distortion_over: distortion_over,
                distortion_overdrive: distortion_overdrive,
                distortion_trigger: distortion_trigger,
                distortion_vibrato: distortion_vibrato,
            };
        case "reverb":
            return { reverb_roomsize: reverb_roomsize, reverb_damping: reverb_damping, reverb_level: reverb_level, reverb_width: reverb_width };
        case "bandFilter":
            return { band_lower: band_lower, band_upper: band_upper, band_mode: band_mode, band_poles: band_poles, band_ripple: band_ripple, band_type: band_type };
        default:
            return {};
    }
}
document.getElementById("audioeffects-start").onclick = function () { return __awaiter(void 0, void 0, void 0, function () {
    var audio_effects_params, status_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                audio_effects_params = getAllEffectParams();
                if (audio_effects_params == undefined) {
                    return [2 /*return*/];
                }
                console.log(audio_effects_params);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                return [4 /*yield*/, ipcRenderer.invoke("audioeffects-start", audio_effects_params)];
            case 2:
                status_1 = _a.sent();
                if (!(status_1.success == false)) return [3 /*break*/, 4];
                showModal(status_1.message +
                    "\n Remember to Install: [\"gstreamer1.0-tools\", \"gstreamer1.0-plugins-base\", \"gstreamer1.0-plugins-good\", \"gstreamer1.0-plugins-bad\", \"gstreamer1.0-plugins-ugly\"]");
                return [4 /*yield*/, ipcRenderer.invoke("audioeffects-stop")];
            case 3:
                _a.sent();
                return [2 /*return*/];
            case 4:
                console.log("Status:", status_1); // Log the status string returned from the main process
                innerDisplayState("streaming", status_1.message);
                return [2 /*return*/];
            case 5:
                error_1 = _a.sent();
                console.error("Error:", error_1);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
document.getElementById("audioeffects-stop").onclick = function () {
    ipcRenderer.invoke("audioeffects-stop");
    innerDisplayState("stopped", "");
    console.log("stopping stream");
};
document.getElementById("audioeffects-update").onclick = function () { return __awaiter(void 0, void 0, void 0, function () {
    var audio_effects_params, status;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                audio_effects_params = getAllEffectParams();
                console.log(audio_effects_params);
                console.log("updating stream");
                return [4 /*yield*/, ipcRenderer.invoke("audioeffects-start", audio_effects_params)];
            case 1:
                status = _a.sent();
                if (status.success) {
                    showBriefMessage("Updated");
                }
                return [2 /*return*/];
        }
    });
}); };
document.getElementById("audioeffects-audioeffectselect").onchange = function () {
    var chosenEffectElement = document.getElementById("audioeffects-audioeffectselect");
    var chosenEffect = chosenEffectElement.value;
    switch (chosenEffect) {
        case "pitch":
            populateEffectArea_Pitch();
            break;
        case "echo":
            populateEffectArea_Echo();
            break;
        case "distortion":
            populateEffectArea_Distortion();
            break;
        case "reverb":
            populateEffectArea_Reverb();
            break;
        case "bandFilter":
            populateEffectArea_BandFilter();
            break;
        case "none":
            document.getElementById("audioeffects-controls").innerHTML = "";
            break;
        default:
            console.error("Unknown effect: ".concat(chosenEffect));
            // Handle unknown effect case, maybe reset to default state
            break;
    }
};
function getAllEffectParams() {
    var chosen_sink_monitor = document.getElementById("audioeffects-audionameselect").value;
    var current_effects = Array.from(document.querySelectorAll("#audioeffects-added .list-group-item"))
        .map(function (item) { return item.getAttribute("data-effect-name"); })
        .filter(function (effect) { return effect && audioEffectOptions.includes(effect); });
    if (current_effects.length === 0 || chosen_sink_monitor === "none") {
        var statusLabel_1 = document.getElementById("audioeffects-status-label");
        statusLabel_1.innerText = "configure audio selection & effect";
        setTimeout(function () {
            statusLabel_1.innerText = "";
        }, 1200);
        return;
    }
    var audio_effects_params = {
        source: chosen_sink_monitor,
        effects: current_effects.map(function (effectName) { return ({
            type: effectName,
            params: getEffectParams(effectName),
        }); }),
    };
    return audio_effects_params;
}
function innerDisplayState(status, labelMsg) {
    if (labelMsg === void 0) { labelMsg = ""; }
    switch (status) {
        case "streaming":
            streaming = true;
            status_str = "streaming audio effects";
            document.getElementById("audioeffects-status-label").innerText = labelMsg;
            document.getElementById("audioeffects-start").style.display = "none";
            document.getElementById("audioeffects-stop").style.display = "block";
            document.getElementById("audioeffects-update").style.display = "block";
            document.getElementById("audioeffects-refresh").style.display = "none";
            toggleDivFreeze(true);
            setRemoveHeader(true, status_str, true);
            break;
        case "stopped":
            streaming = false;
            status_str = "";
            document.getElementById("audioeffects-status-label").innerText = labelMsg;
            document.getElementById("audioeffects-start").style.display = "block";
            document.getElementById("audioeffects-stop").style.display = "none";
            document.getElementById("audioeffects-update").style.display = "none";
            document.getElementById("audioeffects-refresh").style.display = "block";
            toggleDivFreeze(false);
            setRemoveHeader(false, status_str, false);
            break;
    }
}
function setRemoveHeader(add_message, message, flash_bool) {
    var scroll_flash_text = "scroll-flash-text";
    var scroll_text = "scroll-text";
    var flash_text = "flash-text";
    var container = document.getElementById("audioeffects-message");
    var textElement = container.querySelector("div"); // Assuming the text is in a div inside the container
    textElement.classList.remove(scroll_flash_text);
    textElement.classList.remove(scroll_text);
    textElement.classList.remove(flash_text);
    if (!add_message) {
        textElement.innerText = "";
        return;
    }
    textElement.innerText = message;
    if (textElement.scrollWidth > container.clientWidth) {
        // Text is too long
        if (flash_bool) {
            textElement.classList.add(scroll_flash_text);
        }
        else {
            textElement.classList.add(scroll_text);
        }
    }
    else {
        // Text fits in the container
        if (flash_bool) {
            textElement.classList.add(flash_text);
        }
    }
    textElement.style.display = "block";
}
//notify the user if the neccessary GStreamer packages are found
function showModal(message) {
    document.getElementById("audioeffects-model-message").innerText = message; // Set the message
    document.getElementById("audioeffects-close-modal").innerText = "close";
    var modal = document.getElementById("audioeffects-modal");
    modal.classList.remove("hidden");
    document.getElementById("audioeffects-close-modal").onclick = function () {
        var modal = document.getElementById("audioeffects-modal");
        modal.classList.add("hidden");
    };
}
//deactivate the divs which are for user input when streaming
function toggleDivFreeze(freeze) {
    var divIds = ["audioeffects-col1"]; //, "audioeffects-col2", "audioeffects-controls", "audioeffects-added"];
    divIds.forEach(function (divId) {
        var div = document.getElementById(divId);
        if (div) {
            if (freeze) {
                div.classList.add("disabled-div");
            }
            else {
                div.classList.remove("disabled-div");
            }
        }
    });
}
function showBriefMessage(message) {
    var audioEffectsStatusLabel = document.getElementById("audioeffects-status-label");
    var originalMessage = audioEffectsStatusLabel.textContent;
    audioEffectsStatusLabel.textContent = message;
    setTimeout(function () {
        audioEffectsStatusLabel.textContent = originalMessage;
    }, 1000);
}
//# sourceMappingURL=audioeffects.js.map