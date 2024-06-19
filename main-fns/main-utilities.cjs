const { dialog } = require('electron');
const fs = require("fs");
const { exec, execSync } = require("child_process");
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
    type: 'info',
    title: 'Information',
    buttons: ['OK'],
    message: 'No message provided',
    detail: ''
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

  console.log(`system display between x11 or wayland: ${sessionType}`)
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
//check if pulse audio or pipewire is being used TODO:
////////////////////////////////////////////////////////



///////////////////////////////////////////////////
// install dependencies
///////////////////////////////////////////////////
async function installDependencies() {
  //[ pulseaudio and pulseaudio-utils ]
  let dependencies = [ //TODO:  "wmctrl","ydotool", "xdotool"
    "ffmpeg",
    "gstreamer1.0-tools",
    "gstreamer1.0-plugins-base",
    "gstreamer1.0-plugins-good",
    "gstreamer1.0-plugins-bad",
    "gstreamer1.0-plugins-ugly",
    "v4l2loopback-dkms",
    "v4l2loopback-utils"   
  ];

  let installCommands = [];

  if (fs.existsSync("/usr/bin/apt")) { // Debian, Ubuntu, etc.
    installCommands = dependencies.map((dep) => `apt install -y ${dep}`);
  } else if (fs.existsSync("/usr/bin/dnf")) { // Fedora, RHEL, etc.
    installCommands = dependencies.map((dep) => `dnf install -y ${dep}`);
  } else if (fs.existsSync("/usr/bin/yum")) { // old Fedora, RHEL, etc.
    installCommands = dependencies.map((dep) => `yum install -y ${dep}`);
  } else if (fs.existsSync("/usr/bin/pacman")) { // Arch Linux, Manjaro, etc.
    installCommands = dependencies.map((dep) => `pacman -S --noconfirm ${dep}`);
  } else if (fs.existsSync("/usr/bin/zypper")) { // openSUSE
    installCommands = dependencies.map((dep) => `zypper install -y ${dep}`);
  } else if (fs.existsSync("/usr/bin/xbps-install")) { // Void Linux
    installCommands = dependencies.map((dep) => `xbps-install -y ${dep}`);
  } else {
    console.error("Unsupported package manager or Linux distribution.");
    await showDialog({
      type: 'error',
      title: 'Unsupported package manager',
      message: `Since this system package manager is not supported install:\n ${dependencies} `,
      buttons: ['OK'],
      defaultId: 0
    });
  
    return { success: false, canceled: false };
  }

  const result = await showDialog({
    type: 'question',
    title: 'Install Dependencies?',
    message: `About to install ${dependencies.length} dependencies (permissions asked separately):\n ${dependencies.join(', ')} `,
    buttons: ['Cancel', 'OK'],
    defaultId: 1,
    cancelId: 0
  });

  if (result.response === 0) { // Check if Cancel was clicked
    console.log(`Dependency installation canceled by user`)
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
        type: 'error',
        title: 'Error installing dependency',
        message: `Attempted: ${cmd},\n Error: ${error.message}`,
        buttons: ['OK'],
      })

      failureCount += 1;      
      console.error(`Error during the installation of ${cmd}: ${error}`);
    }
  }

  return {
    success: failureCount < dependencies.length,
    canceled: false,
    failures: failureCount,
    successes: dependencies.length - failureCount
  };
}



module.exports = {
  myWriteFileSync,
  systemX11orWayland,
  installDependencies,
  showDialog
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
