//this module is responsible for reading and writiing to .data directory

//dependencies
const fs = require("fs");
const path = require("path");
const helpers = require("./helpers");

//create a container
const lib = {};

// Base directory of data folder
lib.baseDir = path.join(__dirname, "/../.data/");

/**
 *Creates a file in the directory provided, errors if file already exists
 * @param {string} dir Name of the folder/directory
 * @param {string} file Name of the file
 * @param {object} data Object data to write
 * @param {function} callback Callsback error in string
 */
lib.create = function (dir, file, data, callback) {
  // //fs.open is unable to create new dir
  // if (!fs.existsSync(lib.baseDir + dir)) {
  //   fs.mkdirSync(lib.baseDir + dir);
  // }
  // Open the file for writing
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "wx",
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        // Convert data to string
        var stringData = JSON.stringify(data);

        // Write to file and close it
        fs.writeFile(fileDescriptor, stringData, function (err) {
          if (!err) {
            fs.close(fileDescriptor, function (err) {
              if (!err) {
                callback(false);
              } else {
                callback("Error closing new file");
              }
            });
          } else {
            callback("Error writing to new file");
          }
        });
      } else {
        callback("Could not create new file, it may already exist");
      }
    }
  );
};

/**
 *Reads from file , errors if file doesn't exist
 * @param {string} dir Directory name to search on
 * @param {string} file Filename to be read
 * @param {function} callback Callsback error and data
 */
lib.read = function (dir, file, callback) {
  fs.readFile(lib.baseDir + dir + "/" + file + ".json", "utf8", (err, data) => {
    if (!err) {
      callback(false, helpers.parseJson(data));
    } else {
      callback(err, data);
    }
  });
};

/**
 *Updates the given file
 * @param {string} dir Directory name to look into
 * @param {string} file Filename to update
 * @param {object} data Data object
 * @param {function} callback Callsback error
 */
lib.update = function (dir, file, data, callback) {
  // Open the file for writing
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "r+",
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        // Convert data to string
        var stringData = JSON.stringify(data);

        // Truncate the file
        fs.ftruncate(fileDescriptor, function (err) {
          if (!err) {
            // Write to file and close it
            fs.writeFile(fileDescriptor, stringData, function (err) {
              if (!err) {
                fs.close(fileDescriptor, function (err) {
                  if (!err) {
                    callback(false);
                  } else {
                    callback("Error closing existing file");
                  }
                });
              } else {
                callback("Error writing to existing file");
              }
            });
          } else {
            callback("Error truncating file");
          }
        });
      } else {
        callback("Could not open file for updating, it may not exist yet");
      }
    }
  );
};

/**
 * Deletes a given file on the directory
 * @param {string} dirName Directory to look into
 * @param {string} fileName Filename to delete
 * @param {calback} callback Callsback any error or false
 */
lib.delete = (dirName, fileName, callback) => {
  fs.unlink(`${lib.baseDir}${dirName}/${fileName}.json`, (err) => {
    if (err) {
      callback("Error deleting the file");
    } else {
      callback(false);
    }
  });
};

/**
 *List out all filenames excluding ".json" from their name in an array
 * @param {string} dir Filename to lookup inside the baseDirectory
 * @param {function} callbackErrorAndData injects error and fileNames arrray into it
 */
lib.list = function (dir, callbackErrorAndData) {
  fs.readdir(`${lib.baseDir}${dir}/`, (error, data) => {
    if (!error && data && data.length > 0) {
      const trimmedFileNames = [];
      data.forEach((fileName) => {
        trimmedFileNames.push(fileName.replace(".json", ""));
      });
      callbackErrorAndData(false, trimmedFileNames);
    } else {
      callbackErrorAndData(error, data);
    }
  });
};

//export
module.exports = lib;
