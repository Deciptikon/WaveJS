import { model } from "./functionModel.js";
import { nextGrid } from "./functionGridCoord.js";

self.onmessage = (event) => {
  let [buffer, globalStep, globalSizeGrid, params] = event.data;
  let [data, geometry, support, resez] = params;

  nextGrid(
    model,
    globalStep,
    globalSizeGrid,
    buffer,
    data,
    geometry,
    support,
    resez
  );

  self.postMessage(buffer);
};
