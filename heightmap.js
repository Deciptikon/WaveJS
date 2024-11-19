import * as THREE from "./libs/three.module.js";
import { OrbitControls } from "./libs/OrbitControls.js";

// Инициализация сцены
export function initScene(canvas) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 200, 300);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
  });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(50, 100, 50);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  console.log("инициализация прошла успешно");

  return { scene, camera, renderer };
}

// Создание карты высот
export function createHeightMap(buffer, width, height) {
  console.log("создаём карту высот");
  const geometry = new THREE.PlaneGeometry(
    width,
    height,
    width - 1,
    height - 1
  );

  const vertices = geometry.attributes.position.array;
  for (let i = 0; i < buffer.length; i++) {
    vertices[i * 3 + 2] = buffer[i]; // Высота Z
  }

  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0x44aa88,
    side: THREE.DoubleSide,
    wireframe: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;

  return mesh;
}

// Добавление управления
export function addControls(camera, renderer) {
  console.log("добавляем управление");
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.zoomSpeed = 0.5;
  return controls;
}

// Анимация сцены
export function animate(scene, camera, renderer, controls, isAnimate) {
  console.log("анимация -->");
  let animationFrameId = null;

  function render() {
    if (!isAnimate) {
      console.log("отмена анимации");
      cancelAnimationFrame(animationFrameId);
      return;
    }

    animationFrameId = requestAnimationFrame(render);
    controls.update();
    renderer.render(scene, camera);
  }

  if (isAnimate) {
    console.log("продолжение анимации");
    render();
  }
}

// Инициализация всех функций
export function createHeightMapScene(canvas, buffer, width, height) {
  const { scene, camera, renderer } = initScene(canvas);
  const mesh = createHeightMap(buffer, width, height);
  scene.add(mesh);
  const controls = addControls(camera, renderer);
  animate(scene, camera, renderer, controls);
}

export function testLibs(canvas) {
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    console.error("Переданный элемент не является канвасом.");
    return;
  }

  // Создаем рендерер
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  // Создаем сцену
  const scene = new THREE.Scene();

  // Настроим камеру
  const camera = new THREE.PerspectiveCamera(
    75,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 5; // Позиция камеры, чтобы увидеть объекты

  // Добавляем контролы для управления камерой
  const controls = new OrbitControls(camera, canvas);

  // Создаем куб с рёбрами
  const geometry = new THREE.BoxGeometry(1, 1, 1); // Размеры куба
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00, // Зеленый цвет
    wireframe: true, // Отображаем только рёбра
  });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Анимация для вращения куба
  function animate() {
    requestAnimationFrame(animate);

    cube.rotation.x += 0.01; // Вращение по оси X
    cube.rotation.y += 0.01; // Вращение по оси Y

    controls.update(); // Обновляем контролы камеры
    renderer.render(scene, camera); // Рендерим сцену
  }

  animate(); // Запуск анимации
}
