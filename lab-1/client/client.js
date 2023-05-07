import yargs from "yargs";
import fs from "fs";

const argv = yargs(process.argv.slice(2))
  .command("template", true, (yargs) => {
    yargs.positional("template_path", {
      alias: "t",
      describe:
        "Path to request template file. Data from file is created to do request.",
      type: "string",
    });
  })
  .command("url", true, (yargs) => {
    yargs.positional("url_path", {
      alias: "u",
      describe: "Path to resource that client wants to access.",
      type: "string",
    });
  })
  .command("method", true, (yargs) => {
    yargs.positional("type_of_method", {
      describe: "Method that will send to server.",
      alias: "m",
      type: "string",
    });
  })
  .command("resource", true, (yargs) => {
    yargs.positional("resource_to_send_path", {
      alias: "r",
      describe: "Path to resource that client wants to send.",
      type: "string",
    });
  })
  .command("tosave", true, (yargs) => {
    yargs.positional("tosave_value", {
      alias: "s",
      describe:
        "Enables saving information that client potentially going to receive from server. Disabled by default.",
      type: "boolean",
    });
  })
  .command("toprint", true, (yargs) => {
    yargs.positional("toprint_value", {
      alias: "l",
      describe:
        "Enables printing information that client potentially going to receive from server. Enabled by default.",
      type: "boolean",
    });
  })
  .command("contenttype", true, (yargs) => {
    yargs.positional("contenttype_value", {
      alias: "q",
      describe: "Defines content-type header",
      type: "string",
    });
  })
  .command("contentlength", true, (yargs) => {
    yargs.positional("contentlength_value", {
      alias: "w",
      describe: "Defines content-length header",
      type: "string",
    });
  })
  .command("authorization", true, (yargs) => {
    yargs.positional("authorization_value", {
      alias: "a",
      describe: "Defines authorization header",
      type: "string",
    });
  })
  .command("plainbody", true, (yargs) => {
    yargs.positional("plainbody-text", {
      alias: "p",
      describe: "Defines boplainbodydy of request.",
      type: "string",
    });
  })
  .command("filename_tosave", true, (yargs) => {
    yargs.positional("filepath_tosave", {
      alias: "j",
      describe: "filename",
      type: "string",
    });
  })
  .help().argv;

var METHOD = argv.m || argv.method;
var URL = argv.u || argv.url;
var TEMPLATE_PATH = argv.t || argv.template;
var RESOURCE_PATH = argv.r || argv.resource;
var TO_SAVE = argv.s || argv.tosave ? argv.s || argv.tosave : false;
var TO_PRINT = argv.l || argv.toprint ? argv.l || argv.toprint : true;
var CONTENT_TYPE = argv.q || argv.contenttype;
var CONTENT_LENGTH = argv.w || argv.contentlength;
var AUTHORIZATION = argv.a || argv.authorization;
var PLAIN_BODY = argv.p || argv.plainbody;
var FILENAME = argv.j || argv.filepath_tosave;

function main() {
  const HEADERS = form_headers_of_request(
    CONTENT_TYPE,
    CONTENT_LENGTH,
    AUTHORIZATION
  );

  // add support for template requests...

  // two flows: request from template and from command line
  if (TEMPLATE_PATH) {
    // template request flow
    try {
      const json = JSON.parse(fs.readFileSync(TEMPLATE_PATH));

      tryToSendRequest(
        json["url"],
        json["method"],
        json["body"],
        json["headers"]
      );
    } catch (err) {
      console.log(err);
    }
  } else if (RESOURCE_PATH) {
    // retrieve body from resource, also determine content type headers
    try {
      const body = fs.readFileSync(RESOURCE_PATH, { encoding: "utf-8" });
      tryToSendRequest(URL, METHOD, body, HEADERS);
    } catch (err) {
      console.log(err);
    }
  } else if (PLAIN_BODY) {
    try {
      tryToSendRequest(URL, METHOD, PLAIN_BODY, HEADERS);
    } catch (err) {
      console.log(err);
    }
  } else {
    tryToSendRequest(URL, METHOD, undefined, HEADERS);
  }
}

// tryToSendRequest(URL, METHOD, PLAIN_BODY, HEADERS);

async function tryToSendRequest(url, method, body, headers) {
  if (!url || !method) {
    console.log(
      "Not enough data to perform request. Url or method is undefined."
    );
    return;
  }

  if (method === "POST" && !body) {
    console.log("Trying to post empty information on server. Denying request.");
    return;
  }
  // add headers to request
  const ALL_HTTP_METHODS = [
    "CONNECT",
    "DELETE",
    "GET",
    "HEAD",
    "OPTIONS",
    "POST",
    "PUT",
    "TRACE",
  ];

  if (!method || !ALL_HTTP_METHODS.includes(method)) {
    console.log("Given method is not supported by HTTP protocol.");
  }

  try {
    let response = undefined;
    if (!body) {
      response = await fetch(url, {
        method: method,
        headers: headers,
      });
    } else {
      response = await fetch(url, {
        method: method,
        headers: headers,
        body: body,
      });
    }

    const information = await response.text();
    const statusCode = response.status;
    const message = response.statusText;

    console.log(
      `Request is finished with status code ${statusCode}.\nMessage: ${message}`
    );
    if (TO_PRINT) {
      console.log(`Client received information: ${information}`);
    }

    if (TO_SAVE && FILENAME) {
      const [_, fileExtension] = FILENAME.split(".");
      console.log(fileExtension);
      if (
        fileExtension === "png" ||
        fileExtension === "xml" ||
        fileExtension === "svg"
      ) {
        // const blob = await convertBase64ToImage(fileExtension);
        fs.writeFileSync(`./saved/${FILENAME}`, information, {
          flag: "w+",
        });

      } else {
        fs.writeFileSync(`./saved/${FILENAME}`, information, {
          flag: "w+",
        });
      }
    }
  } catch (err) {
    console.log(err);
  }
}

function form_headers_of_request(content_type, content_length, authorization) {
  const headers = new Headers();
  if (content_type) {
    headers.append("Content-Type", content_type);
  }
  if (content_length) {
    headers.append("Content-Length", content_length);
  }
  if (authorization) {
    headers.append("Authorization", authorization);
  }

  return headers;
}

main();
