import fs from "fs";

const PATH_TO_LOG_FILE = "./server-logs.log";

// could be moved to utils
const removeFile = (filePath) => {
  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    // avoid empty catches
  }
};

const writeToFile = (filePath, content) => {
  try {
    fs.writeFileSync(filePath, content + "\n", { flag: "a" });
  } catch (err) {
    console.error(err);
  }
};

export function createLogger(isVerbose, isLogging) {
  // enclose values inside wrapper function
  const isVerboseHolder = isVerbose;
  const isLoggingHolder = isLogging;

  removeFile(PATH_TO_LOG_FILE);

  return function (message) {
    if (isVerboseHolder) {
      console.log(`log: ${message}`);
    }

    if (isLoggingHolder) {
      writeToFile(PATH_TO_LOG_FILE, message);
    }
  };
}