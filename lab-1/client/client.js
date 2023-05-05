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
      alias: "u",
      describe: "Defines body of request.",
      type: "string",
    });
  })
  .help().argv;

const METHOD = argv.m || argv.method;
const URL = argv.u || argv.url;
const TEMPLATE_PATH = argv.t || argv.template;
const RESOURCE_PATH = argv.r || argv.resource;
const TO_SAVE = argv.s || argv.tosave ? argv.s || argv.tosave : false;
const TO_PRINT = argv.l || argv.toprint ? argv.l || argv.toprint : true;
const CONTENT_TYPE = argv.q || argv.contenttype;
const CONTENT_LENGTH = argv.w || argv.contentlength;
const AUTHORIZATION = argv.a || argv.authorization;
const PLAIN_BODY = argv.u || argv.plainbody;

if (!TEMPLATE_PATH && (!METHOD || !URL)) {
  console.log("Not enough data to perform request.");
}

if (METHOD === "POST" && (!RESOURCE_PATH || !PLAIN_BODY)) {
  console.log("Trying to post empty information on server. Denying request.");
}

const HEADERS = form_headers_of_request(
  CONTENT_TYPE,
  CONTENT_LENGTH,
  AUTHORIZATION
);

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

if (!METHOD || !ALL_HTTP_METHODS.includes(METHOD)) {
  console.log("Given method is not supported by HTTP protocol.");
}

// add support for template requests...

tryToSendRequest(URL, METHOD, PLAIN_BODY);

async function tryToSendRequest(url, method, body) {
  try {
    let response = undefined;
    if (body) {
      response = await fetch(url, {
        method: method,
      });
    } else {
      response = await fetch(url, {
        method: method,
        body: body,
      });
    }

    const information = await response.text();
    console.log(TO_SAVE);
    if (TO_PRINT) {
      console.log(`Client received information: ${information}`);
    } else if (TO_SAVE) {
      fs.writeFileSync(`./saved/${url}-${method}`, information);
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
