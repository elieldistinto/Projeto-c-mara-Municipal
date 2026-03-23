// Página "Gestor de Imagens":
// Guarda (em localStorage) os nomes de ficheiros de antes/depois para cada ponto.
// Assim podes ter nomes diferentes sem mexer no data/locations.js.

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
  // Permite caminhos completos tipo images/after/x.jpg, ou apenas o nome x.jpg
  return trimmed.replaceAll("\\", "/");
}

function toBeforePath(value) {
  const v = normalizarNome(value);
  if (!v) return "";
  if (v.startsWith("images/")) return v;
  return `images/before/${v}`;
}

function toAfterPath(value) {
  const v = normalizarNome(value);
  if (!v) return "";
  if (v.startsWith("images/")) return v;
  return `images/after/${v}`;
}

function getImagePath(point, overrides, kind) {
  const override = overrides?.[point.id]?.[kind] || "";
  const fromOverride = kind === "before" ? toBeforePath(override) : toAfterPath(override);
  if (fromOverride) return fromOverride;

  if (kind === "before") return point.beforeImage || "";
  return point.afterImage || "";
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
          <img loading="lazy" src="${beforePath}" alt="Antes de ${point.name}" />
          <figcaption>Antes</figcaption>
        </figure>
        <figure>
          <img loading="lazy" src="${afterPath}" alt="Depois de ${point.name}" />
          <figcaption>Depois</figcaption>
        </figure>
      </div>
      <div class="gallery-footer">
        <button class="btn-ghost" type="button" data-id="${point.id}" data-action="focus">Ver no mapa</button>
      </div>
    `;

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
  afterInput.placeholder = "DEPOIS (ex.: 2547157168.jpg)";
  afterInput.dataset.kind = "after";
  afterInput.dataset.id = point.id;

  const saved = overrides[point.id] || {};
  if (saved.before) beforeInput.value = saved.before;
  if (saved.after) afterInput.value = saved.after;

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
  `;

  const [imgBefore, imgAfter] = preview.querySelectorAll("img");

  function updatePreview() {
    const before = toBeforePath(beforeInput.value) || point.beforeImage || "";
    const after = toAfterPath(afterInput.value) || point.afterImage || "";
    imgBefore.src = before;
    imgAfter.src = after;
  }

  beforeInput.addEventListener("input", updatePreview);
  afterInput.addEventListener("input", updatePreview);
  updatePreview();

  wrapper.appendChild(title);
  wrapper.appendChild(meta);
  wrapper.appendChild(beforeInput);
  wrapper.appendChild(afterInput);
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

    // Guardamos só o texto que o utilizador escreveu (nome ou caminho).
    // No mapa, vamos inferir a pasta correta se for apenas nome.
    if (kind === "before") overrides[id].before = value;
    if (kind === "after") overrides[id].after = value;
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
    statusEl.textContent =
      "Guardado com sucesso. Agora abre o mapa e clica nos pontos para ver as imagens.";
  });

  resetBtn.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    renderGallery({});
    statusEl.textContent = "Limpo. Recarrega a página para voltar ao estado inicial.";
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

