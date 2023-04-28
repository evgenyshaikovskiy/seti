import { ServerResponse, createServer } from "http";
import yargs from "yargs";
import { createLogger } from "./utils/logger.js";
import { determineContentType } from "./utils/utils.js";
import fs from "fs";

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

  // no use to check content type if method is get
  if (method === "POST" || method === "GET") {
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
      if (method !== "GET" && headers["content-type"]) {
        logger(
          `Content type is  ${headers["content-type"]} is not supported. Sending 406 status code.`
        );
        response.writeHead(406, "Not acceptable");
        response.end(
          `${
            headers["content-type"]
          } is not acceptable. Try one of following: ${SUPPORTED_CONTENT_TYPES.join(
            ", "
          )}.`
        );
      } else {
        logger(
          "Content type for GET request is not specified and expected. Continue to process request."
        );
      }
    }
  }

  logger(`Begin to form response for ${method} request`);
  // flow without body
  try {
    if (method === "GET") {
      const [command, filePath] = url.split("=");
      logger(
        "Parsing GET request url, checking whether resource that was requested is exists."
      );

      if (
        command &&
        filePath &&
        command === "/?filePath" &&
        fs.existsSync(`./files/${filePath}`)
      ) {
        logger(
          "Url was correct and resource exists. Determining Content-Type of resource."
        );
        const [_, fileExtension] = filePath.split(".");

        const fullFilePath = `./files/${filePath}`;

        // if header already included oc
        const responseContentType = headers["content-type"]
          ? headers["content-type"]
          : determineContentType(fileExtension);

        if (
          responseContentType === "text/html" ||
          responseContentType === "text/css" ||
          responseContentType === "text/plain" ||
          responseContentType === "application/javascript" ||
          responseContentType === "image/svg+xml" ||
          responseContentType === "image/png"
        ) {
          logger(
            "Reading either html/css/plaintext/xml/svg/png or javascript file..."
          );
          const dataEncoded = fs.readFileSync(fullFilePath, "utf-8");
          logger("Writing headers to response...");
          response.writeHead(200, {
            "Content-Type": `${responseContentType}; charset=utf-8`,
            "Content-Length": Buffer.byteLength(dataEncoded),
          });
          logger("Sending data to client...");
          response.end(dataEncoded);
        } else if (responseContentType === "application/json") {
          logger("Parsing and encoding source server json file...");
          const jsonEncoded = JSON.parse(
            fs.readFileSync(fullFilePath, "utf-8")
          );
          logger("Writing headers to response...");
          response.writeHead(200, {
            "Content-Type": `${responseContentType}; charset=utf-8`,
            "Content-Length": Buffer.byteLength(JSON.stringify(jsonEncoded)),
          });
          response.end(JSON.stringify(jsonEncoded));
        }
      } else {
        logger(
          "Resource request tried to reach is not accessible, returning the 404 response code."
        );
        response.writeHead(404);
        response.end("Resource you trying to reach is not accessible.");
      }
    } else if (method === "OPTIONS") {
      response.writeHead(200, {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": `${SUPPORTED_HTTP_METHODS.join(", ")}`,
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
    }
  } catch (err) {
    response.writeHead(500);
    console.log(err);
    response.end("Internal server error");
    logger(
      `Something went wrong during execution on server, while processing ${method} request method.`
    );
  }

  let body = [];
  request
    .on("error", (err) => {
      logger(err);
    })
    .on("data", (chunk) => {
      // when body is passed, typically post request
      logger("Received body of request.");
      try {
        body.push(chunk);
        if (method === "POST") {
          response.writeHead(201);
          response.end();
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
