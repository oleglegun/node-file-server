const fs = require("fs");

function sendFile(path, res) {
  const fileStream = fs.createReadStream(path);

  fileStream.on("open", () => console.log(`<FILE_OPEN_SUCCESS>:\t ${path}`));

  fileStream.on("error", err => {
    if (err.code == "ENOENT") {
      console.log("<FILE_NOT_FOUND>:", path);
      res.writeHead(404, "Not Found");
      res.end();
    } else {
      console.log("<FILE_READ_ERROR>:", path);
      res.writeHead(500, "Internal Server Error");
      res.end();
    }
  });
  fileStream.on("data", data => {
    res.write(data);
  });

  fileStream.on("end", () => {
    // finish request
    res.end();
  });

  fileStream.on("close", () => console.log(`<FILE_CLOSE_SUCCESS>:\t`, path));
}

function deleteFile(path) {
  fs.unlink(path, err => {
    console.log("---", "executed");
    if (err) {
      return false;
    } else {
      return true;
    }
  });

  console.log("---", "returned");
}

function saveFile(readableStream) {}

exports.sendFile = sendFile;
exports.deleteFile = deleteFile;
exports.saveFile = saveFile;
