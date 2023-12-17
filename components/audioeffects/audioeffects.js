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
var audio_effect_options = ["none", "pitch"];
import { populateEffectArea } from "./pitch/pitcheffect.js";
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
        var selection_sources, _i, audio_effect_options_1, effect, src;
        return __generator(this, function (_a) {
            selection_sources = document.getElementById("audioeffects-audioeffectselect");
            selection_sources.innerHTML = "";
            for (_i = 0, audio_effect_options_1 = audio_effect_options; _i < audio_effect_options_1.length; _i++) {
                effect = audio_effect_options_1[_i];
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
document.getElementById("audioeffects-stream").onclick = function () {
    streaming = true;
    status_str = "streaming audio effects";
    var chosen_sink_monitor = document.getElementById("audioeffects-audionameselect").value;
    var chosen_effect = document.getElementById("audioeffects-audioeffectselect").value;
    var audio_effects_params = {
        source: chosen_sink_monitor,
        type: chosen_effect,
    };
    if (chosen_sink_monitor != "none") {
        ipcRenderer.invoke("audioeffects-start", audio_effects_params);
        console.log("streaming audio");
    }
};
document.getElementById("audioeffects-stop").onclick = function () {
    streaming = false;
    status_str = "";
    ipcRenderer.invoke("audioeffects-stop");
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
//# sourceMappingURL=audioeffects.js.map