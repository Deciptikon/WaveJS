import { model } from "./functionModel.js";
import { getMaxMin, getValue } from "./functionMatrix.js";
import { firstGrid, nextGrid } from "./functionGridCoord.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const colorWhite = `rgb(${255}, ${255}, ${255})`;

const favicon = document.getElementById("favicon");

// параметры ==========================================================
const paramChiInput = document.getElementById("paramChi");
const paramPsiInput = document.getElementById("paramPsi");

const paramAmplutudaInput = document.getElementById("paramAmplutuda");
const paramSInput = document.getElementById("paramS");

const canvasWidthInput = document.getElementById("canvasWidth");
const canvasHeightInput = document.getElementById("canvasHeight");

const paramX0Input = document.getElementById("paramX0");
const paramY0Input = document.getElementById("paramY0");

const paramScaleInput = document.getElementById("paramScale");

const paramAlfaInput = document.getElementById("paramAlfa");
const paramBettaInput = document.getElementById("paramBetta");

const paramGammaInput = document.getElementById("paramGamma");
const paramRoInput = document.getElementById("paramRo");

// элементы ===========================================================
const paramChiValue = document.getElementById("paramChiValue");
const paramPsiValue = document.getElementById("paramPsiValue");

const paramAmplutudaValue = document.getElementById("paramAmplutudaValue");
const paramSValue = document.getElementById("paramSValue");

const canvasWidthValue = document.getElementById("canvasWidthValue");
const canvasHeightValue = document.getElementById("canvasHeightValue");

const paramX0Value = document.getElementById("paramX0Value");
const paramY0Value = document.getElementById("paramY0Value");

const paramScaleValue = document.getElementById("paramScaleValue");

const paramAlfaValue = document.getElementById("paramAlfaValue");
const paramBettaValue = document.getElementById("paramBettaValue");

const paramGammaValue = document.getElementById("paramGammaValue");
const paramRoValue = document.getElementById("paramRoValue");

// Устанавливаем начальные размеры канваса на всю страницу
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const centerX = canvas.width / 2; // Центр по оси X
const centerY = canvas.height / 2 + 60; // Центр по оси Y (уменьшаем на высоту панели)

let isFirstDraw = true;
let animationFrameId = null;

let buffer = new Float32Array(10);
let globalStep = 2;
let globalSizeGrid = 2;

let worker = null;
let deltaTime = 0;

function updateCanvas() {
  const paramChi = paramChiInput.value;
  const paramPsi = paramPsiInput.value;
  const paramAmplutuda = paramAmplutudaInput.value;
  const paramS = paramSInput.value;

  const canvasWidth = canvasWidthInput.value;
  const canvasHeight = canvasHeightInput.value;
  const paramX0 = paramX0Input.value;
  const paramY0 = paramY0Input.value;
  const paramScale = paramScaleInput.value;

  const paramR = 200;
  const paramr = 100;

  const paramMK = 10; //это не изменяемый параметр

  let W = parseInt(canvasWidth, 10);
  let H = parseInt(canvasHeight, 10);

  //параметры резца
  const paramAlfa = paramAlfaInput.value;
  const paramBetta = paramBettaInput.value;
  const paramGamma = paramGammaInput.value;
  const paramRo = paramRoInput.value;

  let fullRelationFreq = parseFloat(paramChi) + parseFloat(paramPsi);
  let paramOmega = 1; // вращение заготовки
  let paramFreq = paramOmega * fullRelationFreq;

  // установка чисел в html

  paramChiValue.textContent = paramChi;
  paramPsiValue.textContent = paramPsi;

  paramAmplutudaValue.textContent = paramAmplutuda;
  paramSValue.textContent = paramS;

  canvasWidthValue.textContent = canvasWidth;
  canvasHeightValue.textContent = canvasHeight;

  paramX0Value.textContent = paramX0;
  paramY0Value.textContent = paramY0;

  paramScaleValue.textContent = paramScale;

  paramAlfaValue.textContent = paramAlfa;
  paramBettaValue.textContent = paramBetta;

  paramGammaValue.textContent = paramGamma;
  paramRoValue.textContent = paramRo;

  isFirstDraw = true;
  setFavicon(1);

  calculateStep(
    [paramFreq, paramOmega, paramAmplutuda, paramS],
    [W, H, paramX0, paramY0, paramScale],
    [paramR, paramr, paramMK],
    [paramAlfa, paramBetta, paramGamma, paramRo]
  );
}

function calculateStep(data, geometry, support, resez) {
  let [W, H] = geometry;
  const startTimer = performance.now();
  if (isFirstDraw) {
    isFirstDraw = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (worker != null) {
      worker.terminate();
    }

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    firstStep(data, geometry, support, resez);
  } else {
    nextStep(data, geometry, support, resez);
  }
  deltaTime = performance.now() - startTimer;

  draw(W, H);

  if (!updateGrid()) {
    return;
  }

  if (deltaTime > 20) {
    createWorker([data, geometry, support, resez], W, H);
    return;
  }

  animationFrameId = requestAnimationFrame(() =>
    calculateStep(data, geometry, support, resez)
  );
}

function createWorker(params, W, H) {
  worker = new Worker("worker.js", { type: "module" });

  worker.postMessage([buffer, globalStep, globalSizeGrid, params]);

  worker.onmessage = (event) => {
    buffer = event.data;

    draw(W, H);

    if (!updateGrid()) {
      setFavicon(0);
      return;
    }
    createWorker(params, W, H);
  };

  worker.onerror = (error) => {
    console.error("Ошибка в воркере:", error);
  };
}

function setFavicon(num) {
  if (num === 0) {
    favicon.href = "favicon0.png";
  }
  if (num === 1) {
    favicon.href = "favicon1.png";
  }
}

function firstStep(data, geometry, support, resez) {
  let [W, H] = geometry;

  buffer = new Float32Array(W * H);
  let exp2 = Math.ceil(Math.log2(Math.max(W, H))); //бинарный масштаб сетки
  globalStep = Math.pow(2, exp2); //текущий шаг
  globalSizeGrid = 1;

  firstGrid(model, globalStep, buffer, data, geometry, support, resez);
}

function nextStep(data, geometry, support, resez) {
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
}

function drawGrid(W, H, maxmin) {
  let ampl = maxmin.max - maxmin.min;
  if (ampl === 0) return;

  //обводка синяя
  if (globalStep > 1) {
    ctx.strokeStyle = "red"; // Цвет линии
    ctx.lineWidth = 2; // Толщина линии
    ctx.strokeRect(centerX - W / 2 - 1, centerY - H / 2 - 1, W + 2, H + 2);
  } else {
    ctx.strokeStyle = "blue"; // Цвет линии
    ctx.lineWidth = 2; // Толщина линии
    ctx.strokeRect(centerX - W / 2 - 1, centerY - H / 2 - 1, W + 2, H + 2);
  }

  for (let i = 0; i < H; i++) {
    for (let j = 0; j < W; j++) {
      let val = getValue(i, j, W, H, buffer);
      let color = 128;
      if (val === -9999) {
        color = `rgb(${150}, ${100}, ${100})`;
      } else {
        let c = ((val - maxmin.min) / ampl) * 255;
        color = `rgb(${c}, ${c}, ${c})`;
      }

      ctx.fillStyle = color;
      ctx.fillRect(centerX - W / 2 + j, centerY - H / 2 + i, 1, 1);
    }
  }
}

function updateGrid() {
  globalStep /= 2;

  if (globalStep < 1) {
    globalStep = 1;
    return false;
  }
  globalSizeGrid *= 2;
  return true;
}

function drawGradientScale(
  rectX,
  rectY,
  rectWidth,
  rectHeight,
  maximin,
  precision,
  nameGradient
) {
  let margin = 5;

  ctx.font = "12px 'Times New Roman'";
  let ht = parseInt(ctx.font, 12); //высота символа
  let wt = 7; //ширина символа

  ctx.fillStyle = "white";
  ctx.fillRect(
    rectX - margin,
    rectY - margin,
    rectWidth + 2 * margin,
    rectHeight + 2 * margin
  );
  ctx.fillRect(
    rectX - margin,
    rectY - ht - margin - 10,
    ctx.measureText(nameGradient).width + 2 * margin,
    ht + 2 * margin
  );
  ctx.fillRect(
    rectX + rectWidth - margin,
    rectY - margin - 2,
    50 + precision * wt + 2 * margin,
    ht + 2 * margin
  );
  ctx.fillRect(
    rectX + rectWidth - margin,
    rectY + rectHeight - ht - margin,
    50 + precision * wt + 2 * margin,
    ht + 2 * margin
  );

  const gradient = ctx.createLinearGradient(0, rectY + rectHeight, 0, rectY);
  gradient.addColorStop(0, "black"); // Нижняя часть
  gradient.addColorStop(1, "white"); // Верхняя часть

  //градиент
  ctx.fillStyle = gradient;
  ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

  if (globalStep > 1) {
    ctx.strokeStyle = "red"; // Цвет линии
    ctx.lineWidth = 2; // Толщина линии
    ctx.strokeRect(rectX - 1, rectY - 1, rectWidth + 2, rectHeight + 2);
  } else {
    ctx.strokeStyle = "blue"; // Цвет линии
    ctx.lineWidth = 2; // Толщина линии
    ctx.strokeRect(rectX - 1, rectY - 1, rectWidth + 2, rectHeight + 2);
  }

  ctx.fillStyle = "black";

  // Верхний текст над градиентом
  ctx.textAlign = "left";
  ctx.fillText(nameGradient, rectX, rectY - 10);

  // Текст сверху градиента
  ctx.textAlign = "left";
  ctx.fillText(
    `max = ${maximin.max.toFixed(precision)}`,
    rectX + rectWidth + 3,
    rectY + 8
  );

  // Текст снизу градиента
  ctx.textAlign = "left";
  ctx.fillText(
    `min = ${maximin.min.toFixed(precision)}`,
    rectX + rectWidth + 3,
    rectY + rectHeight - 2
  );
}

function draw(W, H) {
  let maxmin = getMaxMin(W, H, buffer);
  drawGrid(W, H, maxmin);

  let xg = centerX - W / 2 - 150;
  let isLeft = false;
  if (xg < 30) {
    xg = 30;
  }
  if (centerX - W / 2 < 30) isLeft = true;
  let yg = centerY - H / 2;
  if (isLeft) yg -= 120;
  if (yg < 160) yg = 160;
  drawGradientScale(xg, yg, 30, 100, maxmin, 4, `Амплитуда, мм.`);
}

paramChiInput.addEventListener("input", updateCanvas);
paramPsiInput.addEventListener("input", updateCanvas);

paramAmplutudaInput.addEventListener("input", updateCanvas);
paramSInput.addEventListener("input", updateCanvas);

canvasWidthInput.addEventListener("input", updateCanvas);
canvasHeightInput.addEventListener("input", updateCanvas);

paramX0Input.addEventListener("input", updateCanvas);
paramY0Input.addEventListener("input", updateCanvas);

paramScaleInput.addEventListener("input", updateCanvas);

paramAlfaInput.addEventListener("input", updateCanvas);
paramBettaInput.addEventListener("input", updateCanvas);

paramGammaInput.addEventListener("input", updateCanvas);
paramRoInput.addEventListener("input", updateCanvas);

updateCanvas();
