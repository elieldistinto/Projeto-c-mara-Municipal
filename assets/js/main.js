// ============================================
// Mapa Interativo da Cidade do Fundão
// Versão Corrigida - Workshop
// ============================================

// Variáveis Globais
let map;
let markersLayer;
let activeRouteLayer = null;
let markersById = {};
let selectedPoiId = null;
let animeModeEnabled = true;
let mapLayer = null;
let satelliteLayer = null;
let labelsLayer = null;
let realRouteBaseLayer = null;
let realRouteOverlayLayer = null;
let realRouteMarker = null;
let realRouteAnimRaf = null;
let realRouteAbortController = null;

// Constantes
const IMAGE_OVERRIDES_KEY = "fundao:imageOverrides:v1";
const UI_OVERRIDES_KEY = "fundao:ui:v1";
const OSRM_BASE_URL = "https://router.project-osrm.org";

// ============================================
// INICIALIZAÇÃO
// ============================================
function init() {
  console.log("Inicializando aplicação...");
  initTheme();
  initMap();  // Mapa é inicializado primeiro
  renderPoints();
  initUI();
  applyHashFocus();
  window.addEventListener("hashchange", applyHashFocus);
  console.log("Aplicação inicializada com sucesso!");
}

// ============================================
// TEMA CLARO/ESCURO
// ============================================
function initTheme() {
  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) return;
  
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

// ============================================
// MAPA - GARANTINDO QUE APARECE CORRETAMENTE
// ============================================
function initMap() {
  // Verificar se o elemento do mapa existe
  const mapElement = document.getElementById("map");
  if (!mapElement) {
    console.error("Elemento do mapa não encontrado!");
    return;
  }
  
  console.log("Inicializando mapa...");
  
  // Criar o mapa com coordenadas do centro do Fundão
  map = L.map("map", {
    zoomControl: true,
    center: [MAP_CENTER.lat, MAP_CENTER.lng],
    zoom: MAP_CENTER.zoom
  });
  
  // Camada base - OpenStreetMap (garantindo que algo aparece)
  mapLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  // Camada Satélite
  satelliteLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
    }
  );
  
  // Labels para satélite
  labelsLayer = L.tileLayer(
    "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution: 'Labels &copy; Esri',
      opacity: 0.92,
    }
  );
  
  // Controle de camadas
  const baseMaps = {
    "Mapa": mapLayer,
    "Satélite": satelliteLayer
  };
  
  const overlayMaps = {
    "Labels": labelsLayer
  };
  
  L.control.layers(baseMaps, overlayMaps, { position: "topright" }).addTo(map);
  
  // Adicionar labels ao satélite por padrão
  labelsLayer.addTo(map);
  
  // Camada para marcadores
  markersLayer = L.layerGroup().addTo(map);
  
  // Carregar estado do modo Anime
  const ui = loadUiState();
  animeModeEnabled = ui.animeModeEnabled ?? true;
  setAnimeMode(animeModeEnabled);
  
  console.log("Mapa inicializado com sucesso!");
}

// ============================================
// PONTOS DE INTERESSE
// ============================================
function renderPoints() {
  const listEl = document.getElementById("poi-list");
  if (!listEl) {
    console.error("Elemento poi-list não encontrado!");
    return;
  }
  
  listEl.innerHTML = "";
  markersById = {};

  FUNDAO_POINTS.forEach((point) => {
    // Criar marcador personalizado
    const marker = L.marker([point.lat, point.lng], {
      riseOnHover: true
    }).addTo(markersLayer);
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

  // Filtro de pesquisa
  initSearchFilter();
  
  // Ajustar o mapa para mostrar todos os pontos
  if (FUNDAO_POINTS.length > 0) {
    const bounds = L.latLngBounds(FUNDAO_POINTS.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }
}

function createPopupHtml(point) {
  const tagsText = point.tags && point.tags.length ? point.tags.join(", ") : "";

  return `
    <div class="popup">
      <div class="popup-title">${escapeHtml(point.name)}</div>
      <div class="popup-desc">${escapeHtml(point.shortDescription)}</div>
      <div class="popup-footer">
        <span class="popup-category">${escapeHtml(point.category)}</span>
        <div class="popup-actions">
          <button class="icon-button js-open-compare" data-id="${point.id}" title="Ver Antes / Depois">
            <i class="fas fa-images"></i>
          </button>
          <button class="icon-button js-open-route" data-lat="${point.lat}" data-lng="${point.lng}" title="Abrir rota no Google Maps">
            <i class="fas fa-external-link-alt"></i>
          </button>
          <button class="icon-button js-open-real-route" data-id="${point.id}" title="Traçar rota real">
            <i class="fas fa-route"></i>
          </button>
        </div>
      </div>
      ${tagsText ? `<div class="popup-tags"><i class="fas fa-tags"></i> ${escapeHtml(tagsText)}</div>` : ""}
    </div>
  `;
}

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

function createPoiListItem(point) {
  const li = document.createElement("li");
  li.className = "poi-item";
  li.dataset.id = point.id;
  li.dataset.name = point.name.toLowerCase();
  li.dataset.category = point.category.toLowerCase();

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
  button.innerHTML = '<i class="fas fa-images"></i>';
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

function initSearchFilter() {
  const searchInput = document.getElementById("poi-search");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase().trim();
    const items = document.querySelectorAll(".poi-item");
    
    items.forEach(item => {
      const name = item.dataset.name || "";
      const category = item.dataset.category || "";
      const matches = term === "" || name.includes(term) || category.includes(term);
      item.style.display = matches ? "flex" : "none";
    });
  });
}

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

function highlightPoi(poiId) {
  selectedPoiId = poiId;
  const items = document.querySelectorAll(".poi-item");
  items.forEach((item) => {
    if (item.dataset.id === poiId) {
      item.classList.add("poi-item--active");
      item.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      item.classList.remove("poi-item--active");
    }
  });
}

function applyHashFocus() {
  const hashId = window.location.hash.replace("#", "").trim();
  if (!hashId) return;
  const point = FUNDAO_POINTS.find((p) => p.id === hashId);
  if (point) {
    focusOnPoint(point);
  }
}

// ============================================
// MODO ANIME
// ============================================
function setAnimeMode(enabled) {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;
  if (enabled) {
    mapEl.classList.add("map-anime");
  } else {
    mapEl.classList.remove("map-anime");
  }
  
  // Atualizar botão do painel
  const panelBtn = document.getElementById("anime-toggle-panel");
  if (panelBtn) {
    panelBtn.innerHTML = enabled ? 
      '<i class="fas fa-star"></i> Desativar Modo Anime' : 
      '<i class="fas fa-star"></i> Ativar Modo Anime';
  }
}

function initAnimeToggle() {
  // Botão no painel
  const panelBtn = document.getElementById("anime-toggle-panel");
  if (panelBtn) {
    panelBtn.addEventListener("click", () => {
      animeModeEnabled = !animeModeEnabled;
      setAnimeMode(animeModeEnabled);
      saveUiState({ animeModeEnabled });
    });
  }
}

// ============================================
// ROTA REAL
// ============================================
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
      routeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A calcular...';
      statsEl.textContent = "A calcular rota...";
    } else {
      routeBtn.innerHTML = '<i class="fas fa-map"></i> Calcular Rota';
    }
  };

  const setError = (msg) => {
    errorEl.textContent = msg || "";
  };

  const onPlan = async () => {
    setError("");
    if (!destSelect.value) {
      setError("Selecione um destino.");
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

async function requestUserGeolocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalização não suportada no seu navegador."));
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
        const msg = err?.message || "Não foi possível obter a sua localização.";
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
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
    throw new Error(`Erro na rota (HTTP ${res.status}).`);
  }

  const data = await res.json();
  const route = data?.routes?.[0];
  if (!route || !route.geometry?.coordinates?.length) {
    throw new Error("Nenhuma rota encontrada.");
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
  return minutes ? `${hours}h ${minutes}min` : `${hours}h`;
}

function formatDistance(meters) {
  if (!Number.isFinite(meters) || meters <= 0) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
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
    html: '<div class="route-pulse-dot"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
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
    weight: 12,
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
    dashArray: "8 8",
  }).addTo(map);

  map.fitBounds(realRouteOverlayLayer.getBounds(), { padding: [40, 40] });
}

async function computeAndRenderRealRoute(destPoint, mode, ui) {
  const { setLoading, statsEl, setError } = ui || {};

  clearRealRoute();

  const routeBtn = document.getElementById("real-route-btn");
  const errorFallback = "Erro ao calcular rota. Tente novamente.";

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
      statsEl.innerHTML = `<i class="fas fa-clock"></i> ${formatDuration(route.durationSeconds)} · <i class="fas fa-road"></i> ${formatDistance(route.distanceMeters)}`;
    }
  } catch (err) {
    const msg = err?.name === "AbortError" ? "" : err?.message || errorFallback;
    setError?.(msg);
  } finally {
    setLoading?.(false);
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
      if (routeBtn) routeBtn.innerHTML = isLoading ? '<i class="fas fa-spinner fa-spin"></i> A calcular...' : '<i class="fas fa-map"></i> Calcular Rota';
      if (statsEl) statsEl.textContent = isLoading ? "A calcular rota..." : statsEl.textContent;
    },
    statsEl,
    setError: (msg) => {
      if (errorEl) errorEl.textContent = msg || "";
    },
  });
}

// ============================================
// MODAL DE COMPARAÇÃO
// ============================================
function initModal() {
  const modal = document.getElementById("compare-modal");
  if (!modal) return;
  
  const closeBtn = document.getElementById("modal-close");
  const backdrop = modal.querySelector(".modal-backdrop");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }
  if (backdrop) {
    backdrop.addEventListener("click", closeModal);
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

function initCompareSlider() {
  const slider = document.getElementById("compare-slider");
  if (slider) {
    slider.addEventListener("input", () => {
      updateCompareOverlay(slider.value);
    });
  }
}

function updateCompareOverlay(value) {
  const overlay = document.getElementById("after-overlay");
  if (overlay) {
    overlay.style.width = `${value}%`;
  }
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="#1f2937"/>
    <circle cx="400" cy="200" r="60" fill="#374151"/>
    <text x="400" y="280" text-anchor="middle" font-size="24" fill="#9ca3af" font-family="system-ui">${safe}</text>
    <text x="400" y="320" text-anchor="middle" font-size="14" fill="#6b7280">Adicione imagem na pasta images/</text>
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

function openCompareModal(point) {
  const modal = document.getElementById("compare-modal");
  if (!modal) return;

  const titleEl = document.getElementById("modal-title");
  const descEl = document.getElementById("modal-description");
  const categoryEl = document.getElementById("modal-category");
  const tagsEl = document.getElementById("modal-tags");
  const imgBeforeEl = document.getElementById("img-before");
  const imgAfterEl = document.getElementById("img-after");

  if (titleEl) titleEl.textContent = point.name;
  if (descEl) descEl.textContent = point.description || point.shortDescription;
  if (categoryEl) categoryEl.textContent = point.category;
  if (tagsEl) tagsEl.textContent = point.tags && point.tags.length ? point.tags.join(", ") : "Sem tags";

  const overrides = loadImageOverrides();
  const override = overrides[point.id] || {};

  // Usar as imagens corretas
  const beforePath = normalizeImagePath(resolveOverridePath(override.before, "before") || point.beforeImage || "");
  const afterPath = normalizeImagePath(resolveOverridePath(override.after, "after") || point.afterImage || "");
  const animePath = normalizeImagePath(resolveOverridePath(override.anime, "anime") || point.animeImage || "");

  if (imgBeforeEl) {
    imgBeforeEl.src = beforePath || createInlinePlaceholder("Antes");
    applyImageFallback(imgBeforeEl, "Antes");
  }
  if (imgAfterEl) {
    imgAfterEl.src = afterPath || createInlinePlaceholder("Depois");
    applyImageFallback(imgAfterEl, "Depois");
  }
  
  const imgAnimeEl = document.getElementById("img-anime");
  if (imgAnimeEl) {
    imgAnimeEl.src = animePath || createInlinePlaceholder("Anime");
    applyImageFallback(imgAnimeEl, "Anime");
  }

  const slider = document.getElementById("compare-slider");
  if (slider) {
    slider.value = 50;
    updateCompareOverlay(50);
  }

  modal.classList.remove("hidden");
}

function closeModal() {
  const modal = document.getElementById("compare-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

// ============================================
// UI STATE
// ============================================
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

function initUI() {
  initRealRoutePlanner();
  initModal();
  initCompareSlider();
  initAnimeToggle();
}

// ============================================
// UTILITÁRIOS
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

// Inicialização
document.addEventListener("DOMContentLoaded", init);