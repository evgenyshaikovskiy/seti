export function determineContentType(fileExtension) {
  switch (fileExtension) {
    case "css":
    case "html":
      return `text/${fileExtension}`;
    case "txt":
      return `text/plain`;
    case "svg":
    case "xml":
      return `image/svg+xml`;
    case "json":
    case "js":
      return `application/${fileExtension}`;
    case "png":
      return "image/png";
    default:
      return undefined;
  }
}
