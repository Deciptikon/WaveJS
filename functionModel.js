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

export function model(j, i, data, geometry, support, resez) {
  let [chi, omega, A, s] = data;
  let [W, H, x0, y0, scale] = geometry;
  let [R, r, mk] = support;
  let [alfa, betta, gamma, ro] = resez;

  let x = Math.ceil(j - W / 2) * scale;
  let y = Math.ceil(i - H / 2) * scale;

  let L = lenQ(x, y, x0, y0, R);
  let fi = fiQ(x, y, x0, y0);

  let lambda = L - (fi * s) / (2 * Math.PI);

  let Amin = 100;
  if (L < 0 || L > R - r) {
    return -9999;
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

  return Amin;
}
