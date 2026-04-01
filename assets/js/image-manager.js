// ============================================
// Gestor de Imagens - Versão Melhorada
// ============================================

const STORAGE_KEY = "fundao:imageOverrides:v1";

// ============================================
// UTILITÁRIOS
// ============================================
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#1f2937"/>
    <text x="200" y="150" text-anchor="middle" font-size="20" fill="#9ca3af">${safe}</text>
    <text x="200" y="190" text-anchor="middle" font-size="12" fill="#6b7280">images/${folder}/</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function applyImageFallback(img, label) {
  if (!img) return;
  img.addEventListener("error", () => {
    img.onerror = null;
    img.src = createInlinePlaceholder(label);
  }, { once: true });
}

function toBeforePath(value) {
  const v = normalizarNome(value);
  if (!v) return "";
  if (v.startsWith("images/")) return normalizeImagePath(v);
  return normalizeImagePath(`images/before/${v}`);
}

function toAfterPath(value) {
  const v = normalizarNome(value);
  if (!v) return "";
  if (v.startsWith("images/")) return normalizeImagePath(v);
  return normalizeImagePath(`images/after/${v}`);
}

function toAnimePath(value) {
  const v = normalizarNome(value);
  if (!v) return "";
  if (v.startsWith("images/")) return normalizeImagePath(v);
  return normalizeImagePath(`images/anime/${v}`);
}

function getImagePath(point, overrides, kind) {
  const override = overrides?.[point.id]?.[kind] || "";
  const fromOverride = kind === "before" ? toBeforePath(override)
    : kind === "after" ? toAfterPath(override)
    : kind === "anime" ? toAnimePath(override) : "";
  
  if (fromOverride) return fromOverride;

  if (kind === "before") return point.beforeImage || "";
  if (kind === "after") return point.afterImage || "";
  return point.animeImage || "";
}

// ============================================
// GALERIA VISUAL
// ============================================
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
          <h3>${escapeHtml(point.name)}</h3>
          <p class="gallery-meta">${escapeHtml(point.category)}</p>
        </div>
        <span class="chip">${point.tags?.[0] || "Ponto"}</span>
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
        <button class="btn-ghost" type="button" data-id="${point.id}" data-action="focus">
          <i class="fas fa-map-marker-alt"></i> Ver no mapa
        </button>
      </div>
    `;

    const galleryImages = card.querySelectorAll("img");
    galleryImages.forEach((img, idx) => {
      const label = idx === 0 ? "Antes" : idx === 1 ? "Depois" : "Anime";
      applyImageFallback(img, label);
    });

    gallery.appendChild(card);
  });
}

// ============================================
// LINHAS DE EDIÇÃO
// ============================================
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

// ============================================
// ESCAPE HTML
// ============================================
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ============================================
// INICIALIZAÇÃO
// ============================================
function init() {
  const rowsEl = document.getElementById("rows");
  const statusEl = document.getElementById("status");
  const saveBtn = document.getElementById("save");
  const resetBtn = document.getElementById("reset");

  if (!rowsEl) return;

  const overrides = loadOverrides();

  renderGallery(overrides);
  
  FUNDAO_POINTS.forEach((point) => {
    rowsEl.appendChild(createRow(point, overrides));
  });

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const newOverrides = collectOverridesFromUI();
      saveOverrides(newOverrides);
      renderGallery(newOverrides);
      if (statusEl) {
        statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Guardado com sucesso!';
        setTimeout(() => {
          statusEl.innerHTML = "";
        }, 3000);
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      renderGallery({});
      if (statusEl) {
        statusEl.innerHTML = '<i class="fas fa-trash-alt"></i> Limpo. Recarregue para voltar ao estado inicial.';
        setTimeout(() => {
          statusEl.innerHTML = "";
        }, 3000);
      }
      // Recarregar os inputs com valores vazios
      const inputs = document.querySelectorAll(".row-input");
      inputs.forEach(input => {
        input.value = "";
      });
    });
  }

  // Navegação para o mapa
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