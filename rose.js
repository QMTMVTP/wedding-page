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
  isWeddingPage ? 0xffe3dc : 0xffd8d8,
  isWeddingPage ? 0x2a1018 : 0x1b0c14,
  isWeddingPage ? 0.62 : 0.42,
);
scene.add(ambient);

const cyanLight = new THREE.PointLight(isWeddingPage ? 0xf7c8a6 : 0xffc4a5, 6, 8, 2);
cyanLight.position.set(0.15, 0.3, 1.6);
rose.add(cyanLight);

const pinkLight = new THREE.PointLight(isWeddingPage ? 0xf3a1b8 : 0xffa6bf, 6.5, 7, 2);
pinkLight.position.set(-1.15, 1.25, 0.8);
rose.add(pinkLight);

const rimLight = new THREE.DirectionalLight(isWeddingPage ? 0xfff0d4 : 0xffecdd, 0.9);
rimLight.position.set(3, 3, 5);
scene.add(rimLight);

const backLight = new THREE.DirectionalLight(isWeddingPage ? 0x8d4d63 : 0x9a5d74, 0.58);
backLight.position.set(-4, -1, -3);
scene.add(backLight);

const petalMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color(isWeddingPage ? 0xf0b5c3 : 0xf7c7d7),
  vertexColors: true,
  side: THREE.DoubleSide,
  roughness: 0.42,
  metalness: 0,
  clearcoat: 0.28,
  clearcoatRoughness: 0.38,
});

const petalEdgeMaterial = new THREE.MeshBasicMaterial({
  color: isWeddingPage ? 0xffe8ee : 0xffedf3,
  transparent: true,
  opacity: 0.28,
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
    const flare = Math.sin(Math.PI * Math.pow(u, 0.9)) ** 0.78;
    const edgeScallop = 1 + 0.012 * Math.sin(u * Math.PI * 7 + hueShift) * u ** 2;
    const widthAtU = width
      * (0.2 + 0.8 * flare)
      * (0.45 + 0.55 * Math.sin(Math.PI * u * 0.5))
      * edgeScallop;
    const sweep = 0.09 * Math.sin(u * Math.PI + 0.35) + 0.05 * u * u;
    const rise = 0.18 * Math.sin(u * Math.PI * 0.8) + 0.11 * u * u;

    for (let column = 0; column <= acrossSegments; column += 1) {
      const v = (column / acrossSegments) * 2 - 1;
      const edgeCurl = v * v;
      const ridge = Math.sin(Math.PI * (v + 1) * 0.5 + hueShift * 0.8);
      const naturalWave = 0.018 * Math.sin(v * Math.PI * 6 + u * 11 + hueShift) * flare;
      positions.push(
        length * u,
        widthAtU * v + sweep * u + naturalWave * (1 - u),
        rise
          + cup * edgeCurl
          + 0.08 * ridge * Math.sin(u * Math.PI)
          + 0.045 * (1 - edgeCurl) * Math.sin(u * Math.PI + hueShift)
          + 0.003 * Math.sin(v * Math.PI * 5 + u * 6) * Math.sin(u * Math.PI),
      );

      const edge = Math.abs(v) ** 1.8;
      const tip = Math.max(0, (u - 0.8) / 0.2);
      const cream = new THREE.Color(isWeddingPage ? 0xfceee7 : 0xffefe7);
      const blush = new THREE.Color(isWeddingPage ? 0xf5c4cf : 0xf9d2dc);
      const rose = new THREE.Color(isWeddingPage ? 0xd67f99 : 0xe09bb0);
      const base = rose.clone().lerp(blush, 0.5 + ridge * 0.32);
      base.lerp(cream, Math.min(0.68, edge * 0.48 + tip * 0.2 + (1 - u) * 0.16));
      const shimmer = 0.96 + ridge * 0.12 + (1 - u) * 0.05;
      const veinShade = 1 - Math.max(0, Math.cos(v * Math.PI * 6)) * 0.02 * Math.sin(u * Math.PI);
      const r = Math.min(1, Math.max(0.18, base.r * shimmer * veinShade + hueShift * 0.008));
      const g = Math.min(1, Math.max(0.14, base.g * shimmer * veinShade));
      const b = Math.min(1, Math.max(0.18, base.b * shimmer * veinShade + hueShift * 0.008));
      colors.push(r, g, b);
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

function createPetalVeins(length, width, cup, color = 0xf4d2dd) {
  const veins = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.12,
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
  { count: 3, length: 0.56, width: 0.38, radius: 0.015, tilt: 0.78, cup: 0.32 },
  { count: 5, length: 0.96, width: 0.54, radius: 0.09, tilt: 0.42, cup: 0.22 },
  { count: 8, length: 1.34, width: 0.68, radius: 0.2, tilt: 0.14, cup: 0.14 },
  { count: 9, length: 1.62, width: 0.8, radius: 0.32, tilt: -0.04, cup: 0.08 },
];
const petals = [];

for (let ringIndex = petalRings.length - 1; ringIndex >= 0; ringIndex -= 1) {
  const ring = petalRings[ringIndex];
  const phaseOffset = ringIndex % 2 === 0 ? 0.18 : Math.PI / ring.count;

  for (let index = 0; index < ring.count; index += 1) {
    const angle = (index / ring.count) * Math.PI * 2 + phaseOffset;
    const petal = new THREE.Group();
    petal.rotation.z = angle + (ringIndex === 0 ? 0.2 : 0) + Math.sin(index * 2.1 + ringIndex) * 0.12;
    petal.rotation.y = ring.tilt + Math.sin(index * 7.4 + ringIndex) * 0.06;
    petal.rotation.x = 0.04 + ringIndex * 0.015 + Math.cos(index * 1.8) * 0.025;
    petal.position.x = Math.cos(angle) * ring.radius + Math.sin(angle * 3 + ringIndex) * 0.015;
    petal.position.y = Math.sin(angle) * ring.radius + Math.cos(angle * 2.5 + ringIndex) * 0.015;
    petal.position.z = (petalRings.length - 1 - ringIndex) * 0.055
      + Math.sin(angle * 2.2 + ringIndex) * 0.02 - 0.06;

    const geometry = createPetalGeometry(ring.length, ring.width, ring.cup, index % 3);
    const mesh = new THREE.Mesh(geometry, petalMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    petal.add(mesh);
    petal.scale.setScalar(0.15 + ringIndex * 0.012);
    petals.push({
      group: petal,
      angle,
      baseRotationZ: petal.rotation.z,
      baseRotationX: petal.rotation.x,
      ringIndex,
      phase: Math.random() * Math.PI * 2,
      openDelay: (4 - ringIndex) * 0.09,
    });
    rose.add(petal);
  }
}

function createTube(points, radius, material, segments = 64) {
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 8, false), material);
  rose.add(mesh);
  return mesh;
}

const crystalBloomMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color(isWeddingPage ? 0xf6dfe7 : 0xf4d9e8),
  emissive: new THREE.Color(isWeddingPage ? 0x6a2b43 : 0x8a3a64),
  emissiveIntensity: 0.25,
  roughness: 0.08,
  metalness: 0.04,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  transmission: 0.8,
  thickness: 1.1,
  ior: 1.46,
  transparent: true,
  opacity: 0.96,
  side: THREE.DoubleSide,
});

const crystalAccentMaterial = new THREE.MeshBasicMaterial({
  color: isWeddingPage ? 0xffeaf0 : 0xffedf7,
  transparent: true,
  opacity: 0.24,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const crystalStemMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color(isWeddingPage ? 0xf7d9df : 0xf3cedc),
  emissive: new THREE.Color(isWeddingPage ? 0x4a1f2d : 0x60213e),
  emissiveIntensity: 0.26,
  roughness: 0.1,
  metalness: 0.06,
  transmission: 0.8,
  transparent: true,
  opacity: 0.78,
});

const crystalStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.5, 18), crystalStemMaterial);
crystalStem.position.set(0, -1.0, 0);
crystalStem.rotation.z = Math.PI * 0.06;
crystalStem.scale.y = 0.4;
crystalStem.visible = false;
rose.add(crystalStem);

const glowTextureCanvas = document.createElement("canvas");
glowTextureCanvas.width = 128;
glowTextureCanvas.height = 128;
const glowContext = glowTextureCanvas.getContext("2d");
const glowGradient = glowContext.createRadialGradient(64, 64, 0, 64, 64, 64);
glowGradient.addColorStop(0, "rgba(255, 214, 225, 0.95)");
glowGradient.addColorStop(0.18, "rgba(244, 168, 190, 0.42)");
glowGradient.addColorStop(0.5, "rgba(162, 99, 118, 0.12)");
glowGradient.addColorStop(1, "rgba(43, 17, 31, 0)");
glowContext.fillStyle = glowGradient;
glowContext.fillRect(0, 0, 128, 128);
const glowTexture = new THREE.CanvasTexture(glowTextureCanvas);
const bloom = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTexture,
  color: 0xf5b5c8,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  opacity: 0.7,
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
  ? [0xf8d4a5, 0xf4b7c7, 0xdf879b, 0xfff2e8].map((color) => new THREE.Color(color))
  : [0xf7b7ce, 0xf6d7b5, 0xe58ca0, 0xfff5ec].map((color) => new THREE.Color(color));

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
    petal.group.rotation.z = petal.baseRotationZ + sway * 0.012;
    petal.group.rotation.x = petal.baseRotationX + Math.sin(time * 0.82 + petal.phase) * 0.025;
    petal.group.scale.set(
      0.12 + easedOpening * (0.88 + sway * 0.008),
      0.12 + easedOpening * (0.88 + sway * 0.014),
      0.12 + easedOpening * 0.88,
    );
  }

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
  bloom.material.opacity = 0.58 + (Math.sin(time * 1.45) + 1) * 0.1;
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