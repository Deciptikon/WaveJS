import { GridCoordHandler } from "./GridCoordHandler.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const colorWhite = `rgb(${255}, ${255}, ${255})`;

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

let gridHandler = new GridCoordHandler(5, 5, ctx, [centerY, centerX]);

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
  drawStep(
    [paramFreq, paramOmega, paramAmplutuda, paramS],
    [canvasWidth, canvasHeight, paramX0, paramY0, paramScale],
    [paramR, paramr, paramMK],
    [paramAlfa, paramBetta, paramGamma, paramRo]
  );
}

function drawStep(data, geometry, support, resez) {
  if (isFirstDraw) {
    isFirstDraw = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    firstDraw(data, geometry, support, resez);
    drawColorField(colorWhite, geometry);
  } else {
    nextDraw(data, geometry, support, resez);
    drawColorField(colorWhite, geometry);
  }

  if (gridHandler.isFinish()) {
    return;
  }
  animationFrameId = requestAnimationFrame(() =>
    drawStep(data, geometry, support, resez)
  );
}

function firstDraw(data, geometry, support, resez) {
  let [canvasWidth, canvasHeight] = geometry;

  gridHandler = new GridCoordHandler(canvasHeight, canvasWidth, ctx, [
    centerY,
    centerX,
  ]);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  gridHandler.firstDrawGrid(model, data, geometry, support, resez);
}

function nextDraw(data, geometry, support, resez) {
  gridHandler.updateGrid();
  console.log(gridHandler.getStep());

  gridHandler.nextDrawGrid(model, data, geometry, support, resez);
}

function drawColorField(color, geometry) {
  let [canvasWidth, canvasHeight] = geometry;
  let h = 60;

  ctx.fillStyle = color;

  if (canvasWidth < canvas.width) {
    let s = (canvas.width - canvasWidth) / 2;
    ctx.fillRect(0, 0, s, canvas.height);
    ctx.fillRect(canvas.width - s, 0, s, canvas.height);
  }
  if (canvasHeight < canvas.height) {
    let p = (canvas.height - canvasHeight) / 2;
    ctx.fillRect(0, 0, canvas.width, p + h);
    ctx.fillRect(0, canvas.height - p + h, canvas.width, p - h);
  }
}

function f(x, alfa, betta, gamma, ro) {
  alfa -= gamma;
  betta += gamma;

  if (x < -(ro * Math.sin(betta))) {
    return -x * Math.tan(betta) + ro * (1 - 1 / Math.cos(betta));
  } else if (x < ro * Math.sin(alfa)) {
    return ro * (1 - Math.sqrt(1 - Math.pow(x / ro, 2)));
  } else {
    return x * Math.tan(alfa) + ro * (1 - 1 / Math.cos(alfa));
  }
}

function dist(x, y, x0, y0) {
  return Math.sqrt(Math.pow(x - x0, 2) + Math.pow(y - y0, 2));
}

function lenQ(x, y, x0, y0, R) {
  return R - dist(x, y, x0, y0);
}

function fiQ(x, y, x0, y0) {
  let L = dist(x, y, x0, y0);
  if (L === 0) {
    return 0;
  }

  if (y - y0 < 0) {
    return 2 * Math.PI - Math.acos((x - x0) / L);
  } else {
    return Math.acos((x - x0) / L);
  }
}

function model(j, i, data, geometry, support, resez) {
  let [chi, omega, A, s] = data;
  let [W, H, x0, y0, scale] = geometry;
  let [R, r, mk] = support;
  let [alfa, betta, gamma, ro] = resez;

  let x = Math.ceil(j - W / 2) * scale;
  let y = Math.ceil(i - H / 2) * scale;

  let L = lenQ(x, y, x0, y0, R);
  let fi = fiQ(x, y, x0, y0);

  let lambda = L - (fi * s) / (2 * Math.PI);

  let Amin = 1;
  if (L < 0 || L > R - r) {
    return `rgb(${0}, ${0}, ${0})`;
  }

  let ns = Math.ceil(L / s);

  for (let k = -mk; k < mk + 1; k++) {
    let kk = ns + k;
    let K = A * Math.sin(((fi + kk * 2 * Math.PI) * chi) / omega);
    let Amp =
      f(lambda - kk * s + K * Math.sin(gamma), alfa, betta, gamma, ro) +
      K * Math.cos(gamma);
    if (Amp < Amin) {
      Amin = Amp;
    }
  }

  let red = Amin * 100 + 128;

  return `rgb(${red}, ${red}, ${red})`;
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
