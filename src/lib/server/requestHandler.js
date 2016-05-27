/*global webpackIsomorphicTools*/
import path from "path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { runBeforeRoutes, ROUTE_NAME_404_NOT_FOUND,
  prepareRoutesWithTransitionHooks, getHttpClient } from "gluestick-shared";
import { match, RouterContext } from "react-router";
import errorHandler from "./errorHandler";
import Body from "./Body";
import getHead from "./getHead";
import getWebpackAdditions from "../getWebpackAdditions";
const { entryPoints } = getWebpackAdditions();

import logger from "../logger";
import showHelpText, { MISSING_404_TEXT } from "../../lib/helpText";

process.on("unhandledRejection", (reason, promise) => {
  logger.error(reason, promise);
});

module.exports = async function (req, res) {
  try {

    // Forward all request headers from the browser into http requests made by
    // node
    const config = require(path.join(process.cwd(), "src", "config", "application")).default;

    const { Index, Entry, store, getRoutes } = getRenderRequirementsFromEntrypoints(req, config);

    const routes = prepareRoutesWithTransitionHooks(getRoutes(store));
    match({routes: routes, location: req.path}, async (error, redirectLocation, renderProps) => {
      try {
        if (error) {
          errorHandler(req, res, error);
        }
        else if (redirectLocation) {
          res.redirect(302, redirectLocation.pathname + redirectLocation.search);
        }
        else if (renderProps) {
          // If we have a matching route, set up a routing context so
          // that we render the proper page. On the client side, you
          // embed the router itself, on the server you embed a routing
          // context.
          // [https://github.com/rackt/react-router/blob/master/docs/guides/advanced/ServerRendering.md]
          await runBeforeRoutes(store, renderProps || {}, {isServer: true, request: req});
          const routerContext = createElement(RouterContext, renderProps);

          // grab the main component which is capable of loading routes
          // and hot loading them if in development mode
          const radiumConfig = { userAgent: req.headers["user-agent"] };
          const main = createElement(Entry, {store: store, routerContext: routerContext, config: config, radiumConfig: radiumConfig});

          // grab the react generated body stuff. This includes the
          // script tag that hooks up the client side react code.
          const body = createElement(Body, {html: renderToString(main), config: config, initialState: store.getState()});
          const head = getHead(config, webpackIsomorphicTools.assets()); // eslint-disable-line webpackIsomorphicTools

          if (renderProps.routes[renderProps.routes.length - 1].name === ROUTE_NAME_404_NOT_FOUND) {
            res.status(404);
          }
          else {
            res.status(200);
          }

          // Grab the html from the project which is stored in the root
          // folder named Index.js. Pass the body and the head to that
          // component. `head` includes stuff that we want the server to
          // always add inside the <head> tag.
          //
          // Bundle it all up into a string, add the doctype and deliver
          res.send("<!DOCTYPE html>\n" + renderToString(createElement(Index, {body: body, head: head})));
        }
        else {
          // This is only hit if there is no 404 handler in the react routes. A
          // not found handler is included by default in new projects.
          showHelpText(MISSING_404_TEXT);
          res.status(404).send("Not Found");
        }
      }
      catch (error) {
        errorHandler(req, res, error);
      }
    });
  }
  catch (error) {
    errorHandler(req, res, error);
  }
};

function getRenderRequirementsFromEntrypoints (req, config) {
  Object.keys(entryPoints).forEach(() => {

  });
  const httpClient = getHttpClient(config.httpClient, req);
  const Index = require(path.join(process.cwd(), "Index")).default;
  const Entry = require(path.join(process.cwd(), "src/config/.entry")).default;
  const store = require(path.join(process.cwd(), "src/config/.entry")).getStore(httpClient);
  const getRoutes = require(path.join(process.cwd(), "src/config/routes")).default;
  return {
    Index,
    Entry,
    store,
    getRoutes
  };
}

