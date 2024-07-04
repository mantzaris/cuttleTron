const { ipcRenderer } = window.electron;
const { joinPath, getTargetDir } = window.nodeModules;

export function generateRandomString(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function fileNameCollisionCheck(newFilename, extensions = [""]) {
  if (!extensions.includes("")) extensions.push(""); // Allow empty extensions (no extension

  const targetDir = await getTargetDir();

  for (const extension of extensions) {
    const targetPath = await joinPath([targetDir, newFilename + extension]);
    const pathExists = await ipcRenderer.invoke("existsSync", targetPath);
    if (pathExists) return true;
  }

  return false;
}
