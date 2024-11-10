export class GridCoordHandler {
  constructor(maxH, maxW, context, centerHW) {
    this.maxH = maxH; //максимальная высота
    this.maxW = maxW; //максимальная ширина
    let exp2 = Math.ceil(Math.log2(Math.max(maxH, maxW))); //бинарный масштаб сетки
    this.step = Math.pow(2, exp2); //текущий шаг
    //this.grid = [{ x: 0, y: 0 }]; //начальная сетка
    //this.gridShift = [];

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
    console.log(this.sizeGrid);
    console.log("");

    //this.maxIndexH = Math.floor(maxH / this.step);
    //this.maxIndexW = Math.floor(maxW / this.step);

    //let gridShiftX = this.shiftGrid(this.grid, { x: this.step, y: 0 });
    //let gridShiftY = this.shiftGrid(this.grid, { x: 0, y: this.step });
    //let gridShiftXY = this.shiftGrid(this.grid, { x: this.step, y: this.step });

    //this.gridShift = [];
    //this.concatGrid(this.gridShift, gridShiftX, gridShiftY, gridShiftXY);
    //this.concatGrid(this.grid, this.gridShift);

    return true;
  }

  // сдвиг на нужную величину
  shiftGrid(grid, shift) {
    let gridShift = [];
    grid.forEach((point) => {
      let X = point.x + shift.x;
      let Y = point.y + shift.y;
      if (X < this.maxW && Y < this.maxH) {
        gridShift.push({ x: X, y: Y });
      }
    });
    return gridShift;
  }

  concatGrid(grid, ...arrays) {
    arrays.forEach((array) => {
      grid.push(...array);
    });
  }

  getGridShift() {
    return this.gridShift;
  }

  getGrid() {
    return this.grid;
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
      //console.log(`y = ${y}`);
      if (y >= this.maxH) {
        maxIndexY = i;
        console.log(`-->y    maxIndexY=${maxIndexY}  и maxIndexX=${maxIndexX}`);
        //continue;
      }
      for (let j = 0; j < maxIndexX; j++) {
        let x = j * step + shift.x;
        //console.log(`x = ${x}`);
        if (x >= this.maxW) {
          maxIndexX = j;
          console.log(
            `-->x    maxIndexY=${maxIndexY}  и maxIndexX=${maxIndexX}`
          );
          //continue;
        }

        let [canvasWidth, canvasHeight] = geometry;
        const color = modelFunc(x, y, data, geometry, support, resez);
        //console.log(`color = ${color}`);
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

  drawTestRectangle() {
    // Задаем красный цвет для заливки
    this.context.fillStyle = "red";
    // Рисуем прямоугольник в центре canvas
    this.context.fillRect(this.centerX - 50, this.centerY - 25, 100, 50);
    // Прямоугольник 100x50, центрированный по `centerX`, `centerY`
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
