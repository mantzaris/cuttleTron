const { exec } = require("child_process");
const util = require("util");
const execAsync = util.promisify(exec);

async function getSinkList() {
  try {
    const result = await execAsync("pactl list sinks | grep -e 'Name:' -e 'Description:' -e 'Monitor Source:'");
    const stdout = result.stdout;
    // Parse the stdout to create a structured list of sinks
    const lines = stdout.split("\n");
    const sinks = [];
    let currentSink = {};

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("Name:")) {
        currentSink.name = trimmedLine.split("Name:")[1].trim();
      } else if (trimmedLine.startsWith("Description:")) {
        currentSink.description = trimmedLine.split("Description:")[1].trim();
      } else if (trimmedLine.startsWith("Monitor Source:")) {
        currentSink.monitorSource = trimmedLine.split("Monitor Source:")[1].trim();
        sinks.push(currentSink);
        currentSink = {};
      }
    });
    //console.log(sinks);
    return sinks;
  } catch (error) {
    console.error(`getSinks exec error: ${error}`);
    throw error; // This will reject the promise returned by ipcMain.handle
  }
}

module.exports = {
  getSinkList,
};
