/////////////////////////////////////////////////////////////////////////////////////////////////////////
// stream maskcam
// sudo modprobe -r v4l2loopback; sudo modprobe v4l2loopback video_nr=54 card_label="cuttleTron"
////////////////////////////////////////////////////////////////////////////////////////////////////////
const { dialog } = require("electron");
const { exec, execSync, spawn } = require("child_process");
const fs = require("fs");
const { promisify } = require("util");
const execAsync = promisify(exec);
const sudo = require("sudo-prompt");
const sudoExecAsync = promisify(sudo.exec);

let ffmpegProcess = null;
let videoDevIdNum = null;

//wmctrl -l to get the ids in hex
// xwininfo -id  0x4600002: to get the dimensions and position for ffmpeg
// ffmpeg -probesize 10M -analyzeduration 10M -f x11grab -framerate 30 -video_size 1280x720 -i :0.0+2582,491 -vf "hflip" -f v4l2 -vcodec rawvideo -pix_fmt yuv420p /dev/video12
// const ffmpegCommand = `ffmpeg -probesize 10M -analyzeduration 10M -f x11grab -framerate 30 -video_size 1280x720 -i :0.0+2582,491 -vf "hflip" -f v4l2 -vcodec rawvideo -pix_fmt yuv420p /dev/video${videoDevIdNum}`;
async function streamMaskcamToDevice(
  maskcamWindowTitle,
  maskcamWinIdHex,
  X11orWayland
) {
  try {
    console.log("Starting device creation and streaming process");
    await createMaskcamVideoDevice(maskcamWindowTitle); // set the global device ID
  } catch (error) {
    console.error(
      `Error in streamMaskcamToDevice trying to set the maskcam video device and ID: ${error}`
    );
  }

  console.log(`maskcam.cjs X11orWayland = ${X11orWayland}`);

  let ffmpegCommand;
  let ffmpegArgs;

  if (X11orWayland == "x11") {
    const windowInfoOutput = await getX11WindowInfo(maskcamWinIdHex);
    if (!windowInfoOutput) {
      console.error("Could not get window information.");
      return;
    }

    console.log("windowInfoOutput", windowInfoOutput);

    const windowInfo = parseX11WindowInfo(windowInfoOutput);
    if (!windowInfo) {
      console.error("Could not parse window dimensions or position.");
      return;
    }

    console.log("windowInfo", windowInfo);

    const { width, height, x, y } = windowInfo;

    ffmpegCommand = `ffmpeg`;
    ffmpegArgs = [
      "-loglevel",
      "error",
      "-probesize",
      "10M",
      "-analyzeduration",
      "10M",
      "-f",
      "x11grab",
      "-framerate",
      "30",
      "-video_size",
      `${width}x${height}`,
      "-i",
      `:0.0+${x},${y}`,
      "-vf",
      "hflip",
      "-f",
      "v4l2",
      "-vcodec",
      "rawvideo",
      "-pix_fmt",
      "yuv420p",
      `/dev/video${videoDevIdNum}`,
    ];
  } else {
    // * Wayland
    dialog
      .showMessageBox({
        type: "info",
        title: "Info to stream maskcam on Wayland",
        buttons: ["OK"],
        message:
          "Auto-stream only for X11. On Wayland, follow these steps to set up OBS Studio:\n\n" +
          "1. Open OBS Studio (eg. cmd 'obs').\n" +
          "2. In 'Scenes', click '+' and name it 'cuttletronScene'.\n" +
          "3. In 'Sources', click '+' and select 'Window Capture (Pipewire)'.\n" +
          "4. Choose the window 'cuttleTronMaskcam' and click OK.\n" +
          "5. In 'Controls', click the settings button beside 'Start Virtual Camera'.\n" +
          "6. Set Output Type to 'Scene' and Output Selection to 'cuttletronScene'.\n" +
          "7. Now right-click on the video preview, select 'Transform', and flip to correct the orientation.\n" +
          "8. Click 'Start Virtual Camera'." +
          `Should stream to virtual device: /dev/video${videoDevIdNum}`,
        detail: "",
      })
      .then(() => {
        console.log(
          "user needs to connect window output to virtual video device"
        );
      });
  }

  try {
    if (!videoDevIdNum) {
      console.error(
        "No video device ID returned. Exiting the streaming process."
      );
      return;
    }

    // const output = execSync("v4l2-ctl --list-devices").toString();
    const { stdout: output } = await execAsync("v4l2-ctl --list-devices"); //.toString();
    console.log(
      `in streamMaskcamToDevice, v4l2-ctl --list-devices = ${output}`
    );

    if (X11orWayland == "x11") {
      console.log("prior to spawning ffmpeg command");
      console.log(`Using device: /dev/video${videoDevIdNum}`);
      console.log(`Executing ffmpeg command: ffmpeg ${ffmpegArgs.join(" ")}`);

      ffmpegProcess = spawn(ffmpegCommand, ffmpegArgs);
      console.log("qux");
      ffmpegProcess.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
      });

      ffmpegProcess.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
      });

      ffmpegProcess.on("close", (code) => {
        console.log(`FFmpeg process exited with code ${code}`);
        ffmpegProcess = null;
      });
    } //wayland is handled by user setting up OBS
  } catch (error) {
    console.error(`Error during ffmpeg process spawning: ${error}`);
  }
}

//https://github.com/umlaeute/v4l2loopback?tab=readme-ov-file#dynamic-device-management
async function createMaskcamVideoDevice(maskcamWindowTitle) {
  // let output = execSync("v4l2-ctl --list-devices").toString();
  let { stdout: output } = await execAsync("v4l2-ctl --list-devices"); //.toString(); //TODO: needs toString?
  console.log(
    `in createMaskcamVideoDevice 1, v4l2-ctl --list-devices = ${output}`
  );

  // Generating a random device number between 30 and 60
  videoDevIdNum = Math.floor(Math.random() * (61 - 30) + 30);
  const command = `modprobe -r v4l2loopback && modprobe v4l2loopback exclusive_caps=1 video_nr=${videoDevIdNum} card_label="${maskcamWindowTitle}"`;

  try {
    // Executing the combined command with sudo
    await sudoExecAsync(command, { name: "cuttleTron" });

    console.log(
      `Device /dev/video${videoDevIdNum} created successfully with label ${maskcamWindowTitle}.`
    );

    // output = execSync("v4l2-ctl --list-devices").toString();
    ({ stdout: output } = await execAsync("v4l2-ctl --list-devices")); //.toString(); //TODO:

    console.log(
      `in createMaskcamVideoDevice 2, v4l2-ctl --list-devices = ${output}`
    );

    return videoDevIdNum;
  } catch (error) {
    console.error(`Error in creating video device: ${error}`);
    videoDevIdNum = null;
    return null;
  }
}

async function stopMaskcamStream(isCleanupInitiated) {
  // Handle closing the ffmpeg process when your application exits or when needed
  if (ffmpegProcess) {
    console.log("Terminating maskcam stream process...");
    ffmpegProcess.kill("SIGTERM"); //SIGINT || SIGKILL
    ffmpegProcess = null;
  }

  if (isCleanupInitiated) return isCleanupInitiated;

  console.log("Removing all v4l2loopback devices...");

  try {
    const options = { name: "cuttleTron" };
    const command = "modprobe -r v4l2loopback";
    const result = await sudoExecAsync(command, options);

    console.log("All v4l2loopback devices removed successfully:", result);
    isCleanupInitiated = true;
    return isCleanupInitiated;
  } catch (error) {
    console.error(`Failed to remove v4l2loopback devices: ${error}`);
    return isCleanupInitiated;
  }
}

function parseX11WindowInfo(xwininfoOutput) {
  const sizeRegex = /Width:\s*(\d+)\s+Height:\s*(\d+)/;
  const posRegex =
    /Absolute upper-left X:\s*(\d+)\s+Absolute upper-left Y:\s*(\d+)/;

  const sizeMatches = sizeRegex.exec(xwininfoOutput);
  const posMatches = posRegex.exec(xwininfoOutput);

  if (sizeMatches && posMatches) {
    return {
      width: parseInt(sizeMatches[1], 10),
      height: parseInt(sizeMatches[2], 10),
      x: parseInt(posMatches[1], 10),
      y: parseInt(posMatches[2], 10),
    };
  } else {
    console.error("Could not parse window information from xwininfo output.");
    return null;
  }
}

async function getX11WindowInfo(windowIdHex) {
  const command = `xwininfo -id ${windowIdHex}`;
  try {
    const { stdout } = await execAsync(command);
    return stdout;
  } catch (error) {
    console.error(`Error fetching window info: ${error}`);
    return null;
  }
}

module.exports = {
  stopMaskcamStream,
  streamMaskcamToDevice,
};
