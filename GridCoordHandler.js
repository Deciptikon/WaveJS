export class GridCoordHandler {
  constructor(maxH, maxW) {
    this.maxH = maxH; //максимальная высота
    this.maxW = maxW; //максимальная ширина
    let exp2 = Math.ceil(Math.log2(Math.max(maxH, maxW))); //бинарный масштаб сетки
    this.step = Math.pow(2, exp2); //текущий шаг
    this.grid = [{ x: 0, y: 0 }]; //начальная сетка
    this.gridShift = [];
  }

  updateGrid() {
    this.step /= 2;
    if (this.step < 1) {
      return false;
    }

    let gridShiftX = this.shiftGrid(this.grid, { x: this.step, y: 0 });
    let gridShiftY = this.shiftGrid(this.grid, { x: 0, y: this.step });
    let gridShiftXY = this.shiftGrid(this.grid, { x: this.step, y: this.step });

    this.gridShift = [];
    this.concatGrid(this.gridShift, gridShiftX, gridShiftY, gridShiftXY);
    this.concatGrid(this.grid, this.gridShift);

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
    return this.step < 1 ? true : false;
  }
}
