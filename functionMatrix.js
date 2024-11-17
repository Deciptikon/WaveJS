export function getValue(i, j, maxW, maxH, buffer) {
  if (i < 0 || i >= maxH || j < 0 || j >= maxW) {
    throw new Error("Индекс выходит за пределы матрицы [function getValue]");
  }
  return buffer[i * maxW + j];
}

export function setValue(i, j, value, maxW, maxH, buffer) {
  if (i < 0 || i >= maxH || j < 0 || j >= maxW) {
    throw new Error("Индекс выходит за пределы матрицы [function setValue]");
  }
  buffer[i * maxW + j] = value;
}

export function setBlock(i, j, value, sizeBlock, maxW, maxH, buffer) {
  if (sizeBlock < 1) {
    throw new Error("Размер блока заполнения матрицы слишком мал");
  }

  if (sizeBlock === 1) {
    if (0 < i && i < maxH && 0 < j && j < maxW) {
      setValue(i, j, value, maxW, maxH, buffer);
    }
    //setValue(i, j, value, maxW, maxH, buffer);
  } else {
    for (let m = 0; m < sizeBlock; m++) {
      for (let n = 0; n < sizeBlock; n++) {
        let I = i + m;
        let J = j + n;
        if (0 <= I && I < maxH && 0 <= J && J < maxW) {
          setValue(I, J, value, maxW, maxH, buffer);
        }
      }
    }
  }
}

export function toImageData(context, maxmin, maxW, maxH, buffer) {
  const maxAmp = maxmin.max - maxmin.min;

  if (maxAmp === 0) {
    throw new Error("Амплитуда матрицы нулевая");
  }

  const imageData = context.createImageData(maxW, maxH);
  for (let i = 0; i < maxH; i++) {
    for (let j = 0; j < maxW; j++) {
      const val = getValue(i, j, maxW, maxH, buffer);
      const value = 255 * ((val - maxmin.min) / maxAmp);
      const idx = (i * maxW + j) * 4;
      imageData.data[idx] = value; // Красный канал
      imageData.data[idx + 1] = value; // Зеленый канал
      imageData.data[idx + 2] = value; // Синий канал
      imageData.data[idx + 3] = 255; // Прозрачность
    }
  }
  return imageData;
}

export function getMaxMin(maxW, maxH, buffer) {
  let maxVal = 0;
  let minVal = 0;

  //ищем валидные начальные значения
  for (let i = 0; i < maxH; i++) {
    for (let j = 0; j < maxW; j++) {
      const value = getValue(i, j, maxW, maxH, buffer);
      if (!(value === -9999)) {
        maxVal = getValue(i, j, maxW, maxH, buffer);
        minVal = getValue(i, j, maxW, maxH, buffer);
        break;
      }
    }
  }

  //обновляем максимум и минимум на основе начальных данных
  for (let i = 0; i < maxH; i++) {
    for (let j = 0; j < maxW; j++) {
      const value = getValue(i, j, maxW, maxH, buffer);
      if (!(value === -9999)) {
        if (value > maxVal) maxVal = value;
        if (value < minVal) minVal = value;
      }
    }
  }

  return { max: maxVal, min: minVal };
}
