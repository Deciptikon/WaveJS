export class GridCoordHandler {
  constructor(maxH, maxW, context, centerHW) {
    this.maxH = maxH; //максимальная высота
    this.maxW = maxW; //максимальная ширина

    let exp2 = Math.ceil(Math.log2(Math.max(maxH, maxW))); //бинарный масштаб сетки
    this.step = Math.pow(2, exp2); //текущий шаг

    this.sizeGrid = 1;
    this.context = context;
    [this.centerY, this.centerX] = centerHW;
  }

  updateGrid() {
    this.step /= 2;

    if (this.step < 1) {
      this.step = 1;
      return false;
    }
    this.sizeGrid *= 2;

    return true;
  }

  getStep() {
    return this.step;
  }

  isFinish() {
    return this.step <= 1 ? true : false;
  }

  baseDrawGrid(
    step,
    shift,
    maxIndex,
    modelFunc,
    data,
    geometry,
    support,
    resez
  ) {
    let maxIndexX = maxIndex;
    let maxIndexY = maxIndex;

    for (let i = 0; i < maxIndexY; i++) {
      let y = i * step + shift.y;
      if (y >= this.maxH) {
        maxIndexY = i;
      }
      for (let j = 0; j < maxIndexX; j++) {
        let x = j * step + shift.x;
        if (x >= this.maxW) {
          maxIndexX = j;
        }

        let [canvasWidth, canvasHeight] = geometry;
        const color = modelFunc(x, y, data, geometry, support, resez);

        this.context.fillStyle = color;
        this.context.fillRect(
          this.centerX - canvasWidth / 2 + x,
          this.centerY - canvasHeight / 2 + y,
          step,
          step
        );
      }
    }
  }

  firstDrawGrid(modelFunc, data, geometry, support, resez) {
    this.baseDrawGrid(
      this.step,
      { x: 0, y: 0 },
      1,
      modelFunc,
      data,
      geometry,
      support,
      resez
    );
  }

  nextDrawGrid(modelFunc, data, geometry, support, resez) {
    // shift X
    this.baseDrawGrid(
      this.step,
      { x: this.step, y: 0 },
      this.sizeGrid,
      modelFunc,
      data,
      geometry,
      support,
      resez
    );

    // shift Y
    this.baseDrawGrid(
      this.step,
      { x: 0, y: this.step },
      this.sizeGrid,
      modelFunc,
      data,
      geometry,
      support,
      resez
    );

    // shift XY
    this.baseDrawGrid(
      this.step,
      { x: this.step, y: this.step },
      this.sizeGrid,
      modelFunc,
      data,
      geometry,
      support,
      resez
    );
  }
}
