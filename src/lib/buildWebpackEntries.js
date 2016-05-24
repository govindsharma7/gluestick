import fs from "fs-extra";
import path from "path";
import logger from "./logger";

const BASE_PATH = path.join(process.cwd(), "src", "config", ".entries");


export default function buildWebpackEntries (entryPoints={}) {
  const output = {};

  // Clean slate
  fs.removeSync(BASE_PATH);
  fs.ensureDirSync(BASE_PATH);

  Object.keys(entryPoints).forEach((key) => {
    const safeKey = convertURLToSafeFolderName(key);
    const entryPath = `${path.join(BASE_PATH, safeKey)}.js`;
    fs.outputFileSync(entryPath, getEntryPointContent(entryPoints, key, safeKey));
    output[key] = entryPath;
  });

  return output;
}

export function convertURLToSafeFolderName (url) {
  const output = url.replace(/\//g, "_");
  if (/\W/.test(output)) {
    logger.error(`Invalid baseURL provided as entrypoint: ${url}`);
    return;
  }
  return output;
}

export function getEntryPointContent (entryPoints, key, safeKey) {
  const routes = entryPoints[key].routes || `../routes/${safeKey}`;
  const reducers = entryPoints[key].reducers || `../../reducers/${safeKey}`;
  const index = entryPoints[key].index || "../../../Index.js";
  const output = `import routes as getRoutes from "${routes}";
import reducers from "${reducers}";

// Make sure that webpack considers new dependencies introduced in the Index
// file
import "${index}";
import config from "./application";
`;

  return output;
}

