import { model } from "./functionModel.js";
import { getMaxMin, getValue } from "./functionMatrix.js";
import { firstGrid, nextGrid } from "./functionGridCoord.js";
import { orthoVec2d, lengthVec2d, additionVec2d, unitVec2d, multipleToScalarVec2d } from "./vector2d.js"

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let savedImageCanvas = null;

const colorWhite = `rgb(${255}, ${255}, ${255})`;
const colorBackground = `rgb(${150}, ${100}, ${100})`;

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

let globalWidth = parseInt(canvasWidthInput, 10);
let globalHeight = parseInt(canvasHeightInput, 10);
let globalScale = parseFloat(paramScaleInput, 10);
let globalMaxMin = { max: 0, min: 0 };

let isFirstDraw = true;
let animationFrameId = null;

let buffer = new Float32Array(10);
let globalStep = 2;
let globalSizeGrid = 2;

let worker = null;
let deltaTime = 0;

let isUpdateWolnogramma = false;
let isDrawWolnogramma = true;

let geometryWolnogramma = {
  x0: 0,
  y0: 0,
  x1: 0,
  y1: 0
};

function updateCanvas(paramsURL) {
  const {
    Chi,
    Psi,
    Amplutuda,
    S,
    Width,
    Height,
    X0,
    Y0,
    Scale,
    Alfa,
    Betta,
    Gamma,
    Ro,
  } = paramsURL;

  const paramR = 200;
  const paramr = 100;

  const paramMK = 10; //это не изменяемый параметр

  let W = parseInt(Width, 10);
  let H = parseInt(Height, 10);

  let fullRelationFreq = parseFloat(Chi) + parseFloat(Psi);
  let paramOmega = 1; // вращение заготовки
  let paramFreq = paramOmega * fullRelationFreq;

  isFirstDraw = true;
  setFavicon(1);
  savedImageCanvas = null;

  calculateStep(
    [paramFreq, paramOmega, Amplutuda, S],
    [W, H, X0, Y0, Scale],
    [paramR, paramr, paramMK],
    [Alfa, Betta, Gamma, Ro]
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
  //console.log(`calculateStep: W = ${W}, H = ${H}`);
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
    //console.log(`createWorker: W = ${W}, H = ${H}`);
    draw(W, H);

    if (!updateGrid()) {
      setFavicon(0);
      savedImageCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
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
  //if (ampl === 0) return;

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
        color = colorBackground;
      } else {
        if (ampl !== 0) {
          let c = ((val - maxmin.min) / ampl) * 255;
          color = `rgb(${c}, ${c}, ${c})`;
        } else {
          color = colorBackground;
        }
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
  //console.log("function drawGradientScale()");

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
  //console.log("function drawGradientScale() --> end");
}

function draw(W, H) {
  //console.log(`draw: W = ${W}, H = ${H}`);
  let maxmin = getMaxMin(W, H, buffer);
  globalMaxMin = maxmin;
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

  //drawGradientScale(xg, yg, 30, 100, maxmin, 4, `Амплитуда, мм.`);
  //let hist = calculateHist(256, maxmin, buffer);
  //drawHistogram(xg, yg + 150, 50, 256, 10, hist, `rgb(${80}, ${80}, ${200})`);
  drawGradientScale(xg, yg, 60, 256, maxmin, 4, `Амплитуда, мм.`);
  let hist = calculateHist(256, maxmin, buffer);
  drawHistogram(xg + 60, yg, -50, 256, 10, hist, "blue"); //`rgb(${80}, ${80}, ${200})`
}

function calculateHist(num, maximin, buffer) {
  if (num < 1) num = 1;
  let dh = (maximin.max - maximin.min) / num;
  let hist = Array(num).fill(0);

  buffer.forEach((val) => {
    if (val !== -9999) {
      let i = Math.floor((val - maximin.min) / dh);
      hist[i]++;
    }
  });

  return hist;
}

function drawHistogram(
  rectX,
  rectY,
  rectWidth,
  rectHeight,
  margin,
  hist,
  color
) {
  if (hist != null) {
    //ctx.fillStyle = "white";
    //ctx.fillRect(
    //  rectX - margin,
    //  rectY - margin,
    //  rectWidth + 2 * margin,
    //  rectHeight + 2 * margin
    //);

    let dy = rectHeight / hist.length;

    let maxHist = 0;
    for (let i = 1; i < hist.length; i++) {
      if (hist[i] > maxHist) maxHist = hist[i];
    }
    //console.log(`maxHist = ${maxHist}`);

    let kx = rectWidth / maxHist;
    //console.log(`kx = ${kx}`);
    let y = rectY + rectHeight - 1;
    ctx.fillStyle = color;
    hist.forEach((val) => {
      let dx = val * kx;
      if (dx < rectWidth) {
        //console.log(`dx = ${dx}, rectWidth = ${rectWidth}`);
        dx = rectWidth;
      }
      ctx.fillRect(rectX, y, dx, dy);
      y -= dy;
    });
  }
}

function getParamsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    Chi: parseFloat(params.get("Chi")) || 5,
    Psi: parseFloat(params.get("Psi")) || 0.08,
    Amplutuda: parseFloat(params.get("Amplutuda")) || 0.95,
    S: parseFloat(params.get("S")) || 1,
    Width: parseFloat(params.get("Width")) || 480,
    Height: parseFloat(params.get("Height")) || 320,
    X0: parseFloat(params.get("X0")) || 150,
    Y0: parseFloat(params.get("Y0")) || 0,
    Scale: parseFloat(params.get("Scale")) || 0.1,
    Alfa: parseFloat(params.get("Alfa")) || 0.785,
    Betta: parseFloat(params.get("Betta")) || 0.524,
    Gamma: parseFloat(params.get("Gamma")) || 0,
    Ro: parseFloat(params.get("Ro")) || 1,
  };
}

function updateUrl(params) {
  const url = new URL(window.location);
  Object.keys(params).forEach((key) => {
    if (params[key] !== null) {
      url.searchParams.set(key, params[key]);
    }
  });
  history.replaceState(null, "", url);
}

function setTextContentToHTML(params) {
  //console.log("function setParamsToHTML(params)");
  const {
    Chi,
    Psi,
    Amplutuda,
    S,
    Width,
    Height,
    X0,
    Y0,
    Scale,
    Alfa,
    Betta,
    Gamma,
    Ro,
  } = params;

  //paramChiInput.value = paramChi;

  paramChiValue.textContent = Chi;
  paramPsiValue.textContent = Psi;

  paramAmplutudaValue.textContent = Amplutuda;
  paramSValue.textContent = S;

  canvasWidthValue.textContent = Width;
  canvasHeightValue.textContent = Height;

  paramX0Value.textContent = X0;
  paramY0Value.textContent = Y0;

  paramScaleValue.textContent = Scale;

  paramAlfaValue.textContent = Alfa;
  paramBettaValue.textContent = Betta;

  paramGammaValue.textContent = Gamma;
  paramRoValue.textContent = Ro;
}

function setParamsToHTML(params) {
  //console.log("function setParamsToHTML(params)");
  const {
    Chi,
    Psi,
    Amplutuda,
    S,
    Width,
    Height,
    X0,
    Y0,
    Scale,
    Alfa,
    Betta,
    Gamma,
    Ro,
  } = params;

  paramChiInput.value = Chi;
  paramPsiInput.value = Psi;

  paramAmplutudaInput.value = Amplutuda;
  paramSInput.value = S;

  canvasWidthInput.value = Width;
  canvasHeightInput.value = Height;

  paramX0Input.value = X0;
  paramY0Input.value = Y0;

  paramScaleInput.value = Scale;

  paramAlfaInput.value = Alfa;
  paramBettaInput.value = Betta;

  paramGammaInput.value = Gamma;
  paramRoInput.value = Ro;
}

function getParamsFromHTML() {
  // параметры колебаний
  const Chi = parseFloat(paramChiInput.value) || 0;
  const Psi = parseFloat(paramPsiInput.value) || 0;
  const Amplutuda = parseFloat(paramAmplutudaInput.value) || 0;
  const S = parseFloat(paramSInput.value) || 0;

  // параметры отображения
  const Width = parseFloat(canvasWidthInput.value) || 0;
  const Height = parseFloat(canvasHeightInput.value) || 0;
  const X0 = parseFloat(paramX0Input.value) || 0;
  const Y0 = parseFloat(paramY0Input.value) || 0;
  const Scale = parseFloat(paramScaleInput.value) || 0;

  // параметры резца
  const Alfa = parseFloat(paramAlfaInput.value) || 0;
  const Betta = parseFloat(paramBettaInput.value) || 0;
  const Gamma = parseFloat(paramGammaInput.value) || 0;
  const Ro = parseFloat(paramRoInput.value) || 0;

  return {
    Chi,
    Psi,
    Amplutuda,
    S,
    Width,
    Height,
    X0,
    Y0,
    Scale,
    Alfa,
    Betta,
    Gamma,
    Ro,
  };
}

function lengthWolnogramma(geometryWolnogramma) {
  return lengthVec2d(
    { 
      x: geometryWolnogramma.x1 - geometryWolnogramma.x0, 
      y: geometryWolnogramma.y1 - geometryWolnogramma.y0,
    }
  );
}

function updateWolnogramma() {
  isDrawWolnogramma = true;
  if(isDrawWolnogramma) {
    drawWolnogramma(
      [globalWidth, globalHeight], 
      buffer, 
      geometryWolnogramma, 
      globalScale, 
      savedImageCanvas
    );
  }
}

function drawVectorWolnogramma(geometry, vecW, scale) {
  
  const W = parseInt(globalWidth, 10);
  const H = parseInt(globalHeight, 10);
  const X0 = centerX - W/2;
  const Y0 = centerY - H/2;


  const vecBase = {
    x: vecW.x0,
    y: vecW.y0
  }
  const vec = {
    x: vecW.x1 - vecW.x0,
    y: vecW.y1 - vecW.y0
  }


  const lineColor = 'rgb(255, 0, 0)';

  ctx.strokeStyle = lineColor;
  ctx.fillStyle = lineColor;
  ctx.lineWidth = 1;

  let vecR = additionVec2d(vecBase, vec);

  ctx.beginPath();
  ctx.moveTo(X0 + vecBase.x, Y0 + vecBase.y);
  ctx.lineTo(X0 + vecR.x, Y0 + vecR.y);
  ctx.stroke();

  const unit = unitVec2d(vec);
  const orto = multipleToScalarVec2d(orthoVec2d(unit), -1);
  const ortoD = multipleToScalarVec2d(orto, 10);
  const ortoDt = multipleToScalarVec2d(orto, 13);
  const d = 50.0;


  for(let i=0; i<lengthVec2d(vec)/d; i++) {
    const A = additionVec2d(vecBase, multipleToScalarVec2d(unit, d*i));
    const B = additionVec2d(A, ortoD);
    const Bt = additionVec2d(A, ortoDt);

    ctx.moveTo(X0 + A.x, Y0 + A.y);
    ctx.lineTo(X0 + B.x, Y0 + B.y);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillText(
      `${(d*i * scale).toFixed(2)}`,//(d*i * scale).toFixed(2)
      X0 + Bt.x, 
      Y0 + Bt.y
  );
  }
}

function drawGraphWolnogramma(geometry, buffer, vecW, scale) {
  const W = parseInt(globalWidth, 10);
  const H = parseInt(globalHeight, 10);
  const X0 = centerX - W/2;
  const Y0 = centerY - H/2;

  const hDown = 50;
  const d = 50.0;

  const vecBase = {
    x: vecW.x0,
    y: vecW.y0
  }
  const vec = {
    x: vecW.x1 - vecW.x0,
    y: vecW.y1 - vecW.y0
  }
  const unit = unitVec2d(vec);
  const lenVec = parseInt(lengthVec2d(vec));
  console.log(`vecBase.x = ${vecBase.x}   vecBase.y = ${vecBase.y}`);
  console.log(`vec.x = ${vec.x}   vec.y = ${vec.y}`);

  const lineColor = 'rgb(0, 0, 0)';
  
  
  ctx.setLineDash([]);
  ctx.beginPath();
  
  ctx.strokeStyle = lineColor;
  ctx.fillStyle = lineColor;
  ctx.lineWidth = 1;
  
  ctx.moveTo(centerX - lenVec/2, canvas.height - hDown);
  ctx.lineTo(centerX + lenVec/2, canvas.height - hDown);
  ctx.stroke();

  for(let i=0; i<lenVec/d; i++) {
    ctx.setLineDash([]);
    ctx.moveTo(centerX - lenVec/2 + i*d, canvas.height - hDown);
    ctx.lineTo(centerX - lenVec/2 + i*d, canvas.height - hDown + 10);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillText(
      `${(d*i * scale).toFixed(2)}`,
      centerX - lenVec/2 + i*d, 
      canvas.height - hDown + 25
    );
  }
  
  const hL = 100;//высота вертикальной линии
  ctx.moveTo(centerX - lenVec/2, canvas.height - hDown);
  ctx.lineTo(centerX - lenVec/2, canvas.height - hDown - 100);
  ctx.stroke();
  
  const nh = 5;//вертикальное количество делений
  const dmax = (globalMaxMin.max - globalMaxMin.min)/nh;
  const dh = hL/nh;

  
  ctx.beginPath();
  
  for(let i=0; i < nh+1; i++) {
    ctx.setLineDash([10, 5]);
    ctx.moveTo(centerX - lenVec/2 - 10, canvas.height - hDown - i*dh);
    ctx.lineTo(centerX + lenVec/2, canvas.height - hDown - i*dh);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillText(
      `${(dmax*i).toFixed(4)}`,
      centerX - lenVec/2 - 30, 
      canvas.height - hDown - i*dh + 5
    );

    ctx.setLineDash([]);
    ctx.beginPath();
    for(let i = 0; i<lenVec; i++) {
      const V = additionVec2d(vecBase, multipleToScalarVec2d(unit,i));
      if((V.x > 0) && (V.x < W-1) && (V.y > 0) && (V.y < H-1) ) {
        if(!(getValue(parseInt(V.y), parseInt(V.x), W, H, buffer) === -9999)) {
          //билинейное интерполяция значения
          const ii = V.y;
          const jj = V.x;
          const pi = parseInt(ii);
          const pj = parseInt(jj);
          const ki = ii - pi;
          const kj = jj - pj;
          const v00 = getValue(pi, pj, W, H, buffer);
          const v01 = getValue(pi, pj + 1, W, H, buffer);
          const v10 = getValue(pi + 1, pj, W, H, buffer);
          const v11 = getValue(pi + 1, pj + 1, W, H, buffer);
          const vj0 = v00*(1 - kj) + v01 * kj;
          const vj1 = v10*(1 - kj) + v11 * kj;
          const value = vj0*(1 - ki) + vj1 * ki;
          
          ctx.moveTo(centerX - lenVec/2 + i, canvas.height - hDown);
          ctx.lineTo(centerX - lenVec/2 + i, 
            canvas.height - hDown - 
            hL * (value - globalMaxMin.min) / (globalMaxMin.max - globalMaxMin.min));
        }
      }
    }
    
    ctx.stroke();
  }



}

function drawWolnogramma(geometry, buffer, vec, scale, imgCanvas) {
  ctx.putImageData(imgCanvas, 0, 0);
  drawVectorWolnogramma(geometry, vec, scale);
  drawGraphWolnogramma(geometry, buffer, vec, scale);
}

// Загрузка параметров из URL при загрузке страницы
window.addEventListener("load", () => {
  const paramsURL = getParamsFromUrl();
  //console.log("window.addEventListener(load)");
  setParamsToHTML(paramsURL);
  setTextContentToHTML(paramsURL);
  updateCanvas(paramsURL);
  globalWidth = paramsURL.Width;
  globalHeight = paramsURL.Height;
  globalScale = paramsURL.Scale;
});

function updateUrlListener() {
  //console.log("function updateUrlListener()");
  //event.preventDefault();
  const params = getParamsFromHTML();
  updateUrl(params);
  setTextContentToHTML(params);
  updateCanvas(params);
  globalWidth = params.Width;
  globalHeight = params.Height;
  globalScale = params.Scale;
}

// Отслеживание положения мыши
canvas.addEventListener('mousemove', (event) => {
  if(!isUpdateWolnogramma) {
      return;
  }
  let W = parseInt(globalWidth, 10);
  let H = parseInt(globalHeight, 10);
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left - centerX + W/2;
  const y = event.clientY - rect.top - centerY + H/2;
  geometryWolnogramma.x1 = x;
  geometryWolnogramma.y1 = y;
  console.log(`Mouse position: x=${geometryWolnogramma.x1}, y=${geometryWolnogramma.y1}`);
  updateWolnogramma();
  
});


canvas.addEventListener('mousedown', (event) => {
  console.log(`Mouse down at button: ${event.button}`);
  if (globalStep !== 1 || savedImageCanvas === null) {
    return;
  }
  let W = parseInt(globalWidth, 10);
  let H = parseInt(globalHeight, 10);
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left - centerX + W/2;
  const y = event.clientY - rect.top - centerY + H/2;
  geometryWolnogramma.x0 = x;
  geometryWolnogramma.y0 = y;
  isUpdateWolnogramma = true;
});

canvas.addEventListener('mouseup', (event) => {
  console.log(`Mouse up at button: ${event.button}`);
  isUpdateWolnogramma = false;
});

canvas.addEventListener('click', (event) => {
  console.log('Mouse click detected');
});

paramChiInput.addEventListener("input", updateUrlListener);
paramPsiInput.addEventListener("input", updateUrlListener);

paramAmplutudaInput.addEventListener("input", updateUrlListener);
paramSInput.addEventListener("input", updateUrlListener);

canvasWidthInput.addEventListener("input", updateUrlListener);
canvasHeightInput.addEventListener("input", updateUrlListener);

paramX0Input.addEventListener("input", updateUrlListener);
paramY0Input.addEventListener("input", updateUrlListener);

paramScaleInput.addEventListener("input", updateUrlListener);

paramAlfaInput.addEventListener("input", updateUrlListener);
paramBettaInput.addEventListener("input", updateUrlListener);

paramGammaInput.addEventListener("input", updateUrlListener);
paramRoInput.addEventListener("input", updateUrlListener);

//updateUrlListener();
