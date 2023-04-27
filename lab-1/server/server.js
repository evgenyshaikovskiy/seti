import { createServer } from 'http';
import yargs from 'yargs';
import fs from 'fs';
import path from 'path';

const argv = yargs(process.argv.slice(2))
  .command('verbose', true, (yargs) => {
    yargs.positional('verbose_option', {
      alias: 'v',
      describe: 'Enables console logging of server flow. Enabled by default.',
      type: 'boolean',
    });
  })
  .command('logging', true, (yargs) => {
    yargs.positional('logging_option', {
      alias: 'f',
      describe: 'Enables logging to file. Disabled by default',
      type: 'boolean',
    });
  })
  .command('port', true, (yargs) => {
    yargs.positional('port_number', {
      describe: 'Port number on which server is launched. By default is 8000.',
      type: 'number',
    });
  })
  .help().argv;

// const application values values
const PORT = Number.isInteger(argv.port) ? argv.port : 8000;
const HOST = 'localhost';
const IS_VERBOSE = argv.v || argv.verbose ? argv.v || argv.verbose : true;
const IS_LOGGING_ENABLED =
  argv.f || argv.logging ? argv.f || argv.logging : false;

const PATH_TO_LOG_FILE = './server-logs.txt';

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
    fs.writeFileSync(filePath, content + '\n', { flag: 'a' });
  } catch (err) {
    console.error(err);
  }
};

function createLogger(isVerbose, isLogging) {
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

const logger = createLogger(IS_VERBOSE, IS_LOGGING_ENABLED);

// server flow
const requestListener = function (req, res) {
  logger(
    'Server just received request. Processing request url, method, headers and body.'
  );

  const { headers, method, url } = req;
  logger(`Processed url of request: ${url}`);
  logger(`Processed method of request: ${method}`);
  logger(`Processed headers of request: ${headers}`);

  let body = [];
  req
    .on('error', (err) => {
      logger(err);
    })
    .on('data', (chunk) => {
      body.push(chunk);
    })
    .on('end', () => {
      body = Buffer.concat(body).toString();
      logger(`Processed body of request: ${body}`);

      res.end();
    });

  res.end();
};

const server = createServer(requestListener);
server.listen(PORT, HOST, () => {
  logger(`Server is up and running on http://${HOST}:${PORT}`);
});