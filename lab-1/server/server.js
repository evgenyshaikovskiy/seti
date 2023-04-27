import { ServerResponse, createServer } from "http";
import yargs from "yargs";
import { createLogger } from "./utils/logger.js";

const argv = yargs(process.argv.slice(2))
  .command("verbose", true, (yargs) => {
    yargs.positional("verbose_option", {
      alias: "v",
      describe: "Enables console logging of server flow. Enabled by default.",
      type: "boolean",
    });
  })
  .command("logging", true, (yargs) => {
    yargs.positional("logging_option", {
      alias: "f",
      describe: "Enables logging to file. Disabled by default",
      type: "boolean",
    });
  })
  .command("port", true, (yargs) => {
    yargs.positional("port_number", {
      describe: "Port number on which server is launched. By default is 8000.",
      type: "number",
    });
  })
  .help().argv;

// const application values values
const PORT = Number.isInteger(argv.port) ? argv.port : 8000;
const HOST = "localhost";
const IS_VERBOSE = argv.v || argv.verbose ? argv.v || argv.verbose : true;
const IS_LOGGING_ENABLED =
  argv.f || argv.logging ? argv.f || argv.logging : false;

const SUPPORTED_CONTENT_TYPES = [
  "text/plain",
  "text/css",
  "text/html",
  "image/svg+xml",
  "application/json",
  "application/javascript",
  "image/png",
];
const SUPPORTED_HTTP_METHODS = ["GET", "POST", "OPTIONS"];

const logger = createLogger(IS_VERBOSE, IS_LOGGING_ENABLED);

const server = createServer((request, response) => {
  logger(
    "Server just received request. Processing request url, method, headers and body."
  );

  const { headers, method, url, socket } = request;
  // extract to other method later
  logger(`Processed url of request: ${url}`);
  logger(`Processed method of request: ${method}`);
  logger(
    `Processed Headers for request:
              Content-type: ${headers["content-type"]},
              Host: ${headers["host"]},
              Accept: ${headers["accept"]},
              From: ${headers["from"]}`
  );

  logger("Checking whether content-type header in request is correct...");
  // check, whether content-type header is correct
  let isContentTypeHeaderCorrect = headers["content-type"]
    ? SUPPORTED_CONTENT_TYPES.includes(headers["content-type"].toLowerCase())
    : false;
  if (isContentTypeHeaderCorrect) {
    logger(
      `Content type ${headers["content-type"]} is supported. Continue to process request.`
    );
  } else {
    response.writeHead(406, "Not acceptable");
    response.end(
      `${
        headers["content-type"]
      } is not acceptable. Try one of following: ${SUPPORTED_CONTENT_TYPES.join(
        ", "
      )}.`
    );
  }

  let body = [];
  request
    .on("error", (err) => {
      logger(err);
    })
    .on("data", (chunk) => {
      logger("Received body of request.");
      logger(`Begin to form response for ${method} request`);
      try {
        body.push(chunk);
        if (method === "GET") {
          response.writeHead(200);
          response.end();
        } else if (method === "POST") {
          response.writeHead(201);
          response.end();
        } else if (method === "OPTIONS") {
          response.writeHead(200, {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": `${SUPPORTED_HTTP_METHODS.join(
              ", "
            )}`,
            Allow: `${SUPPORTED_HTTP_METHODS.join(", ")}`,
            Server: "nodejs",
          });

          response.end(
            `Status code: 200\nAllow: ${SUPPORTED_HTTP_METHODS.join(", ")}`
          );

          logger(`Successfully handled ${method} request.`);
        } else {
          logger(
            `Received unsupported method ${method}. Forming error response to client.`
          );

          response.writeHead(405, {
            Allow: `${SUPPORTED_HTTP_METHODS.join(", ")}`,
            "Content-Type": `${SUPPORTED_CONTENT_TYPES.join(", ")}`,
            "Cache-Control": "no-cache",
          });
          response.end("Method not allowed");
          logger(`Successfully handled unsupported request ${method} method.`);
        }
      } catch (err) {
        response.writeHead(500);
        console.log(err);
        response.end("Internal server error");
        logger(
          `Something went wrong during execution on server, while processing ${method} request method.`
        );
      }
    })
    .on("end", () => {
      logger("Ended the request. Send the response to server.");
    });
});

server.listen(PORT, HOST, () => {
  logger(`Server is up and running on http://${HOST}:${PORT}`);
});
