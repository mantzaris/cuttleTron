const fs = require("fs");

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

module.exports = {
  myWriteFileSync,
};
