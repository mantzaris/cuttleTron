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
var bufferTime = 100000;
var virtualSinkName = "cuttletronVirtualMicTemp";
var virtualSinkDescription = "cuttletron_Virtual_Mic_Temp";
var virtualSourceName = "CuttletronMicrophone";
var virtualSourceDescription = "Cuttletron_Microphone";
var gStreamerProcess = null; // holds the child process reference
var virtualSinkModuleId = null;
var virtualSourceModuleId = null;
function audioEffectsStart(audioEffectsParams) {
    return __awaiter(this, void 0, void 0, function () {
        var loadSinkCommand, loadRemapCommand, sinkResult, sourceResult, error_1, source, type, pitchValue, gStreamerArgs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, cleanupAudioDevices()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    loadSinkCommand = "pactl load-module module-null-sink sink_name=".concat(virtualSinkName, " sink_properties=device.description=").concat(virtualSinkDescription);
                    loadRemapCommand = "pactl load-module module-remap-source master=".concat(virtualSinkName, ".monitor source_name=").concat(virtualSourceName, " source_properties=device.description=").concat(virtualSourceDescription);
                    return [4 /*yield*/, execAsync(loadSinkCommand)];
                case 3:
                    sinkResult = _a.sent();
                    virtualSinkModuleId = sinkResult.stdout.trim();
                    console.log("Virtual sink: ".concat(virtualSinkName, ", created successfully for audio effects."));
                    return [4 /*yield*/, execAsync(loadRemapCommand)];
                case 4:
                    sourceResult = _a.sent();
                    virtualSourceModuleId = sourceResult.stdout.trim();
                    console.log("Virtual source: ".concat(virtualSourceName, ", created successfully."));
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error("Error in setting up audio effects: ".concat(error_1));
                    return [3 /*break*/, 6];
                case 6:
                    source = audioEffectsParams.source, type = audioEffectsParams.type;
                    pitchValue = 1.5;
                    if (type == "none") {
                        //
                    }
                    else if (type == "pitch") {
                        //
                    }
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
                    return [2 /*return*/];
            }
        });
    });
}
// also delete and remove other virtual sink created by this app
function audioEffectsStop() {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (gStreamerProcess) {
                        gStreamerProcess.kill("SIGTERM");
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    if (!virtualSourceModuleId) return [3 /*break*/, 3];
                    return [4 /*yield*/, execAsync("pactl unload-module ".concat(virtualSourceModuleId))];
                case 2:
                    _a.sent();
                    console.log("Virtual source with module ID ".concat(virtualSourceModuleId, " unloaded successfully."));
                    virtualSourceModuleId = null;
                    _a.label = 3;
                case 3:
                    if (!virtualSinkModuleId) return [3 /*break*/, 5];
                    return [4 /*yield*/, execAsync("pactl unload-module ".concat(virtualSinkModuleId))];
                case 4:
                    _a.sent();
                    console.log("Virtual sink with module ID ".concat(virtualSinkModuleId, " unloaded successfully."));
                    virtualSinkModuleId = null;
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_2 = _a.sent();
                    console.error("Error unloading virtual devices: ".concat(error_2));
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function cleanupAudioDevices() {
    return __awaiter(this, void 0, void 0, function () {
        var sinksList, sourcesList, sinkPattern, match, sourcePattern, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, , 10]);
                    return [4 /*yield*/, execAsync("pactl list short sinks")];
                case 1:
                    sinksList = (_a.sent()).stdout;
                    return [4 /*yield*/, execAsync("pactl list short sources")];
                case 2:
                    sourcesList = (_a.sent()).stdout;
                    sinkPattern = new RegExp("(\\d+)\\s+".concat(virtualSinkName), "g");
                    match = void 0;
                    _a.label = 3;
                case 3:
                    if (!((match = sinkPattern.exec(sinksList)) !== null)) return [3 /*break*/, 5];
                    return [4 /*yield*/, execAsync("pactl unload-module ".concat(match[1]))];
                case 4:
                    _a.sent();
                    console.log("Cleaned up lingering sink with ID: ".concat(match[1]));
                    return [3 /*break*/, 3];
                case 5:
                    sourcePattern = new RegExp("(\\d+)\\s+".concat(virtualSourceName), "g");
                    _a.label = 6;
                case 6:
                    if (!((match = sourcePattern.exec(sourcesList)) !== null)) return [3 /*break*/, 8];
                    return [4 /*yield*/, execAsync("pactl unload-module ".concat(match[1]))];
                case 7:
                    _a.sent();
                    console.log("Cleaned up lingering source with ID: ".concat(match[1]));
                    return [3 /*break*/, 6];
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_3 = _a.sent();
                    console.error("Error during cleanup: ".concat(error_3.message));
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
module.exports = { audioEffectsStart: audioEffectsStart, audioEffectsStop: audioEffectsStop, cleanupAudioDevices: cleanupAudioDevices };
//const loadSinkCommandOLD = `pactl load-module module-null-sink sink_name=${virtualSinkName} sink_properties=device.description=${virtualSinkDescription}`;
//pactl load-module module-null-sink sink_name=VirtualMic sink_properties=device.description=VirtualMic
//gst-launch-1.0 pulsesrc device="alsa_input.usb-Corsair_CORSAIR_VOID_ELITE_Wireless_Gaming_Dongle-00.mono-fallback" buffer-time=100000 ! audioconvert ! pitch pitch=1.25 ! pulsesink device=VirtualMic
//pactl load-module module-remap-source master=VirtualMic.monitor source_name=VirtualMicSource source_properties=device.description=VirtualMicSource
//# sourceMappingURL=audio-effects.js.map