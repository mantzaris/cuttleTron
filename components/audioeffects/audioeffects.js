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
var audioEffectOptions = ["none", "pitch"];
import { populateEffectArea, pitchValue } from "./pitch/pitcheffect.js";
var streaming = false;
var status_str = "";
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
        }
        else {
            document.getElementById("audioeffects-start").style.display = "none";
            document.getElementById("audioeffects-stop").style.display = "block";
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
document.getElementById("audioeffects-start").onclick = function () { return __awaiter(void 0, void 0, void 0, function () {
    var chosen_sink_monitor, chosenEffectElement, chosenEffectValue, chosenEffect, audio_effects_params, message_tmp, status_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                chosen_sink_monitor = document.getElementById("audioeffects-audionameselect").value;
                chosenEffectElement = document.getElementById("audioeffects-audioeffectselect");
                chosenEffectValue = chosenEffectElement.value;
                chosenEffect = audioEffectOptions.includes(chosenEffectValue) ? chosenEffectValue : "none";
                audio_effects_params = {
                    source: chosen_sink_monitor,
                    type: chosenEffect,
                };
                if (chosenEffect === "none" || chosen_sink_monitor == "none") {
                    message_tmp = "Select: ";
                    if (chosenEffect == "none" && chosen_sink_monitor == "none") {
                        message_tmp += "audio source & effect";
                    }
                    else if (chosenEffect == "none" && !(chosen_sink_monitor == "none")) {
                        message_tmp += "audio effect";
                    }
                    else if (!(chosenEffect == "none") && chosen_sink_monitor == "none") {
                        message_tmp += "audio source";
                    }
                    document.getElementById("audioeffects-status-label").innerText = message_tmp;
                    setTimeout(function () {
                        document.getElementById("audioeffects-status-label").innerText = "";
                    }, 1200);
                    return [2 /*return*/];
                }
                else if (chosenEffect == "pitch") {
                    audio_effects_params["params"] = {
                        pitchValue: pitchValue,
                    };
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, ipcRenderer.invoke("audioeffects-start", audio_effects_params)];
            case 2:
                status_1 = _a.sent();
                document.getElementById("audioeffects-status-label").innerText = status_1;
                console.log("Status:", status_1); // Log the status string returned from the main process
                document.getElementById("audioeffects-start").style.display = "none";
                document.getElementById("audioeffects-stop").style.display = "block";
                document.getElementById("audioeffects-refresh").style.display = "none";
                streaming = true;
                status_str = "streaming audio effects";
                setRemoveHeader(true, status_str, true);
                return [2 /*return*/];
            case 3:
                error_1 = _a.sent();
                console.error("Error:", error_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
document.getElementById("audioeffects-stop").onclick = function () {
    streaming = false;
    status_str = "";
    ipcRenderer.invoke("audioeffects-stop");
    document.getElementById("audioeffects-status-label").innerText = "";
    setRemoveHeader(false, status_str, false);
    document.getElementById("audioeffects-start").style.display = "block";
    document.getElementById("audioeffects-stop").style.display = "none";
    document.getElementById("audioeffects-refresh").style.display = "block";
    console.log("stopping stream");
};
document.getElementById("audioeffects-audioeffectselect").onchange = function () {
    var chosen_effect = document.getElementById("audioeffects-audioeffectselect").value;
    if (chosen_effect == "none") {
        document.getElementById("audioeffects-controls").innerHTML = "";
    }
    else if (chosen_effect == "pitch") {
        populateEffectArea();
    }
};
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
//# sourceMappingURL=audioeffects.js.map