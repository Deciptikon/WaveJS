import { model } from "./functionModel.js";
import {
  toImageData,
  getMaxMin,
  getValue,
  setValue,
} from "./functionMatrix.js";
import { firstGrid, nextGrid } from "./functionGridCoord.js";

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

let buffer = new Float32Array(10);
let globalStep = 2;
let globalSizeGrid = 2;

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

  console.log(`W = ${W} | H = ${H}`);

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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    firstStep(data, geometry, support, resez);
  } else {
    nextStep(data, geometry, support, resez);
  }
  const endTimer = performance.now();
  console.log(`time = ${endTimer - startTimer}`);

  drawGrid(W, H);

  if (!updateGrid()) {
    return;
  }
  animationFrameId = requestAnimationFrame(() =>
    calculateStep(data, geometry, support, resez)
  );
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

function drawGrid(W, H) {
  console.log(`drawGrid(W, H)`);
  console.log(`W = ${W}   |   H = ${H}`);

  for (let i = 0; i < H; i++) {
    for (let j = 0; j < W; j++) {
      let val = getValue(i, j, W, H, buffer);
      //console.log(`val = ${val}`);
      ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
      ctx.fillRect(centerX - W / 2 + j, centerY - H / 2 + i, 1, 1);
    }
  }
}

function updateGrid() {
  globalStep /= 2;

  if (globalStep < 1) {
    globalStep = 1;
    console.log(`updateGrid = false`);
    return false;
  }
  globalSizeGrid *= 2;
  console.log(`updateGrid = true`);
  return true;
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
