import fs from "fs-extra";
import path from "path";

const CWD = process.cwd();
const BASE_PATH = path.join(CWD, "src", "config", ".entries");


export default function buildWebpackEntries (entryPoints={}, isProduction) {
  const output = {};

  // Clean slate
  fs.removeSync(BASE_PATH);
  fs.ensureDirSync(BASE_PATH);

  Object.keys(entryPoints).forEach((key) => {
    const name = entryPoints[key].name.replace(/\W/, "-");
    const entryPath = `${path.join(BASE_PATH, name)}.js`;
    fs.outputFileSync(entryPath, getEntryPointContent(entryPoints, key, name));
    output[key] = [entryPath];

    // Include hot middleware in development mode only
    if (!isProduction) {
      output[key].unshift("webpack-hot-middleware/client");
    }
  });

  return output;
}

export function getEntryPointContent (entryPoints, key, safeKey) {
  const routesPath = entryPoints[key].routes || path.join(CWD, "src", "config", "routes", safeKey);
  const reducersPath = entryPoints[key].routes || path.join(CWD, "src", "reducers", safeKey);
  const indexPath = entryPoints[key].index || path.join(CWD, "Index");
  const reduxMiddlewarePath = path.join(CWD, "src", "config", "redux-middleware");
  const config = path.join(CWD, "src", "config", "application");
  const mainEntry = path.join(CWD, "src", "config", ".entry");
  const output = `import getRoutes from "${routesPath}";

// Make sure that webpack considers new dependencies introduced in the Index
// file
import "${indexPath}";
import config from "${config}";
import Entry from "${mainEntry}";
import { createStore } from "gluestick-shared";
import middleware from "${reduxMiddlewarePath}";

function getStore (httpClient) {
  return createStore(httpClient, () => require("${reducersPath}"), middleware, (cb) => module.hot && module.hot.accept("${reducersPath}", cb), !!module.hot);
}

Entry.start(getRoutes, getStore);
`;

  return output;
}

