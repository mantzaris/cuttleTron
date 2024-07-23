var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { ipcRenderer } = window.electron;
const audioEffectOptions = [
    "none",
    "pitch",
    "echo",
    "distortion",
    "reverb",
    "scaletempo",
    "bandFilter",
    "amplify1",
    "amplify2",
    "stereo",
    "dynamicExpander",
    "dynamicCompressor",
];
import { populateEffectArea_Pitch, pitchValue } from "./pitch/pitcheffect.js";
import { populateEffectArea_Echo, echo_delay, echo_intensity, echo_feedback } from "./echo/echoeffect.js";
import { populateEffectArea_Distortion, distortion_drive, distortion_gain, distortion_level, distortion_over, distortion_overdrive, distortion_trigger, distortion_vibrato, } from "./distortion/distortioneffect.js";
import { populateEffectArea_Reverb, reverb_roomsize, reverb_damping, reverb_level, reverb_width } from "./reverb/reverbeffect.js";
import { populateEffectArea_ScaleTempo, scaletempo_stride, scaletempo_overlap, scaletempo_search } from "./scaletempo/scaletempo.js";
import { populateEffectArea_BandFilter, band_lower, band_upper, band_mode, band_poles, band_ripple, band_type } from "./bandfilter/bandfilter.js";
import { populateEffectArea_Amplify1, amplify1_amplification } from "./amplify1/amplifyeffect1.js";
import { populateEffectArea_Amplify2, amplify2_amplification } from "./amplify2/amplifyeffect2.js";
import { populateEffectArea_Stereo, stereo_stereo } from "./stereo/stereoeffect.js";
import { populateEffectArea_DynamicExpander, dynamicExpander_ratio, dynamicExpander_threshold } from "./dynamicExpander/dynamicExpander.js";
import { populateEffectArea_DynamicCompressor, dynamicCompressor_ratio, dynamicCompressor_threshold } from "./dynamicCompressor/dynamicCompressor.js";
import { setRemoveHeader } from "../component-utilities/component-utilities.js";
let initialCleaningDone = false;
let streaming = false;
let status_str = "";
function initialCleaning() {
    if (!initialCleaningDone) {
        ipcRenderer.invoke("audioeffects-cleanup");
        initialCleaningDone = true;
    }
}
initialCleaning();
document.getElementById("audioeffects-expand").onclick = () => {
    const audioeffects = document.querySelector("#audioeffects");
    const expand_button = document.getElementById("audioeffects-expand");
    if (expand_button.getAttribute("data-action") === "expand") {
        audioeffects.classList.add("expanded");
        expand_button.textContent = "Hide";
        expand_button.setAttribute("data-action", "hide");
        if (!streaming) {
            populateAudioSinkOptions();
            populateAudioEffectOptions();
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
    return __awaiter(this, void 0, void 0, function* () {
        ipcRenderer.invoke("get-sinks-sources").then((sinks) => {
            // returns the pactl commandline from the OS for sinks
            let selection_sources = document.getElementById("audioeffects-audionameselect");
            selection_sources.innerHTML = "";
            const src = document.createElement("option");
            src.innerHTML = "none";
            src.value = "none";
            selection_sources.appendChild(src);
            for (const sink of sinks) {
                const src = document.createElement("option");
                src.innerHTML = sink.description;
                src.value = sink.monitorSource;
                selection_sources.appendChild(src);
            }
            selection_sources.value = "none";
        });
    });
}
function populateAudioEffectOptions() {
    return __awaiter(this, void 0, void 0, function* () {
        let selection_sources = document.getElementById("audioeffects-audioeffectselect");
        selection_sources.innerHTML = "";
        for (const effect of audioEffectOptions) {
            const src = document.createElement("option");
            src.innerHTML = effect;
            src.value = effect;
            selection_sources.appendChild(src);
        }
    });
}
document.getElementById("audioeffects-refresh").onclick = () => {
    if (!streaming) {
        populateAudioSinkOptions();
        populateAudioEffectOptions();
    }
};
//Audio Effect List START
document.getElementById("audioeffects-controls").addEventListener("change", function (event) {
    const chosen_effect = document.getElementById("audioeffects-audioeffectselect").value;
    const current_effects = [];
    document.querySelectorAll("#audioeffects-added .list-group-item").forEach((item) => {
        current_effects.push(item.getAttribute("data-effect-name"));
    });
    if (current_effects.includes(chosen_effect)) {
        return;
    }
    const effect_entry = `
                        <li class="list-group-item list-group-item-compact d-flex justify-content-between align-items-center" data-effect-name="${chosen_effect}">
                          <span>${chosen_effect}</span>
                          <button class="btn btn-danger btn-sm btn-compact remove-effect" id="remove-${chosen_effect}">Remove</button>
                        </li>  
                        `;
    document.getElementById("audioeffects-ul").innerHTML += effect_entry;
});
document.getElementById("audioeffects-added").addEventListener("click", function (event) {
    const target = event.target;
    if (target.classList.contains("remove-effect")) {
        const listItem = target.closest("li");
        listItem.remove();
    }
});
//Audio Effect List END
function getEffectParams(effectName) {
    switch (effectName) {
        case "pitch":
            return { pitchValue };
        case "echo":
            return { echo_delay, echo_intensity, echo_feedback };
        case "distortion":
            return {
                distortion_drive,
                distortion_gain,
                distortion_level,
                distortion_over,
                distortion_overdrive,
                distortion_trigger,
                distortion_vibrato,
            };
        case "reverb":
            return { reverb_roomsize, reverb_damping, reverb_level, reverb_width };
        case "scaletempo":
            return { scaletempo_stride, scaletempo_overlap, scaletempo_search };
        case "bandFilter":
            return { band_lower, band_upper, band_mode, band_poles, band_ripple, band_type };
        case "amplify1":
            return { amplify1_amplification };
        case "amplify2":
            return { amplify2_amplification };
        case "stereo":
            return { stereo_stereo };
        case "dynamicExpander":
            return { dynamicExpander_ratio, dynamicExpander_threshold };
        case "dynamicCompressor":
            return { dynamicCompressor_ratio, dynamicCompressor_threshold };
        default:
            return {};
    }
}
document.getElementById("audioeffects-start").onclick = () => __awaiter(void 0, void 0, void 0, function* () {
    const audio_effects_params = getAllEffectParams();
    if (audio_effects_params == undefined) {
        return;
    }
    console.log(audio_effects_params);
    try {
        const status = yield ipcRenderer.invoke("audioeffects-start", audio_effects_params);
        if (status.success == false) {
            showModal(status.message +
                `\n Remember to Install: ["gstreamer1.0-tools", "gstreamer1.0-plugins-base", "gstreamer1.0-plugins-good", "gstreamer1.0-plugins-bad", "gstreamer1.0-plugins-ugly"]`);
            yield ipcRenderer.invoke("audioeffects-stop");
            return;
        }
        console.log("Status:", status); // Log the status string returned from the main process
        innerDisplayState("streaming", status.message);
        return;
    }
    catch (error) {
        console.error("Error:", error);
    }
});
document.getElementById("audioeffects-stop").onclick = () => {
    ipcRenderer.invoke("audioeffects-stop");
    innerDisplayState("stopped", "");
    console.log("stopping stream");
};
document.getElementById("audioeffects-update").onclick = () => __awaiter(void 0, void 0, void 0, function* () {
    //ipcRenderer.invoke("audioeffects-stop");
    const audio_effects_params = getAllEffectParams();
    console.log(audio_effects_params);
    console.log("updating stream");
    const status = yield ipcRenderer.invoke("audioeffects-start", audio_effects_params);
    if (status.success) {
        showBriefMessage("Updated");
    }
});
document.getElementById("audioeffects-audioeffectselect").onchange = () => {
    const chosenEffectElement = document.getElementById("audioeffects-audioeffectselect");
    const chosenEffect = chosenEffectElement.value;
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
        case "scaletempo":
            populateEffectArea_ScaleTempo();
            break;
        case "bandFilter":
            populateEffectArea_BandFilter();
            break;
        case "amplify1":
            populateEffectArea_Amplify1();
            break;
        case "amplify2":
            populateEffectArea_Amplify2();
            break;
        case "stereo":
            populateEffectArea_Stereo();
            break;
        case "dynamicExpander":
            populateEffectArea_DynamicExpander();
            break;
        case "dynamicCompressor":
            populateEffectArea_DynamicCompressor();
            break;
        case "none":
            document.getElementById("audioeffects-controls").innerHTML = "";
            break;
        default:
            console.error(`Unknown effect: ${chosenEffect}`);
            // Handle unknown effect case, maybe reset to default state
            break;
    }
};
function getAllEffectParams() {
    const chosen_sink_monitor = document.getElementById("audioeffects-audionameselect").value;
    const current_effects = Array.from(document.querySelectorAll("#audioeffects-added .list-group-item"))
        .map((item) => item.getAttribute("data-effect-name"))
        .filter((effect) => effect && audioEffectOptions.includes(effect));
    if (current_effects.length === 0 || chosen_sink_monitor === "none") {
        const statusLabel = document.getElementById("audioeffects-status-label");
        statusLabel.innerText = "configure audio selection & effect";
        setTimeout(() => {
            statusLabel.innerText = "";
        }, 1200);
        return;
    }
    const audio_effects_params = {
        source: chosen_sink_monitor,
        effects: current_effects.map((effectName) => ({
            type: effectName,
            params: getEffectParams(effectName),
        })),
    };
    return audio_effects_params;
}
function innerDisplayState(status, labelMsg = "") {
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
            setRemoveHeader("audioeffects-message", true, status_str, true);
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
            setRemoveHeader("audioeffects-message", false, status_str, false);
            break;
    }
}
//notify the user if the neccessary GStreamer packages are found
function showModal(message) {
    document.getElementById("audioeffects-model-message").innerText = message; // Set the message
    document.getElementById("audioeffects-close-modal").innerText = "close";
    const modal = document.getElementById("audioeffects-modal");
    modal.classList.remove("hidden");
    document.getElementById("audioeffects-close-modal").onclick = () => {
        const modal = document.getElementById("audioeffects-modal");
        modal.classList.add("hidden");
    };
}
//deactivate the divs which are for user input when streaming
function toggleDivFreeze(freeze) {
    const divIds = ["audioeffects-col1"]; //, "audioeffects-col2", "audioeffects-controls", "audioeffects-added"];
    divIds.forEach((divId) => {
        const div = document.getElementById(divId);
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
    const audioEffectsStatusLabel = document.getElementById("audioeffects-status-label");
    const originalMessage = audioEffectsStatusLabel.textContent;
    audioEffectsStatusLabel.textContent = message;
    setTimeout(() => {
        audioEffectsStatusLabel.textContent = originalMessage;
    }, 1000);
}
//# sourceMappingURL=audioeffects.js.map