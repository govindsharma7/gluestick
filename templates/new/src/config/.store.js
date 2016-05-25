/** DO NOT MODIFY **/
// The following lines create the store and properly sets up hot module replacement for reducers
import { createStore } from "gluestick-shared";
import middleware from "./redux-middleware";
export default function (reducersPath) {
  return function (httpClient) {
    return createStore(httpClient, () => require("../dreducers"));//, middleware, (cb) => module.hot && module.hot.accept(reducersPath, cb), !!module.hot);
  }
}

