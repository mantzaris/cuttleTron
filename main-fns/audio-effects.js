"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var util_1 = require("util");
var execAsync = (0, util_1.promisify)(child_process_1.exec);
var virtualSinkName = "cuttletronVirtualMic";
var virtualSinkDescription = "cuttletron_Virtual_Mic_Temp";
var virtualSourceName = "CuttletronMicrophone";
var virtualSourceDescription = "Cuttletron_Microphone";
var gStreamerProcess = null; // holds the child process reference
var virtualSinkModuleId = null;
var virtualSourceModuleId = null;
function audioEffectsStart(audioEffectsParams) {
    return __awaiter(this, void 0, void 0, function () {
        var loadSinkCommand, loadRemapCommand, source, type, bufferTime, pitchValue, gStreamerArgs;
        return __generator(this, function (_a) {
            loadSinkCommand = "pactl load-module module-null-sink sink_name=".concat(virtualSinkName, " sink_properties=device.description=").concat(virtualSinkDescription);
            loadRemapCommand = "pactl load-module module-remap-source master=".concat(virtualSinkName, ".monitor source_name=").concat(virtualSourceName, " source_properties=device.description=").concat(virtualSourceDescription);
            // Execute the command to create the virtual sink
            (0, child_process_1.exec)(loadSinkCommand, function (error, stdout, stderr) {
                if (error) {
                    console.error("Error creating virtual sink: ".concat(error));
                    return;
                }
                if (stderr) {
                    console.error("Error output: ".concat(stderr));
                    return;
                }
                virtualSinkModuleId = stdout.trim();
                console.log("Virtual sink created successfully.");
                // Check if 'VirtualMic' is in the list of sinks
                (0, child_process_1.exec)("pactl list sinks short", function (error, stdout, stderr) {
                    if (error) {
                        console.error("exec error: ".concat(error));
                        return;
                    }
                    if (stderr) {
                        console.error("stderr: ".concat(stderr));
                        return;
                    }
                    if (stdout.includes("".concat(virtualSinkName))) {
                        console.log("VirtualMic sink is available.");
                        // Continue with setting up FFmpeg
                    }
                    else {
                        console.log("".concat(virtualSinkName, " sink is not available."));
                    }
                });
            });
            // Execute the command to remap the virtual sink to a source
            (0, child_process_1.exec)(loadRemapCommand, function (error, stdout, stderr) {
                if (error) {
                    console.error("Error creating virtual sink remaping to source: ".concat(error));
                    return;
                }
                if (stderr) {
                    console.error("Error output: ".concat(stderr));
                    return;
                }
                virtualSourceModuleId = stdout.trim();
                console.log("Virtual source created successfully.");
                // Check if 'VirtualMic' is in the list of sinks
                (0, child_process_1.exec)("pactl list sources short", function (error, stdout, stderr) {
                    if (error) {
                        console.error("exec error: ".concat(error));
                        return;
                    }
                    if (stderr) {
                        console.error("stderr: ".concat(stderr));
                        return;
                    }
                    if (stdout.includes("".concat(virtualSourceName))) {
                        console.log("".concat(virtualSourceName, " source name is available."));
                        // Continue with setting up FFmpeg
                    }
                    else {
                        console.log("".concat(virtualSinkName, " source is not available."));
                    }
                });
            });
            source = audioEffectsParams.source, type = audioEffectsParams.type;
            bufferTime = 100000;
            pitchValue = 1.5;
            gStreamerArgs = [
                "pulsesrc",
                "device=".concat(source),
                "buffer-time=".concat(bufferTime),
                "!",
                "audioconvert",
                "!",
                "pitch",
                "pitch=".concat(pitchValue),
                "!",
                "pulsesink",
                "device=".concat(virtualSinkName),
            ];
            gStreamerProcess = (0, child_process_1.spawn)("gst-launch-1.0", gStreamerArgs);
            if (type == "none") {
                //
            }
            else if (type == "pitch") {
                //
            }
            return [2 /*return*/];
        });
    });
}
// also delete and remove other virtual sink created by this app
function audioEffectsStop() {
    if (gStreamerProcess) {
        gStreamerProcess.kill("SIGTERM");
    }
    if (virtualSinkModuleId) {
        (0, child_process_1.exec)("pactl unload-module ".concat(virtualSinkModuleId), function (error, stdout, stderr) {
            if (error) {
                console.error("Error unloading virtual sink: ".concat(error));
                return;
            }
            if (stderr) {
                console.error("Error output: ".concat(stderr));
                return;
            }
            console.log("Virtual sink with module ID ".concat(virtualSinkModuleId, " unloaded successfully."));
        });
    }
}
module.exports = { audioEffectsStart: audioEffectsStart, audioEffectsStop: audioEffectsStop };
//const loadSinkCommandOLD = `pactl load-module module-null-sink sink_name=${virtualSinkName} sink_properties=device.description=${virtualSinkDescription}`;
//# sourceMappingURL=audio-effects.js.map