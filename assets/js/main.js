// Inicialização do mapa Leaflet e lógica de interação principal.
// Este ficheiro assume que o ficheiro data/locations.js já foi carregado
// e que as constantes MAP_CENTER, FUNDAO_POINTS e FUNDAO_ROUTES existem.

let map;
let markersLayer;
let activeRouteLayer = null;
let markersById = {};
let selectedPoiId = null;
const IMAGE_OVERRIDES_KEY = "fundao:imageOverrides:v1";
const UI_OVERRIDES_KEY = "fundao:ui:v1";
let animeModeEnabled = true;
let mapLayer = null;
let satelliteLayer = null;
let labelsLayer = null;
let realRouteBaseLayer = null;
let realRouteOverlayLayer = null;
let realRouteMarker = null;
let realRouteAnimRaf = null;
let realRouteAbortController = null;

const OSRM_BASE_URL = "https://router.project-osrm.org";

// Função principal de arranque da aplicação
function init() {
  initTheme();
  initMap();
  renderPoints();
  initUI();
  applyHashFocus();
  window.addEventListener("hashchange", applyHashFocus);
}

// Função para alternar tema claro/escuro
function initTheme() {
  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) return;
  
  // Verificar tema salvo no localStorage
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
  }
  
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });
}

// Cria e configura o mapa centrado na zona do Casino Fundanense
function initMap() {
  map = L.map("map", {
    zoomControl: true,
  }).setView([MAP_CENTER.lat, MAP_CENTER.lng], MAP_CENTER.zoom);

  // Camadas base:
  mapLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  });

  satelliteLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    }
  );

  labelsLayer = L.tileLayer(
    "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution: "Labels &copy; Esri",
      opacity: 0.92,
    }
  );

  satelliteLayer.addTo(map);
  labelsLayer.addTo(map);

  L.control
    .layers(
      {
        "Satélite": satelliteLayer,
        "Mapa": mapLayer,
      },
      {
        "Labels (satélite)": labelsLayer,
      },
      { position: "topright" }
    )
    .addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  const ui = loadUiState();
  animeModeEnabled = ui.animeModeEnabled ?? true;
  setAnimeMode(animeModeEnabled);
}

// Cria marcadores no mapa e a lista lateral de pontos de interesse
function renderPoints() {
  const listEl = document.getElementById("poi-list");
  listEl.innerHTML = "";
  markersById = {};

  FUNDAO_POINTS.forEach((point) => {
    const marker = L.marker([point.lat, point.lng]).addTo(markersLayer);
    markersById[point.id] = marker;

    const popupHtml = createPopupHtml(point);
    marker.bindPopup(popupHtml);

    marker.on("popupopen", (e) => {
      attachPopupEvents(e.popup, point);
    });

    const itemEl = createPoiListItem(point);
    listEl.appendChild(itemEl);

    itemEl.addEventListener("click", () => {
      focusOnPoint(point);
    });
  });

  fitMapToPoints();
}

// Configura a interface (apenas rota real, sem percursos)
function initUI() {
  initRealRoutePlanner();
  initModal();
  initCompareSlider();
  initAnimeToggle();
}

function initAnimeToggle() {
  const btn = createMapToggleButton();
  if (!btn) return;
  btn.textContent = animeModeEnabled ? "Anime: ON" : "Anime: OFF";
  btn.addEventListener("click", () => {
    animeModeEnabled = !animeModeEnabled;
    setAnimeMode(animeModeEnabled);
    saveUiState({ animeModeEnabled });
    btn.textContent = animeModeEnabled ? "Anime: ON" : "Anime: OFF";
  });
}

function createMapToggleButton() {
  if (!map) return null;

  const Control = L.Control.extend({
    onAdd() {
      const btn = L.DomUtil.create("button", "leaflet-anime-toggle");
      btn.type = "button";
      btn.title = "Ativar/desativar filtro anime";
      btn.style.cssText = `
        background: linear-gradient(135deg, #7c3aed, #5b21b6);
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        color: white;
        font-weight: bold;
        cursor: pointer;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
      L.DomEvent.disableClickPropagation(btn);
      return btn;
    },
  });

  const ctrl = new Control({ position: "topright" });
  ctrl.addTo(map);
  return document.querySelector(".leaflet-anime-toggle");
}

function setAnimeMode(enabled) {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;
  if (enabled) mapEl.classList.add("map-anime");
  else mapEl.classList.remove("map-anime");
}

function loadUiState() {
  try {
    const raw = localStorage.getItem(UI_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function saveUiState(partial) {
  const current = loadUiState();
  const next = { ...current, ...partial };
  localStorage.setItem(UI_OVERRIDES_KEY, JSON.stringify(next));
}

// Cria o HTML interno de cada popup do Leaflet
function createPopupHtml(point) {
  const tagsText = point.tags && point.tags.length ? point.tags.join(", ") : "";

  return `
    <div class="popup">
      <div class="popup-title">${point.name}</div>
      <div class="popup-desc">${point.shortDescription}</div>
      <div class="popup-footer">
        <span class="popup-category">${point.category}</span>
        <div class="popup-actions">
          <button class="icon-button js-open-compare" data-id="${point.id}" title="Ver Antes / Depois">⇆</button>
          <button class="icon-button js-open-route" data-lat="${point.lat}" data-lng="${point.lng}" title="Abrir rota no Google Maps">↗</button>
          <button class="icon-button js-open-real-route" data-id="${point.id}" title="Traçar rota real (tempo / distância)">RT</button>
        </div>
      </div>
      ${tagsText ? `<div style="margin-top:6px;font-size:11px;color:#9ca3af;">${tagsText}</div>` : ""}
    </div>
  `;
}

// Liga eventos no conteúdo do popup
function attachPopupEvents(popup, point) {
  const container = popup.getElement();
  if (!container) return;

  const btnCompare = container.querySelector(".js-open-compare");
  if (btnCompare) {
    btnCompare.addEventListener("click", () => {
      openCompareModal(point);
    });
  }

  const btnRoute = container.querySelector(".js-open-route");
  if (btnRoute) {
    btnRoute.addEventListener("click", () => {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`;
      window.open(url, "_blank");
    });
  }

  const btnRealRoute = container.querySelector(".js-open-real-route");
  if (btnRealRoute) {
    btnRealRoute.addEventListener("click", () => {
      openRealRoute(point);
    });
  }
}

// Cria um item de lista na barra lateral
function createPoiListItem(point) {
  const li = document.createElement("li");
  li.className = "poi-item";
  li.dataset.id = point.id;

  const left = document.createElement("div");
  left.className = "poi-item-meta";

  const title = document.createElement("div");
  title.className = "poi-item-title";
  title.textContent = point.name;

  const desc = document.createElement("div");
  desc.className = "poi-item-desc";
  desc.textContent = point.shortDescription;

  left.appendChild(title);
  left.appendChild(desc);

  const right = document.createElement("div");
  right.className = "poi-item-actions";

  const chip = document.createElement("span");
  chip.className = "chip";
  chip.textContent = point.category;

  const button = document.createElement("button");
  button.className = "icon-button";
  button.title = "Ver comparação Antes / Depois";
  button.textContent = "⇆";
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    openCompareModal(point);
  });

  right.appendChild(chip);
  right.appendChild(button);

  li.appendChild(left);
  li.appendChild(right);

  return li;
}

// Centraliza o mapa num ponto específico e abre o popup
function focusOnPoint(point) {
  if (!map) return;
  const marker = markersById[point.id];
  if (!marker) return;

  map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), MAP_CENTER.zoom), {
    duration: 0.9,
  });

  marker.openPopup();
  highlightPoi(point.id);
}

// Ajusta a vista do mapa para incluir todos os marcadores
function fitMapToPoints() {
  if (!FUNDAO_POINTS.length) return;

  const bounds = L.latLngBounds(
    FUNDAO_POINTS.map((p) => [p.lat, p.lng])
  );
  map.fitBounds(bounds, { padding: [40, 40] });
}

function applyHashFocus() {
  const hashId = window.location.hash.replace("#", "").trim();
  if (!hashId) return;
  const point = FUNDAO_POINTS.find((p) => p.id === hashId);
  if (point) {
    focusOnPoint(point);
  }
}

function highlightPoi(poiId) {
  selectedPoiId = poiId;
  const items = document.querySelectorAll(".poi-item");
  items.forEach((item) => {
    if (item.dataset.id === poiId) {
      item.classList.add("poi-item--active");
    } else {
      item.classList.remove("poi-item--active");
    }
  });
}

function initRealRoutePlanner() {
  const destSelect = document.getElementById("real-destination");
  const modeSelect = document.getElementById("real-mode");
  const routeBtn = document.getElementById("real-route-btn");
  const clearBtn = document.getElementById("real-route-clear");
  const statsEl = document.getElementById("real-route-stats");
  const errorEl = document.getElementById("real-route-error");

  if (!destSelect || !modeSelect || !routeBtn || !clearBtn || !statsEl || !errorEl) {
    return;
  }

  FUNDAO_POINTS.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    destSelect.appendChild(opt);
  });

  const setLoading = (isLoading) => {
    routeBtn.disabled = isLoading;
    clearBtn.disabled = isLoading;
    if (isLoading) {
      routeBtn.textContent = "A calcular...";
      statsEl.textContent = "A calcular rota...";
    } else {
      routeBtn.textContent = "Traçar rota real";
    }
  };

  const setError = (msg) => {
    errorEl.textContent = msg || "";
  };

  const onPlan = async () => {
    setError("");
    if (!destSelect.value) {
      setError("Seleciona um destino.");
      return;
    }

    const dest = FUNDAO_POINTS.find((p) => p.id === destSelect.value);
    if (!dest) {
      setError("Destino inválido.");
      return;
    }

    await computeAndRenderRealRoute(dest, modeSelect.value, {
      setLoading,
      statsEl,
      setError,
    });
  };

  routeBtn.addEventListener("click", onPlan);

  clearBtn.addEventListener("click", () => {
    clearRealRoute();
    statsEl.textContent = "";
    setError("");
  });

  if (!destSelect.value && FUNDAO_POINTS[0]) {
    destSelect.value = FUNDAO_POINTS[0].id;
  }
}

function requestUserGeolocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalização indisponível no teu navegador."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        const msg = err && err.message ? err.message : "Não foi possível obter a tua localização. Ativa o GPS e tenta novamente.";
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 30000,
      }
    );
  });
}

async function fetchOsrmRouteProfile(start, end, profile, signal) {
  const url = `${OSRM_BASE_URL}/route/v1/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=false`;

  const res = await fetch(url, {
    method: "GET",
    signal,
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Falha ao calcular rota (HTTP ${res.status}).`);
  }

  const data = await res.json();
  const route = data?.routes?.[0];
  if (!route || !route.geometry?.coordinates?.length) {
    throw new Error("Sem rota encontrada entre os pontos.");
  }

  const latlngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  return {
    latlngs,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}

async function fetchOsrmRouteWithFallback(start, end, mode, signal) {
  const preferredProfile = mode === "walking" ? "walking" : "driving";
  try {
    return await fetchOsrmRouteProfile(start, end, preferredProfile, signal);
  } catch (err) {
    if (preferredProfile === "walking") {
      return await fetchOsrmRouteProfile(start, end, "driving", signal);
    }
    throw err;
  }
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}

function formatDistance(meters) {
  if (!Number.isFinite(meters) || meters <= 0) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  const decimals = km < 5 ? 1 : 0;
  return `${km.toFixed(decimals)} km`;
}

function clearRealRoute() {
  if (!map) return;

  if (realRouteBaseLayer) {
    map.removeLayer(realRouteBaseLayer);
    realRouteBaseLayer = null;
  }
  if (realRouteOverlayLayer) {
    map.removeLayer(realRouteOverlayLayer);
    realRouteOverlayLayer = null;
  }
  if (realRouteMarker) {
    map.removeLayer(realRouteMarker);
    realRouteMarker = null;
  }

  if (realRouteAnimRaf) {
    cancelAnimationFrame(realRouteAnimRaf);
    realRouteAnimRaf = null;
  }

  if (realRouteAbortController) {
    realRouteAbortController.abort();
    realRouteAbortController = null;
  }
}

function animateMarkerAlongRoute(latlngs, durationSeconds) {
  if (!latlngs || !latlngs.length) return;

  const startLatLng = latlngs[0];
  const icon = L.divIcon({
    className: "route-pulse-marker",
    html: '<div class="route-pulse-dot" aria-hidden="true"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  realRouteMarker = L.marker(startLatLng, {
    icon,
    interactive: false,
    zIndexOffset: 1000,
  }).addTo(map);

  const totalMs = Math.max(6000, Math.round(durationSeconds * 1000));
  const n = latlngs.length;
  const startTime = performance.now();

  const step = () => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(1, elapsed / totalMs);

    const idxFloat = progress * (n - 1);
    const idx = Math.floor(idxFloat);
    const t = idxFloat - idx;

    const a = latlngs[idx];
    const b = latlngs[Math.min(n - 1, idx + 1)];

    const lat = a[0] + (b[0] - a[0]) * t;
    const lng = a[1] + (b[1] - a[1]) * t;

    realRouteMarker.setLatLng([lat, lng]);

    if (progress < 1) {
      realRouteAnimRaf = requestAnimationFrame(step);
    }
  };

  realRouteAnimRaf = requestAnimationFrame(step);
}

function renderRealRoute(latlngs) {
  realRouteBaseLayer = L.polyline(latlngs, {
    color: "#020617",
    weight: 10,
    opacity: 0.55,
    lineJoin: "round",
    lineCap: "round",
  }).addTo(map);

  realRouteOverlayLayer = L.polyline(latlngs, {
    color: "#7cf8ff",
    weight: 4,
    opacity: 0.95,
    lineJoin: "round",
    lineCap: "round",
    dashArray: "10 10",
  }).addTo(map);

  map.fitBounds(realRouteOverlayLayer.getBounds(), { padding: [40, 40] });
}

async function computeAndRenderRealRoute(destPoint, mode, ui) {
  const { setLoading, statsEl, setError } = ui || {};

  clearRealRoute();

  const routeBtn = document.getElementById("real-route-btn");
  const errorFallback = "Erro ao calcular rota. Tenta novamente.";

  try {
    setLoading?.(true);
    setError?.("");

    const start = await requestUserGeolocation();

    realRouteAbortController = new AbortController();
    const route = await fetchOsrmRouteWithFallback(
      start,
      { lat: destPoint.lat, lng: destPoint.lng },
      mode,
      realRouteAbortController.signal
    );

    renderRealRoute(route.latlngs);
    animateMarkerAlongRoute(route.latlngs, route.durationSeconds);

    if (statsEl) {
      statsEl.textContent = `Tempo estimado: ${formatDuration(route.durationSeconds)} · Distância: ${formatDistance(route.distanceMeters)}`;
    }
  } catch (err) {
    const msg = err?.name === "AbortError" ? "" : err?.message || errorFallback;
    setError?.(msg);
  } finally {
    setLoading?.(false);
    if (routeBtn) routeBtn.textContent = "Traçar rota real";
  }
}

async function openRealRoute(point) {
  const destSelect = document.getElementById("real-destination");
  if (destSelect && point?.id) destSelect.value = point.id;

  const modeSelect = document.getElementById("real-mode");
  const mode = modeSelect?.value || "driving";

  const statsEl = document.getElementById("real-route-stats");
  const errorEl = document.getElementById("real-route-error");

  await computeAndRenderRealRoute(point, mode, {
    setLoading: (isLoading) => {
      const routeBtn = document.getElementById("real-route-btn");
      const clearBtn = document.getElementById("real-route-clear");
      if (routeBtn) routeBtn.disabled = isLoading;
      if (clearBtn) clearBtn.disabled = isLoading;
      if (routeBtn) routeBtn.textContent = isLoading ? "A calcular..." : "Traçar rota real";
      if (statsEl) statsEl.textContent = isLoading ? "A calcular rota..." : statsEl.textContent;
    },
    statsEl,
    setError: (msg) => {
      if (errorEl) errorEl.textContent = msg || "";
    },
  });
}

// Inicialização da janela modal de comparação
function initModal() {
  const modal = document.getElementById("compare-modal");
  const closeBtn = document.getElementById("modal-close");
  const backdrop = modal.querySelector(".modal-backdrop");

  closeBtn.addEventListener("click", () => {
    closeModal();
  });

  backdrop.addEventListener("click", () => {
    closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });
}

function loadImageOverrides() {
  try {
    const raw = localStorage.getItem(IMAGE_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function normalizeImagePath(rawPath) {
  if (!rawPath) return "";
  let clean = String(rawPath).trim().replaceAll("\\", "/");
  if (!clean) return "";
  clean = clean.replace(/\/+/g, "/");
  return encodeURI(clean);
}

function resolveOverridePath(value, kind) {
  const v = (value || "").trim().replaceAll("\\", "/");
  if (!v) return "";
  if (v.startsWith("images/")) return v;
  if (kind === "before") return `images/before/${v}`;
  if (kind === "after") return `images/after/${v}`;
  if (kind === "anime") return `images/anime/${v}`;
  return v;
}

function createInlinePlaceholder(label) {
  const safe = String(label || "").replace(/[<>&"]/g, "");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1120"/>
      <stop offset="1" stop-color="#1e1b4b"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <text x="50%" y="48%" text-anchor="middle" font-size="56" fill="#f9fafb" font-family="Segoe UI, system-ui">Imagem ${safe}</text>
  <text x="50%" y="58%" text-anchor="middle" font-size="28" fill="#9ca3af" font-family="Segoe UI, system-ui">Coloca o ficheiro em images/</text>
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

// Abre o modal e atualiza as informações e imagens
function openCompareModal(point) {
  const modal = document.getElementById("compare-modal");

  const titleEl = document.getElementById("modal-title");
  const descEl = document.getElementById("modal-description");
  const categoryEl = document.getElementById("modal-category");
  const tagsEl = document.getElementById("modal-tags");
  const imgBeforeEl = document.getElementById("img-before");
  const imgAfterEl = document.getElementById("img-after");

  titleEl.textContent = point.name;
  descEl.textContent = point.description || point.shortDescription;
  categoryEl.textContent = point.category;
  tagsEl.textContent = point.tags && point.tags.length ? point.tags.join(", ") : "Sem tags definidas";

  const overrides = loadImageOverrides();
  const override = overrides[point.id] || {};

  const beforePath = normalizeImagePath(resolveOverridePath(override.before, "before") || point.beforeImage || "");
  const afterPath = normalizeImagePath(resolveOverridePath(override.after, "after") || point.afterImage || "");
  const animePath = normalizeImagePath(resolveOverridePath(override.anime, "anime") || point.animeImage || "");

  imgBeforeEl.src = beforePath || createInlinePlaceholder("Antes");
  imgAfterEl.src = afterPath || createInlinePlaceholder("Depois");
  
  const imgAnimeEl = document.getElementById("img-anime");
  if (imgAnimeEl) {
    imgAnimeEl.src = animePath || createInlinePlaceholder("Anime");
    applyImageFallback(imgAnimeEl, "Anime");
  }

  applyImageFallback(imgBeforeEl, "Antes");
  applyImageFallback(imgAfterEl, "Depois");

  const slider = document.getElementById("compare-slider");
  slider.value = 50;
  updateCompareOverlay(slider.value);

  modal.classList.remove("hidden");
}

function closeModal() {
  const modal = document.getElementById("compare-modal");
  modal.classList.add("hidden");
}

function initCompareSlider() {
  const slider = document.getElementById("compare-slider");
  slider.addEventListener("input", () => {
    updateCompareOverlay(slider.value);
  });
}

function updateCompareOverlay(value) {
  const overlay = document.getElementById("after-overlay");
  overlay.style.width = `${value}%`;
}

document.addEventListener("DOMContentLoaded", init);