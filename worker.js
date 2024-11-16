//importScripts('functionGridCoord.js');
//importScripts('functionModel.js');
import { model } from "./functionModel.js";
import { nextGrid } from "./functionGridCoord.js";

self.onmessage = (event) => {
  //let { buffer, params } = event.data;
  let [buffer, globalStep, globalSizeGrid, params] = event.data;
  let [data, geometry, support, resez] = params;
  console.log(`WORKER ARBEITET =${globalStep}`);
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

  // Отправляем изменённый буфер обратно
  self.postMessage(buffer);
};
