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
  // logger(`Processed sockets of request: ${socket}`);

  let body = [];
  request
    .on("error", (err) => {
      logger(err);
    })
    .on("data", (chunk) => {
      body.push(chunk);
    })
    .on("end", () => {
      body = Buffer.concat(body).toString();
      logger(`Processed body of request: ${body}`);

      logger(`Begin to form response for ${method} request`);
      try {
        if (method === "GET") {
          console.log("get flow");
        } else if (method === "POST") {
          console.log("post flow");
        } else if (method === "OPTIONS") {
          response.writeHead(200, {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            Allow: "GET, POST, OPTIONS",
            Server: "nodejs",
          });

          response.end("Status code: 200\nAllow: GET, POST, OPTIONS");
          logger(`Successfully handled ${method} request.`);
        } else {
          logger(
            `Received unsupported method ${method}. Forming error response to client.`
          );

          response.writeHead(405, {
            Allow: "GET, POST, OPTIONS",
            "Content-Type":
              "text/plain, text/css, text/html, image/svg+xml, application/ecmascript, image/png",
            "Cache-Control": "no-cache",
          });
          response.end("Unsupported HTTP method");
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
    });
});

server.listen(PORT, HOST, () => {
  logger(`Server is up and running on http://${HOST}:${PORT}`);
});
