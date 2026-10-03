const navigationEntry = performance.getEntriesByType("navigation")[0];

if (navigationEntry?.type === "reload") {
  history.scrollRestoration = "manual";

  if (window.location.hash) {
    history.replaceState(history.state, "", `${window.location.pathname}${window.location.search}`);
  }

  window.addEventListener("pageshow", () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, { once: true });
}

const roseCanvas = document.querySelector("#rose-scene");
const probeCanvas = document.createElement("canvas");

try {
  if (!probeCanvas.getContext("webgl2") && !probeCanvas.getContext("webgl")) {
    throw new Error("WebGL is unavailable");
  }
  await import("./rose.js");
} catch {
  document.body.classList.add("webgl-fallback");
  roseCanvas.hidden = true;
}

const heroScene = document.querySelector(".wedding-scene");
let lastScrollY = window.scrollY;
let lastScrollDirection = 0;
let heroIsVisible = false;

window.addEventListener("scroll", () => {
  const currentScrollY = window.scrollY;
  if (currentScrollY !== lastScrollY) {
    lastScrollDirection = currentScrollY < lastScrollY ? -1 : 1;
    lastScrollY = currentScrollY;
  }
}, { passive: true });

if (heroScene && "IntersectionObserver" in window) {
  const heroObserver = new IntersectionObserver(([entry]) => {
    const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
    if (isVisible && !heroIsVisible && lastScrollDirection < 0) {
      window.dispatchEvent(new Event("rose:replay"));
    }
    heroIsVisible = isVisible;
  }, { threshold: [0, 0.25] });
  heroObserver.observe(heroScene);
}

const petalField = document.querySelector(".wedding-scene__petals");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (petalField && !reducedMotion.matches) {
  for (let index = 0; index < 9; index += 1) {
    const petal = document.createElement("span");
    petal.className = "wedding-petal";
    petal.style.setProperty("--left", `${8 + index * 11}%`);
    petal.style.setProperty("--size", `${8 + (index % 3) * 3}px`);
    petal.style.setProperty("--delay", `${-index * 1.8}s`);
    petal.style.setProperty("--duration", `${17 + (index % 4) * 2}s`);
    petal.style.setProperty("--drift", `${index % 2 === 0 ? 52 : -42}px`);
    petalField.append(petal);
  }
}

const shareButton = document.querySelector(".wedding__share");
const shareStatus = document.querySelector(".wedding__status");

shareButton?.addEventListener("click", async () => {
  const shareData = {
    title: document.title,
    text: "Một lời chúc mừng ngày hạnh phúc dành tặng Ngọc Ánh.",
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(shareData.url);
    shareStatus.textContent = "Đã sao chép liên kết thiệp.";
  } catch (error) {
    if (error.name !== "AbortError") {
      shareStatus.textContent = "Không thể chia sẻ trên thiết bị này.";
    }
  }
});