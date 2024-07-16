const { dialog } = require("electron");
const fs = require("fs");
const path = require("path");
const { exec, spawn } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);
const sudo = require("sudo-prompt");
const sudoExecAsync = promisify(sudo.exec);

function myWriteFileSync(event, arg_obj) {
  let dataBuffer;

  // Check if encoding is provided in arg_obj
  if (arg_obj.encoding) {
    // If encoding is provided, use it to convert the data
    dataBuffer = Buffer.from(arg_obj.buffer, arg_obj.encoding);
  } else {
    // If no encoding is provided, assume the buffer is already in the correct format
    dataBuffer = Buffer.from(arg_obj.buffer);
  }

  return fs.writeFileSync(arg_obj.filePath, dataBuffer);
}

////////////////////////////////////
//dialog generic
////////////////////////////////////
async function showDialog(options) {
  const defaultOptions = {
    type: "info",
    title: "Information",
    buttons: ["OK"],
    message: "No message provided",
    detail: "",
  };

  const dialogOptions = { ...defaultOptions, ...options };
  return dialog.showMessageBox(dialogOptions);
}

///////////////////////////////////////////////////
// check for x11 or wayland
///////////////////////////////////////////////////
async function systemX11orWayland() {
  let sessionType = process.env.XDG_SESSION_TYPE;

  if (!sessionType) {
    if (process.env.WAYLAND_DISPLAY) {
      sessionType = "wayland";
    } else if (await checkX11Session()) {
      sessionType = "x11";
    } else {
      const command = `loginctl show-session $(loginctl | grep $(whoami) | awk '{print $1}') -p Type`;

      try {
        const { stdout } = await execAsync(command);
        sessionType = stdout.trim().split("=")[1];
      } catch (error) {
        console.error(`Error fetching session type with loginctl: ${error}`);
        sessionType = null; // Ensure sessionType is null if an error occurs
      }
    }
  }

  console.log(`system display between x11 or wayland: ${sessionType}`);
  return sessionType;
}

async function checkX11Session() {
  try {
    await execAsync("xdpyinfo");
    return true;
  } catch (error) {
    return false;
  }
}

////////////////////////////////////////////////////////
//?check if pulse audio or pipewire is being used
////////////////////////////////////////////////////////
async function systemPulseaudioOrPipewire() {
  try {
    //? pulse audio
    const { stdout: pulseAudioStdout } = await execAsync(
      "ps cax | grep pulseaudio"
    ).catch((e) => ({ stdout: "" }));
    if (pulseAudioStdout.includes("pulseaudio")) {
      console.log("pulseaudio detected");
      return "pulseaudio";
    }

    //? pipewire
    const { stdout: pipewireStdout } = await execAsync(
      "ps cax | grep pipewire"
    ).catch((e) => ({ stdout: "" }));
    if (pipewireStdout.includes("pipewire")) {
      console.log("pipewire detected");
      return "pipewire";
    }

    const { stdout: pulseService } = await execAsync(
      "systemctl is-active pulseaudio.service"
    ).catch((e) => ({ stdout: "inactive" }));
    if (pulseService.trim() === "active") {
      console.log("pulseaudio service is active");
      return "pulseaudio";
    }

    const { stdout: pipeService } = await execAsync(
      "systemctl is-active pipewire.service"
    ).catch((e) => ({ stdout: "inactive" }));
    if (pipeService.trim() === "active") {
      console.log("pipewire service is active");
      return "pipewire";
    }

    const pulseEnv = process.env.PULSE_SERVER;
    const pipeEnv = process.env.PIPEWIRE_MEDIA_SESSION;

    if (pulseEnv) {
      console.log("PulseAudio environment variable detected");
      return "pulseaudio";
    } else if (pipeEnv) {
      console.log("PipeWire environment variable detected");
      return "pipewire";
    }

    const { stdout: processList } = await execAsync("ps aux").catch((e) => ({
      stdout: "",
    }));

    if (processList.includes("pipewire")) {
      return "pipewire";
    } else if (processList.includes("pulseaudio")) {
      return "pulseaudio";
    }

    const { stdout: systemServices } = await execAsync(
      "systemctl --type=service --state=running"
    ).catch((e) => ({ stdout: "" }));
    const { stdout: userServices } = await execAsync(
      "systemctl --user --type=service --state=running"
    ).catch((e) => ({ stdout: "" }));

    // Search both outputs for relevant service information
    if (
      systemServices.includes("pipewire.service") ||
      userServices.includes("pipewire.service")
    ) {
      return "pipewire";
    } else if (
      systemServices.includes("pulseaudio.service") ||
      userServices.includes("pulseaudio.service")
    ) {
      return "pulseaudio";
    }

    console.log(" audio system unknown"); // Neither found, or unable to determine
    return "pipewire"; //default
  } catch (error) {
    console.error("Error checking audio system:", error);
  }
}

/////////////////////////////////////////////////////
// *for the gif creation from a set of images
/////////////////////////////////////////////////////
async function createGif(
  baseFilename,
  numDigits,
  startNumber,
  endNumber,
  FPS,
  TARGET_DIR
) {
  // const inputPattern = `${baseFilename}%0${numDigits}d.png`; // Assuming 4-digit numbering
  const inputPattern = path.join(
    TARGET_DIR,
    `${baseFilename}%0${numDigits}d.png`
  );
  console.log("Constructed file pattern:", inputPattern); // Log to verify

  const framesCount = endNumber - startNumber + 1;
  const outputPath = path.join(
    TARGET_DIR,
    `${baseFilename}${startNumber}to${endNumber}.gif`
  );
  console.log(`output path: ${outputPath}`);

  // Command arguments for `ffmpeg`
  const args = [
    "-framerate",
    String(FPS),
    "-start_number",
    String(startNumber),
    "-i",
    inputPattern,
    "-frames:v",
    String(framesCount),
    "-vf",
    `scale=640:-1:flags=lanczos,fps=${FPS}`,
    "-y",
    outputPath,
  ];

  // * fire and forget, approach, not used
  // const ffmpeg = spawn('ffmpeg', args);\
  // ffmpeg.stderr.on('data', (data) => {
  //   console.error(`stderr: ${data}`);
  // });
  // ffmpeg.on('close', (code) => {
  //   if (code !== 0) {
  //     console.error(`ffmpeg exited with code ${code}`);
  //   }
  // });
  // return outputPath;

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args);

    ffmpeg.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    ffmpeg.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(`GIF created successfully at ${outputPath}`);
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on("error", (error) => {
      reject(new Error(`Failed to start ffmpeg process: ${error.message}`));
    });
  });
}

///////////////////////////////////////////////////
// install dependencies
///////////////////////////////////////////////////
async function installDependencies() {
  //[ pulseaudio and pulseaudio-utils ]
  let dependencies = [
    //TODO:  "wmctrl","ydotool", "xdotool"
    "ffmpeg",
    "gstreamer1.0-tools",
    "gstreamer1.0-plugins-base",
    "gstreamer1.0-plugins-good",
    "gstreamer1.0-plugins-bad",
    "gstreamer1.0-plugins-ugly",
    "v4l2loopback-dkms",
    "v4l2loopback-utils",
  ];

  let installCommands = [];

  if (fs.existsSync("/usr/bin/apt")) {
    // Debian, Ubuntu, etc.
    installCommands = dependencies.map((dep) => `apt install -y ${dep}`);
  } else if (fs.existsSync("/usr/bin/dnf")) {
    // Fedora, RHEL, etc.
    installCommands = dependencies.map((dep) => `dnf install -y ${dep}`);
  } else if (fs.existsSync("/usr/bin/yum")) {
    // old Fedora, RHEL, etc.
    installCommands = dependencies.map((dep) => `yum install -y ${dep}`);
  } else if (fs.existsSync("/usr/bin/pacman")) {
    // Arch Linux, Manjaro, etc.
    installCommands = dependencies.map((dep) => `pacman -S --noconfirm ${dep}`);
  } else if (fs.existsSync("/usr/bin/zypper")) {
    // openSUSE
    installCommands = dependencies.map((dep) => `zypper install -y ${dep}`);
  } else if (fs.existsSync("/usr/bin/xbps-install")) {
    // Void Linux
    installCommands = dependencies.map((dep) => `xbps-install -y ${dep}`);
  } else {
    console.error("Unsupported package manager or Linux distribution.");
    await showDialog({
      type: "error",
      title: "Unsupported package manager",
      message: `Since this system package manager is not supported install:\n ${dependencies} `,
      buttons: ["OK"],
      defaultId: 0,
    });

    return { success: false, canceled: false };
  }

  const result = await showDialog({
    type: "question",
    title: "Install Dependencies?",
    message: `About to install ${
      dependencies.length
    } dependencies (permissions asked separately):\n ${dependencies.join(
      ", "
    )} `,
    buttons: ["Cancel", "OK"],
    defaultId: 1,
    cancelId: 0,
  });

  if (result.response === 0) {
    // Check if Cancel was clicked
    console.log(`Dependency installation canceled by user`);
    return { success: false, canceled: true };
  }

  let failureCount = 0;

  for (let cmd of installCommands) {
    console.log(`Installing ${cmd}`);
    try {
      const stdout = await sudoExecAsync(cmd, { name: `Cuttle Install` });
      console.log(`${cmd} installed successfully.`);
      console.log(stdout);
    } catch (error) {
      await showDialog({
        type: "error",
        title: "Error installing dependency",
        message: `Attempted: ${cmd},\n Error: ${error.message}`,
        buttons: ["OK"],
      });

      failureCount += 1;
      console.error(`Error during the installation of ${cmd}: ${error}`);
    }
  }

  return {
    success: failureCount < dependencies.length,
    canceled: false,
    failures: failureCount,
    successes: dependencies.length - failureCount,
  };
}

module.exports = {
  myWriteFileSync,
  systemX11orWayland,
  systemPulseaudioOrPipewire,
  installDependencies,
  showDialog,
  createGif,
};

// let installCommand = "";
// switch (packageManager) {
//   case "apt":
//     installCommand = `apt install -y ${dependencies.join(" ")}`;
//     break;
//   case "dnf":
//   case "yum": // Older Fedora, CentOS, and RHEL might use yum fall through on "dnf"
//     installCommand = `${packageManager} install -y ${dependencies.join(" ")}`;
//     break;
//   case "zypper": // For openSUSE
//     installCommand = `zypper install -y ${dependencies.join(" ")}`;
//     break;
//   case "pacman":
//     installCommand = `pacman -S --noconfirm ${dependencies.join(" ")}`;
//     break;
//   default:
//     console.error(`Unsupported package manager: ${packageManager}`);
//     return;
// }

// console.log(`installing dependencies: ${installCommand}`);

// try {
//   const stdout = await sudoExecAsync(installCommand, { name: "cuttleTron" });
//   console.log(`stdout: ${stdout}`);
// } catch (error) {
//   console.error(`Error during execution: ${error}`);
// }
