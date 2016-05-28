import fs from "fs-extra";
import path from "path";
import getWebpackAdditions from "./getWebpackAdditions";
const { entryPoints: additionalEntryPoints } = getWebpackAdditions();

const CWD = process.cwd();
const BASE_PATH = path.join(CWD, "src", "config", ".entries");

export function getWebpackEntries () {
  const output = {};

  // setup default
  const entryPoints = {
    "/": {
      name: "main",
      routes: path.join(process.cwd(), "src", "config", "routes"),
      reducers: path.join(process.cwd(), "src", "reducers")
    },
    ...additionalEntryPoints
  };

  Object.keys(entryPoints).forEach((key) => {
    const entry = entryPoints[key];
    const fileName = entry.name.replace(/\W/, "-");
    output[key] = {
      ...entry,
      filePath: `${path.join(BASE_PATH, fileName)}.js`,
      routes: entry.routes || path.join(CWD, "src", "config", "routes", fileName),
      reducers: entry.reducers || path.join(CWD, "src", "reducers", fileName),
      index: entry.index || path.join(CWD, "Index")
    };
  });

  return output;
}


export default function buildWebpackEntries (isProduction) {
  const output = {};


  // Clean slate
  fs.removeSync(BASE_PATH);
  fs.ensureDirSync(BASE_PATH);

  const entries = getWebpackEntries();
  for (const key in entries) {
    const entry = entries[key];
    const { filePath } = entry;
    fs.outputFileSync(filePath, getEntryPointContent(entry));
    output[key] = [filePath];

    // Include hot middleware in development mode only
    if (!isProduction) {
      output[key].unshift("webpack-hot-middleware/client");
    }
  }

  return output;
}

export function getEntryPointContent (entry) {
  const { routes, index, reducers } = entry;
  const reduxMiddlewarePath = path.join(CWD, "src", "config", "redux-middleware");
  const config = path.join(CWD, "src", "config", "application");
  const mainEntry = path.join(CWD, "src", "config", ".entry");
  const output = `import getRoutes from "${routes}";

// Make sure that webpack considers new dependencies introduced in the Index
// file
import "${index}";
import config from "${config}";
import Entry from "${mainEntry}";
import { createStore } from "gluestick-shared";
import middleware from "${reduxMiddlewarePath}";

export function getStore (httpClient) {
  return createStore(httpClient, () => require("${reducers}"), middleware, (cb) => module.hot && module.hot.accept("${reducers}", cb), !!module.hot);
}

if (typeof window === "object") {
  Entry.start(getRoutes, getStore);
}
`;

  return output;
}

