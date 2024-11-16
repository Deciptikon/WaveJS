import { setBlock } from "./functionMatrix.js";

function baseGrid(
  step, //шаг сетки (в клетках)
  shift, //сдвиг сетки (в клетках)
  maxIndex, //количество шагов
  buffer, //буфер сетки
  modelFunc, //callback-function
  data,
  geometry,
  support,
  resez
) {
  let [W, H] = geometry;
  let maxIndexX = maxIndex;
  let maxIndexY = maxIndex;

  for (let i = 0; i < maxIndexY; i++) {
    let y = i * step + shift.y;
    if (y >= H) {
      maxIndexY = i;
    }
    for (let j = 0; j < maxIndexX; j++) {
      let x = j * step + shift.x;
      if (x >= W) {
        maxIndexX = j;
      }

      const val = modelFunc(x, y, data, geometry, support, resez);
      setBlock(y, x, val, step, W, H, buffer);
    }
  }
}

export function firstGrid(
  modelFunc,
  step,
  buffer,
  data,
  geometry,
  support,
  resez
) {
  baseGrid(
    step,
    { x: 0, y: 0 },
    1,
    buffer,
    modelFunc,
    data,
    geometry,
    support,
    resez
  );
}

export function nextGrid(
  modelFunc,
  step,
  maxIndex,
  buffer,
  data,
  geometry,
  support,
  resez
) {
  // shift X
  baseGrid(
    step,
    { x: step, y: 0 },
    maxIndex,
    buffer,
    modelFunc,
    data,
    geometry,
    support,
    resez
  );

  // shift Y
  baseGrid(
    step,
    { x: 0, y: step },
    maxIndex,
    buffer,
    modelFunc,
    data,
    geometry,
    support,
    resez
  );

  // shift XY
  baseGrid(
    step,
    { x: step, y: step },
    maxIndex,
    buffer,
    modelFunc,
    data,
    geometry,
    support,
    resez
  );
}
