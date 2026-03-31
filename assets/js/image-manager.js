// Página "Gestor de Imagens":
// Guarda (em localStorage) os nomes de ficheiros de antes/depois/anime para cada ponto.

const STORAGE_KEY = "fundao:imageOverrides:v1";

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function saveOverrides(overrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

function normalizarNome(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  return trimmed.replaceAll("\\", "/");
}

function normalizeImagePath(rawPath) {
  if (!rawPath) return "";
  let pathClean = rawPath.trim().replaceAll("\\", "/");
  if (!pathClean) return "";
  pathClean = pathClean.replace(/\/+/g, "/");
  return encodeURI(pathClean);
}

function createInlinePlaceholder(label) {
  const safe = String(label || "").replace(/[<>&"]/g, "");
  const folder = safe === "Antes" ? "before" : safe === "Depois" ? "after" : "anime";
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1120"/>
      <stop offset="1" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#g)"/>
  <text x="50%" y="45%" text-anchor="middle" font-size="28" fill="#cbd5e1" font-family="Segoe UI, system-ui">📷 Imagem ${safe}</text>
  <text x="50%" y="60%" text-anchor="middle" font-size="14" fill="#94a3b8" font-family="Segoe UI, system-ui">Coloca o ficheiro em images/${folder}/</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function applyImageFallback(img, label) {
  if (!img) return;
  img.addEventListener(
    "error",
    () => {
      img.onerror = null;
      img.src = createInlinePlaceholder(label);
    },
    { once: true }
  );
}

function toBeforePath(value) {
  const v = normalizarNome(value);
  let pathBase = "";
  if (!v) return "";
  if (v.startsWith("images/")) pathBase = v;
  else pathBase = `images/before/${v}`;
  return normalizeImagePath(pathBase);
}

function toAfterPath(value) {
  const v = normalizarNome(value);
  let pathBase = "";
  if (!v) return "";
  if (v.startsWith("images/")) pathBase = v;
  else pathBase = `images/after/${v}`;
  return normalizeImagePath(pathBase);
}

function toAnimePath(value) {
  const v = normalizarNome(value);
  let pathBase = "";
  if (!v) return "";
  if (v.startsWith("images/")) pathBase = v;
  else pathBase = `images/anime/${v}`;
  return normalizeImagePath(pathBase);
}

function getImagePath(point, overrides, kind) {
  const override = overrides?.[point.id]?.[kind] || "";
  const fromOverride =
    kind === "before"
      ? toBeforePath(override)
      : kind === "after"
      ? toAfterPath(override)
      : kind === "anime"
      ? toAnimePath(override)
      : "";
  if (fromOverride) return fromOverride;

  if (kind === "before") return point.beforeImage || "";
  if (kind === "after") return point.afterImage || "";
  return point.animeImage || "";
}

function renderGallery(overrides) {
  const gallery = document.getElementById("image-gallery");
  if (!gallery) return;
  gallery.innerHTML = "";

  FUNDAO_POINTS.forEach((point) => {
    const card = document.createElement("article");
    card.className = "gallery-card";

    const beforePath = getImagePath(point, overrides, "before");
    const afterPath = getImagePath(point, overrides, "after");
    const animePath = getImagePath(point, overrides, "anime");

    card.innerHTML = `
      <div class="gallery-header">
        <div>
          <h3>${point.name}</h3>
          <p class="gallery-meta">${point.category}</p>
        </div>
        <span class="chip">${point.tags?.[0] || "Imagem"}</span>
      </div>
      <div class="gallery-photos">
        <figure>
          <img loading="lazy" src="${beforePath || createInlinePlaceholder("Antes")}" alt="Antes de ${point.name}" />
          <figcaption>Antes</figcaption>
        </figure>
        <figure>
          <img loading="lazy" src="${afterPath || createInlinePlaceholder("Depois")}" alt="Depois de ${point.name}" />
          <figcaption>Depois</figcaption>
        </figure>
        <figure>
          <img loading="lazy" src="${animePath || createInlinePlaceholder("Anime")}" alt="Anime de ${point.name}" />
          <figcaption>Anime</figcaption>
        </figure>
      </div>
      <div class="gallery-footer">
        <button class="btn-ghost" type="button" data-id="${point.id}" data-action="focus">📍 Ver no mapa</button>
      </div>
    `;

    const galleryImages = card.querySelectorAll("img");
    galleryImages.forEach((img) => {
      const label = img.alt?.includes("Antes")
        ? "Antes"
        : img.alt?.includes("Depois")
        ? "Depois"
        : "Anime";
      if (!img.src) {
        img.src = createInlinePlaceholder(label);
      }
      applyImageFallback(img, label);
    });

    gallery.appendChild(card);
  });
}

function createRow(point, overrides) {
  const wrapper = document.createElement("div");
  wrapper.className = "row";

  const title = document.createElement("div");
  title.className = "row-title";
  title.textContent = point.name;

  const meta = document.createElement("div");
  meta.className = "row-meta";
  meta.textContent = point.category;

  const beforeInput = document.createElement("input");
  beforeInput.className = "row-input";
  beforeInput.placeholder = "ANTES (ex.: foto-antes.jpg)";
  beforeInput.dataset.kind = "before";
  beforeInput.dataset.id = point.id;

  const afterInput = document.createElement("input");
  afterInput.className = "row-input";
  afterInput.placeholder = "DEPOIS (ex.: depois.jpg)";
  afterInput.dataset.kind = "after";
  afterInput.dataset.id = point.id;

  const animeInput = document.createElement("input");
  animeInput.className = "row-input";
  animeInput.placeholder = "ANIME (ex.: anime.jpg)";
  animeInput.dataset.kind = "anime";
  animeInput.dataset.id = point.id;

  const saved = overrides[point.id] || {};
  if (saved.before) beforeInput.value = saved.before;
  if (saved.after) afterInput.value = saved.after;
  if (saved.anime) animeInput.value = saved.anime;

  const preview = document.createElement("div");
  preview.className = "row-preview";
  preview.innerHTML = `
    <div class="row-preview-box">
      <div class="row-preview-label">Antes</div>
      <img class="row-preview-img" alt="preview antes" />
    </div>
    <div class="row-preview-box">
      <div class="row-preview-label">Depois</div>
      <img class="row-preview-img" alt="preview depois" />
    </div>
    <div class="row-preview-box">
      <div class="row-preview-label">Anime</div>
      <img class="row-preview-img" alt="preview anime" />
    </div>
  `;

  const [imgBefore, imgAfter, imgAnimePreview] = preview.querySelectorAll("img");

  function updatePreview() {
    const before = toBeforePath(beforeInput.value) || point.beforeImage || "";
    const after = toAfterPath(afterInput.value) || point.afterImage || "";
    const anime = toAnimePath(animeInput.value) || point.animeImage || "";
    imgBefore.src = before || createInlinePlaceholder("Antes");
    imgAfter.src = after || createInlinePlaceholder("Depois");
    imgAnimePreview.src = anime || createInlinePlaceholder("Anime");
  }

  [imgBefore, imgAfter, imgAnimePreview].forEach((img, index) => {
    const label = index === 0 ? "Antes" : index === 1 ? "Depois" : "Anime";
    applyImageFallback(img, label);
  });

  beforeInput.addEventListener("input", updatePreview);
  afterInput.addEventListener("input", updatePreview);
  animeInput.addEventListener("input", updatePreview);
  updatePreview();

  wrapper.appendChild(title);
  wrapper.appendChild(meta);
  wrapper.appendChild(beforeInput);
  wrapper.appendChild(afterInput);
  wrapper.appendChild(animeInput);
  wrapper.appendChild(preview);

  return wrapper;
}

function collectOverridesFromUI() {
  const overrides = {};
  const inputs = document.querySelectorAll(".row-input");

  inputs.forEach((input) => {
    const id = input.dataset.id;
    const kind = input.dataset.kind;
    if (!id || !kind) return;

    overrides[id] = overrides[id] || {};
    const value = normalizarNome(input.value);
    if (!value) return;

    if (kind === "before") overrides[id].before = value;
    if (kind === "after") overrides[id].after = value;
    if (kind === "anime") overrides[id].anime = value;
  });

  return overrides;
}

function init() {
  const rowsEl = document.getElementById("rows");
  const statusEl = document.getElementById("status");
  const saveBtn = document.getElementById("save");
  const resetBtn = document.getElementById("reset");

  const overrides = loadOverrides();

  renderGallery(overrides);
  FUNDAO_POINTS.forEach((point) => {
    rowsEl.appendChild(createRow(point, overrides));
  });

  saveBtn.addEventListener("click", () => {
    const newOverrides = collectOverridesFromUI();
    saveOverrides(newOverrides);
    renderGallery(newOverrides);
    statusEl.textContent = "✅ Guardado com sucesso! Agora abre o mapa e clica nos pontos para ver as imagens.";
    setTimeout(() => {
      statusEl.textContent = "";
    }, 3000);
  });

  resetBtn.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    renderGallery({});
    statusEl.textContent = "🗑️ Limpo. Recarrega a página para voltar ao estado inicial.";
    setTimeout(() => {
      statusEl.textContent = "";
    }, 3000);
  });

  document.getElementById("image-gallery")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action='focus']");
    if (!button) return;
    const pointId = button.dataset.id;
    const point = FUNDAO_POINTS.find((p) => p.id === pointId);
    if (!point) return;
    window.location.href = `index.html#${point.id}`;
  });
}

document.addEventListener("DOMContentLoaded", init);