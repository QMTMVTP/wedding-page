import * as THREE from "three";

const canvas = document.querySelector("#rose-scene");
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030612, 0.045);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
camera.position.set(0, 0.05, 12.6);

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const rose = new THREE.Group();
const isWeddingPage = document.body.classList.contains("wedding-page");
rose.position.set(isWeddingPage && window.innerWidth > 700 ? 2.15 : 0, 0.62, 0);
scene.add(rose);

const ambient = new THREE.HemisphereLight(
  isWeddingPage ? 0xffd2cf : 0x7dcfff,
  isWeddingPage ? 0x28121a : 0x160829,
  isWeddingPage ? 0.48 : 0.34,
);
scene.add(ambient);

const cyanLight = new THREE.PointLight(isWeddingPage ? 0xffc58f : 0x28dfff, 8, 8, 2);
cyanLight.position.set(0.15, 0.3, 1.6);
rose.add(cyanLight);

const pinkLight = new THREE.PointLight(isWeddingPage ? 0xff7f9d : 0xff3fbf, 7, 7, 2);
pinkLight.position.set(-1.15, 1.25, 0.8);
rose.add(pinkLight);

const rimLight = new THREE.DirectionalLight(isWeddingPage ? 0xffe3bd : 0x93ecff, 1.05);
rimLight.position.set(3, 3, 5);
scene.add(rimLight);

const backLight = new THREE.DirectionalLight(isWeddingPage ? 0x9a4f61 : 0x794cff, 0.7);
backLight.position.set(-4, -1, -3);
scene.add(backLight);

const petalMaterial = new THREE.MeshPhysicalMaterial({
  color: isWeddingPage ? 0xf3b0b5 : 0xf08bc1,
  vertexColors: true,
  side: THREE.DoubleSide,
  roughness: 0.34,
  metalness: 0.06,
  clearcoat: 0.62,
  clearcoatRoughness: 0.2,
  transmission: 0.02,
  thickness: 0.2,
  ior: 1.38,
  emissive: new THREE.Color(isWeddingPage ? 0x681f2f : 0x5a0d4e),
  emissiveIntensity: isWeddingPage ? 0.62 : 0.72,
});

const petalEdgeMaterial = new THREE.MeshBasicMaterial({
  color: isWeddingPage ? 0xffd89f : 0x69dfff,
  transparent: true,
  opacity: 0.2,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

function createPetalGeometry(length, width, cup, hueShift = 0) {
  const alongSegments = 44;
  const acrossSegments = 30;
  const positions = [];
  const colors = [];
  const indices = [];

  for (let row = 0; row <= alongSegments; row += 1) {
    const u = row / alongSegments;
    const flare = Math.sin(Math.PI * Math.pow(u, 0.82)) ** 0.72;
    const edgeScallop = 1 + 0.035 * Math.sin(u * Math.PI * 9 + hueShift) * u ** 2;
    const widthAtU = width * flare * (0.42 + 0.72 * u) * edgeScallop;
    const sweep = 0.09 * Math.sin(u * Math.PI) + 0.08 * u * u;
    const rise = 0.22 * Math.sin(u * Math.PI * 0.82) + 0.13 * u * u;

    for (let column = 0; column <= acrossSegments; column += 1) {
      const v = (column / acrossSegments) * 2 - 1;
      const edgeCurl = v * v;
      const ridge = Math.sin(Math.PI * (v + 1) * 0.5);
      positions.push(
        length * u,
        widthAtU * v + sweep * u,
        rise
          + cup * edgeCurl
          + 0.09 * ridge * Math.sin(u * Math.PI)
          + 0.055 * (1 - edgeCurl) * Math.sin(u * Math.PI)
          + 0.008 * Math.sin(v * Math.PI * 5 + u * 5) * Math.sin(u * Math.PI),
      );

      const edge = Math.abs(v) ** 1.65;
      const tip = Math.max(0, (u - 0.82) / 0.18);
      const cyan = new THREE.Color(isWeddingPage ? 0xffdfaa : 0x59edff);
      const rosePink = new THREE.Color(isWeddingPage ? 0xf39aaa : 0xff48bf);
      const magenta = new THREE.Color(isWeddingPage ? 0x9f4765 : 0xd42c9d);
      const base = magenta.clone().lerp(rosePink, 0.25 + ridge * 0.5);
      base.lerp(cyan, Math.min(0.84, edge * 0.8 + tip * 0.5 + (1 - u) * 0.19));
      const shimmer = 0.78 + ridge * 0.22 + (1 - u) * 0.12;
      const veinShade = 1 - Math.max(0, Math.cos(v * Math.PI * 8)) * 0.035 * Math.sin(u * Math.PI);
      colors.push(
        Math.min(1, base.r * shimmer * veinShade + hueShift * 0.035),
        Math.min(1, base.g * shimmer * veinShade),
        Math.min(1, base.b * shimmer * veinShade + hueShift * 0.045),
      );
    }
  }

  for (let row = 0; row < alongSegments; row += 1) {
    for (let column = 0; column < acrossSegments; column += 1) {
      const a = row * (acrossSegments + 1) + column;
      const b = a + acrossSegments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createPetalVeins(length, width, cup, color = 0xb7efff) {
  const veins = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  for (const lane of [-0.72, -0.43, -0.19, 0, 0.19, 0.43, 0.72]) {
    const points = [];
    const end = 0.9 - Math.abs(lane) * 0.12;
    for (let step = 0; step <= 18; step += 1) {
      const u = 0.13 + (end - 0.13) * step / 18;
      const v = lane * (0.28 + u * 0.72);
      const flare = Math.sin(Math.PI * Math.pow(u, 0.82)) ** 0.72;
      const scallop = 1 + 0.035 * Math.sin(u * Math.PI * 9) * u ** 2;
      const halfWidth = width * flare * (0.42 + 0.72 * u) * scallop;
      const ridge = Math.sin(Math.PI * (v + 1) * 0.5);
      const rise = 0.22 * Math.sin(u * Math.PI * 0.82) + 0.13 * u * u;
      const z = rise
        + cup * v * v
        + 0.09 * ridge * Math.sin(u * Math.PI)
        + 0.055 * (1 - v * v) * Math.sin(u * Math.PI)
        + 0.008 * Math.sin(v * Math.PI * 5 + u * 5) * Math.sin(u * Math.PI)
        + 0.003;
      points.push(new THREE.Vector3(
        length * u,
        halfWidth * v + 0.09 * Math.sin(u * Math.PI) * u + 0.08 * u * u,
        z,
      ));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    veins.add(new THREE.Line(geometry, material));
  }

  return veins;
}

const petalRings = [
  { count: 3, length: 0.82, width: 0.52, radius: 0.05, tilt: 0.8, cup: 0.3 },
  { count: 5, length: 1.18, width: 0.68, radius: 0.16, tilt: 0.46, cup: 0.22 },
  { count: 7, length: 1.56, width: 0.8, radius: 0.3, tilt: 0.12, cup: 0.14 },
  { count: 9, length: 1.86, width: 0.9, radius: 0.46, tilt: -0.18, cup: 0.09 },
];
const petals = [];

for (let ringIndex = petalRings.length - 1; ringIndex >= 0; ringIndex -= 1) {
  const ring = petalRings[ringIndex];
  const phaseOffset = ringIndex % 2 === 0 ? 0.18 : Math.PI / ring.count;

  for (let index = 0; index < ring.count; index += 1) {
    const angle = (index / ring.count) * Math.PI * 2 + phaseOffset;
    const petal = new THREE.Group();
    petal.rotation.z = angle + (ringIndex === 0 ? 0.18 : 0);
    petal.rotation.y = ring.tilt + Math.sin(index * 8.13 + ringIndex) * 0.04;
    petal.rotation.x = 0.9 + ringIndex * 0.28;
    petal.position.x = ring.radius;
    petal.position.y = -0.18 + ringIndex * 0.18;
    petal.position.z = ringIndex * 0.12 + Math.cos(angle * 2) * 0.035 - 0.18;

    const geometry = createPetalGeometry(ring.length, ring.width, ring.cup, index % 3);
    const mesh = new THREE.Mesh(geometry, petalMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    petal.add(mesh);
    petal.add(createPetalVeins(ring.length, ring.width, ring.cup));

    petal.scale.setScalar(0.12);
    petals.push({
      group: petal,
      angle,
      ringIndex,
      phase: Math.random() * Math.PI * 2,
      openDelay: (4 - ringIndex) * 0.09,
    });
    rose.add(petal);
  }
}

for (let index = 0; index < 7; index += 1) {
  const angle = (index / 7) * Math.PI * 2 + 0.22;
  const length = 0.5 + (index % 2) * 0.055;
  const width = 0.265 + (index % 3) * 0.018;
  const cup = 0.2;
  const innerPetal = new THREE.Group();
  innerPetal.rotation.z = angle + (index % 2 === 0 ? 0.08 : -0.08);
  innerPetal.rotation.y = 0.32 + Math.sin(index * 3.7) * 0.08;
  innerPetal.position.set(Math.cos(angle) * 0.1, Math.sin(angle) * 0.08, 0.46 + index * 0.014);

  const mesh = new THREE.Mesh(createPetalGeometry(length * 1.12, width * 1.08, cup * 0.9, index % 2), petalMaterial);
  innerPetal.add(mesh);
  innerPetal.add(createPetalVeins(length * 1.12, width * 1.08, cup * 0.9, 0xe7d6ff));
  innerPetal.scale.setScalar(0.15);
  petals.push({ group: innerPetal, angle, ringIndex: 4, phase: Math.random() * Math.PI * 2, openDelay: 0.36 });
  rose.add(innerPetal);
}

function createTube(points, radius, material, segments = 64) {
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 8, false), material);
  rose.add(mesh);
  return mesh;
}

const stemMaterial = new THREE.MeshStandardMaterial({
  color: isWeddingPage ? 0x63805a : 0x36b9df,
  emissive: isWeddingPage ? 0x28451e : 0x087eaa,
  emissiveIntensity: 1.2,
  metalness: 0.4,
  roughness: 0.28,
});
const stemPoints = [
  new THREE.Vector3(0.04, -0.05, -0.06),
  new THREE.Vector3(0.02, -0.58, -0.13),
  new THREE.Vector3(-0.08, -1.25, -0.2),
  new THREE.Vector3(0.04, -2.05, -0.24),
  new THREE.Vector3(0.13, -2.95, -0.28),
  new THREE.Vector3(-0.02, -3.7, -0.3),
];
const stem = createTube(stemPoints, 0.045, stemMaterial, 80);

function createLeafGeometry(length, width, direction = 1) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];
  const indices = [];
  const along = 20;
  const across = 10;

  for (let row = 0; row <= along; row += 1) {
    const u = row / along;
    const halfWidth = width * Math.sin(Math.PI * u) ** 0.82;
    for (let column = 0; column <= across; column += 1) {
      const v = (column / across) * 2 - 1;
      positions.push(length * u, halfWidth * v, 0.16 * Math.sin(Math.PI * u) * (1 - v * v));
      const edge = Math.abs(v);
      const color = new THREE.Color(isWeddingPage ? 0x456346 : 0x078ea9).lerp(
        new THREE.Color(isWeddingPage ? 0xb5ba83 : 0x6deaff),
        edge * 0.7 + (1 - u) * 0.16,
      );
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let row = 0; row < along; row += 1) {
    for (let column = 0; column < across; column += 1) {
      const a = row * (across + 1) + column;
      const b = a + across + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const leafMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  vertexColors: true,
  side: THREE.DoubleSide,
  roughness: 0.2,
  metalness: 0.35,
  clearcoat: 1,
  emissive: isWeddingPage ? 0x193b27 : 0x023d66,
  emissiveIntensity: 0.8,
});
const leaves = [];
const leafDefinitions = [
  { y: -0.8, direction: -1, angle: 2.5, length: 1.52, width: 0.38 },
  { y: -1.25, direction: 1, angle: 0.65, length: 1.34, width: 0.34 },
  { y: -2.05, direction: -1, angle: 3.45, length: 1.28, width: 0.3 },
  { y: -2.62, direction: 1, angle: -0.16, length: 0.96, width: 0.24 },
];

for (const definition of leafDefinitions) {
  const pivot = new THREE.Group();
  pivot.position.set(definition.direction * 0.02, definition.y, -0.18);
  pivot.rotation.z = definition.angle;
  const leaf = new THREE.Mesh(createLeafGeometry(definition.length, definition.width), leafMaterial);
  leaf.scale.x = definition.direction;
  pivot.add(leaf);

  const veinPoints = [
    new THREE.Vector3(0, 0, 0.025),
    new THREE.Vector3(definition.length * 0.32, 0, 0.12),
    new THREE.Vector3(definition.length * 0.72, 0, 0.1),
    new THREE.Vector3(definition.length, 0, 0.02),
  ];
  const vein = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(veinPoints), 28, 0.012, 5, false),
    petalEdgeMaterial,
  );
  vein.scale.x = definition.direction;
  pivot.add(vein);
  rose.add(pivot);
  leaves.push({
    pivot,
    phase: Math.random() * Math.PI * 2,
    direction: definition.direction,
    baseAngle: definition.angle,
  });
}

const sepalMaterial = new THREE.MeshStandardMaterial({
  color: isWeddingPage ? 0x71895d : 0x1db5ca,
  emissive: isWeddingPage ? 0x314923 : 0x087caa,
  emissiveIntensity: 1.1,
  metalness: 0.26,
  roughness: 0.3,
  side: THREE.DoubleSide,
});
for (let index = 0; index < 7; index += 1) {
  const angle = (index / 7) * Math.PI * 2;
  const sepal = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.72, 5, 1), sepalMaterial);
  sepal.position.set(Math.cos(angle) * 0.2, -0.21, Math.sin(angle) * 0.2);
  sepal.rotation.z = -Math.PI / 2 + Math.cos(angle) * 0.72;
  sepal.rotation.x = Math.sin(angle) * 0.55;
  rose.add(sepal);
}

const coreGeometry = new THREE.SphereGeometry(0.17, 36, 28);
const coreMaterial = new THREE.MeshPhysicalMaterial({
  color: isWeddingPage ? 0xffc17f : 0x25d9ef,
  emissive: isWeddingPage ? 0xae583b : 0x087eaa,
  emissiveIntensity: 1.05,
  roughness: 0.14,
  metalness: 0.16,
  clearcoat: 1,
});
const core = new THREE.Mesh(coreGeometry, coreMaterial);
core.position.set(0, 0.04, 0.94);
core.scale.set(0.76, 0.68, 0.58);
rose.add(core);

const stamenMaterial = new THREE.MeshStandardMaterial({
  color: isWeddingPage ? 0xffd9a1 : 0x65efff,
  emissive: isWeddingPage ? 0xd78d68 : 0x16c9ed,
  emissiveIntensity: 1.7,
  roughness: 0.24,
  metalness: 0.18,
});
const stamenTipGeometry = new THREE.SphereGeometry(0.035, 12, 10);
const stamenTips = [];

for (let index = 0; index < 9; index += 1) {
  const angle = (index / 9) * Math.PI * 2 + 0.24;
  const baseRadius = 0.075 + (index % 2) * 0.025;
  const tipRadius = 0.19 + (index % 3) * 0.025;
  const base = new THREE.Vector3(
    Math.cos(angle) * baseRadius,
    0.04 + Math.sin(angle) * baseRadius,
    0.98,
  );
  const tip = new THREE.Vector3(
    Math.cos(angle) * tipRadius,
    0.04 + Math.sin(angle) * tipRadius,
    1.06 + (index % 2) * 0.025,
  );
  const middle = base.clone().lerp(tip, 0.55);
  middle.z += 0.035;
  const filament = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([base, middle, tip]), 12, 0.009, 5, false),
    stamenMaterial,
  );
  rose.add(filament);

  const tipMesh = new THREE.Mesh(stamenTipGeometry, stamenMaterial);
  tipMesh.position.copy(tip);
  tipMesh.scale.setScalar(0.78 + (index % 3) * 0.16);
  rose.add(tipMesh);
  stamenTips.push({ mesh: tipMesh, phase: index * 0.8 });
}

const pistil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 18, 14), stamenMaterial);
pistil.position.set(0, 0.04, 1.08);
rose.add(pistil);

const glowTextureCanvas = document.createElement("canvas");
glowTextureCanvas.width = 128;
glowTextureCanvas.height = 128;
const glowContext = glowTextureCanvas.getContext("2d");
const glowGradient = glowContext.createRadialGradient(64, 64, 0, 64, 64, 64);
glowGradient.addColorStop(0, "rgba(130, 246, 255, 0.92)");
glowGradient.addColorStop(0.14, "rgba(66, 213, 255, 0.4)");
glowGradient.addColorStop(0.48, "rgba(126, 81, 255, 0.1)");
glowGradient.addColorStop(1, "rgba(34, 18, 80, 0)");
glowContext.fillStyle = glowGradient;
glowContext.fillRect(0, 0, 128, 128);
const glowTexture = new THREE.CanvasTexture(glowTextureCanvas);
const bloom = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTexture,
  color: 0x86ecff,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  opacity: 0.72,
}));
bloom.position.set(0, 0.06, -0.02);
bloom.scale.set(4.9, 4.9, 1);
rose.add(bloom);

const particles = [];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const particleCount = reducedMotion.matches ? 28 : (window.innerWidth < 700 ? 82 : 150);
const particlePositions = new Float32Array(particleCount * 3);
const particleColors = new Float32Array(particleCount * 3);
const particleSizes = new Float32Array(particleCount);
const palette = isWeddingPage
  ? [0xffd9ab, 0xf19aa8, 0xc87583, 0xfff0d5].map((color) => new THREE.Color(color))
  : [0x66eaff, 0x7c94ff, 0xfa68df, 0xe9f7ff].map((color) => new THREE.Color(color));

for (let index = 0; index < particleCount; index += 1) {
  const radius = 0.7 + Math.random() * 4.2;
  const angle = Math.random() * Math.PI * 2;
  const color = palette[Math.floor(Math.random() * palette.length)];
  particles.push({
    radius,
    angle,
    speed: (0.035 + Math.random() * 0.095) * (Math.random() < 0.5 ? -1 : 1),
    y: (Math.random() - 0.5) * 7.5,
    drift: 0.08 + Math.random() * 0.18,
    size: 0.018 + Math.random() ** 3 * 0.055,
    phase: Math.random() * Math.PI * 2,
    color,
  });
  particleColors[index * 3] = color.r;
  particleColors[index * 3 + 1] = color.g;
  particleColors[index * 3 + 2] = color.b;
  particleSizes[index] = particles[index].size;
}

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));
particleGeometry.setAttribute("size", new THREE.BufferAttribute(particleSizes, 1));
const particleMaterial = new THREE.PointsMaterial({
  size: 0.055,
  sizeAttenuation: true,
  vertexColors: true,
  transparent: true,
  opacity: 0.84,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const particleField = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleField);

const clock = new THREE.Clock();
let width = 1;
let height = 1;
let sceneScale = 1;

function resize() {
  const stageBounds = isWeddingPage ? canvas.parentElement.getBoundingClientRect() : null;
  width = stageBounds?.width ?? window.innerWidth;
  height = stageBounds?.height ?? window.innerHeight;
  sceneScale = isWeddingPage
    ? Math.min(1, (width / height) / 0.56)
    : Math.min(width / 8.8, height / 10.6, 0.98);
  camera.aspect = width / height;
  camera.position.z = width / height < 0.72 ? 14.3 : 12.6;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  rose.scale.setScalar(sceneScale);
  rose.position.x = isWeddingPage && width > 700 ? 2.15 : 0;
  rose.position.y = isWeddingPage && width <= 700
    ? (window.innerHeight < 700 ? -1.5 : -0.9)
    : 0.62;
}

let animationFrame = 0;
let activeElapsed = 0;

function animate() {
  if (document.hidden) return;
  activeElapsed += clock.getDelta();
  const elapsed = activeElapsed;
  const motion = reducedMotion.matches ? 0 : 1;
  const time = elapsed * motion;

  const baseRoseY = isWeddingPage && width <= 700
    ? (window.innerHeight < 700 ? -1.5 : -0.9)
    : 0.62;
  rose.position.y = baseRoseY + Math.sin(time * 0.48) * 0.07;
  rose.rotation.y = Math.sin(time * 0.27) * 0.12;
  rose.rotation.z = Math.sin(time * 0.2) * 0.025;
  rose.rotation.x = Math.sin(time * 0.34) * 0.035;

  for (const petal of petals) {
    const sway = Math.sin(time * 1.15 + petal.phase + petal.ringIndex * 0.7);
    const opening = reducedMotion.matches
      ? 1
      : Math.min(1, Math.max(0, (elapsed - petal.openDelay) / 2.2));
    const easedOpening = opening * opening * (3 - 2 * opening);
    petal.group.rotation.z = petal.angle + sway * 0.012;
    petal.group.rotation.x = Math.sin(time * 0.82 + petal.phase) * 0.025;
    petal.group.scale.set(
      0.12 + easedOpening * (0.88 + sway * 0.008),
      0.12 + easedOpening * (0.88 + sway * 0.014),
      0.12 + easedOpening * 0.88,
    );
  }

  for (const leaf of leaves) {
    leaf.pivot.rotation.z = leaf.baseAngle
      + Math.sin(time * 0.72 + leaf.phase) * 0.018 * leaf.direction;
  }
  stem.rotation.z = Math.sin(time * 0.55) * 0.018;

  for (let index = 0; index < particles.length; index += 1) {
    const particle = particles[index];
    const angle = particle.angle + time * particle.speed;
    const depthWave = Math.sin(time * particle.drift + particle.phase);
    particlePositions[index * 3] = Math.cos(angle) * particle.radius + Math.sin(time * 0.22 + particle.phase) * 0.12;
    particlePositions[index * 3 + 1] = particle.y + Math.sin(time * particle.drift + particle.phase) * 0.24;
    particlePositions[index * 3 + 2] = -1.8 + depthWave * 1.2;
    particleSizes[index] = particle.size * (0.7 + (Math.sin(time * 2.4 + particle.phase) + 1) * 0.4);
  }
  particleGeometry.attributes.position.needsUpdate = true;
  particleGeometry.attributes.size.needsUpdate = true;

  cyanLight.intensity = 7 + (Math.sin(time * 1.8) + 1) * 1.2;
  pinkLight.intensity = 6 + (Math.sin(time * 1.25 + 1.6) + 1) * 1;
  coreMaterial.emissiveIntensity = 0.9 + (Math.sin(time * 2.1) + 1) * 0.25;
  bloom.material.opacity = 0.58 + (Math.sin(time * 1.45) + 1) * 0.1;
  core.rotation.z = Math.sin(time * 0.9) * 0.06;
  for (const stamen of stamenTips) {
    stamen.mesh.position.z = 1.06 + Math.sin(time * 1.2 + stamen.phase) * 0.015;
  }

  renderer.render(scene, camera);
  animationFrame = requestAnimationFrame(animate);
}

window.addEventListener("resize", resize, { passive: true });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelAnimationFrame(animationFrame);
  } else {
    clock.start();
    animate();
  }
});
resize();
animate();