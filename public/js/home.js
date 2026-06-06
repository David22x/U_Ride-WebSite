/* ============================================================
   U-Ride — home.js  (RF1–RF11 · nuevo diseño dark)
   ============================================================ */

const userRaw = sessionStorage.getItem("uride_user");
if (!userRaw) {
  window.location.href = "/login.html";
}
const USER = JSON.parse(userRaw);
if (USER.rol === "administrador") {
  window.location.href = "/admin.html";
}

const socket = io({ withCredentials: true });
socket.on("connect", () => socket.emit("unirse", USER.id));
socket.on("solicitud:aceptada", (d) => {
  toast(d.mensaje || "¡Solicitud aceptada!", "ok");
  cargarViajes();
});
socket.on("solicitud:rechazada", (d) =>
  toast(d.mensaje || "Solicitud rechazada.", "error"),
);

/* ── DOM ──────────────────────────────────────────────── */
const views = document.querySelectorAll(".view");
const navItems = document.querySelectorAll(".nav-item[data-view]");
const greetingMsg = document.getElementById("greetingMsg");
const sidebarName = document.getElementById("sidebarName");
const sidebarRole = document.getElementById("sidebarRole");
const sidebarAvatar = document.getElementById("sidebarAvatar");
const statViajes = document.getElementById("statViajes");
const statRep = document.getElementById("statRep");
const viajesGrid = document.getElementById("viajesGrid");
const modeBanner = document.getElementById("modeBanner");
const modeIcon = document.getElementById("modeIcon");
const modeBannerTitle = document.getElementById("modeBannerTitle");
const modeBannerSub = document.getElementById("modeBannerSub");
const sectionSolicitudes = document.getElementById("sectionSolicitudes");
const solicitudesList = document.getElementById("solicitudesList");
const solicitudesListView = document.getElementById("solicitudesListView");
const badgeSol = document.getElementById("badgeSol");
const solBadge = document.getElementById("solBadge");
const navSolicitudes = document.getElementById("navSolicitudes");
const labelSolicitudes = document.getElementById("labelSolicitudes");
const rolToggle = document.getElementById("rolToggle");
const rolLabel = document.getElementById("rolLabel");
const rolDropdown = document.getElementById("rolDropdown");
const optPasajero = document.getElementById("optPasajero");
const optConductor = document.getElementById("optConductor");
const notifBtn = document.getElementById("notifBtn");
const notifPanel = document.getElementById("notifPanel");
const notifBadge = document.getElementById("notifBadge");
const notifList = document.getElementById("notifList");
const notifClear = document.getElementById("notifClear");
const modalCrear = document.getElementById("modalCrear");
const modalViaje = document.getElementById("modalViaje");
const perfilAvatar = document.getElementById("perfilAvatar");
const inputFoto = document.getElementById("inputFoto");
const cardConductor = document.getElementById("cardConductor");
const topbarTitle = document.getElementById("topbarTitle");

let MODO = sessionStorage.getItem("uride_modo") || "pasajero";
let viajeSelId = null;
let notifCount = 0;

/* ── INIT ─────────────────────────────────────────────── */
(async function init() {
  rellenarUsuario();
  mostrarSaludo();
  aplicarModo(MODO, false);
  await Promise.all([cargarStats(), cargarViajes()]);
  cargarPerfilConductor();
  cargarMisViajes();
})();

/* ── Usuario ──────────────────────────────────────────── */
function rellenarUsuario() {
  const nombre = USER.nombre || "Usuario";
  const apellido = USER.apellido || "";
  const inicial = nombre[0]?.toUpperCase() || "U";
  sidebarName.textContent = `${nombre} ${apellido}`.trim();
  sidebarRole.textContent = "Estudiante";

  if (USER.foto) {
    sidebarAvatar.innerHTML = `<img src="${USER.foto}" alt="foto" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
    if (perfilAvatar)
      perfilAvatar.innerHTML = `<img src="${USER.foto}" alt="foto" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
  } else {
    sidebarAvatar.textContent = inicial;
    if (perfilAvatar) perfilAvatar.textContent = inicial;
  }

  const pfNombre = document.getElementById("pfNombre");
  if (pfNombre) {
    pfNombre.value = USER.nombre || "";
    document.getElementById("pfApellido").value = USER.apellido || "";
    document.getElementById("pfCorreo").value = USER.correo || "";
    document.getElementById("pfCarrera").value = USER.carrera || "";
    document.getElementById("pfZona").value = USER.zona || "";
    document.getElementById("pfTelefono").value = USER.telefono || "";
  }
}

function mostrarSaludo() {
  const h = new Date().getHours();
  const saludo =
    h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  greetingMsg.textContent = `${saludo}, ${USER.nombre} 👋`;
}

async function cargarStats() {
  try {
    const r = await apiGet("/api/usuarios/stats");
    statViajes.textContent = r.totalViajes ?? "0";
    statRep.textContent = r.promedio ? `${r.promedio} ⭐` : "—";
  } catch {
    /* silencioso */
  }
}

/* ── Modo rol ─────────────────────────────────────────── */
rolToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  rolDropdown.classList.toggle("hidden");
});
optPasajero.addEventListener("click", () => {
  aplicarModo("pasajero");
  rolDropdown.classList.add("hidden");
});
optConductor.addEventListener("click", () => {
  aplicarModo("conductor");
  rolDropdown.classList.add("hidden");
});
document.addEventListener("click", (e) => {
  if (!rolToggle.contains(e.target)) rolDropdown.classList.add("hidden");
});

function aplicarModo(modo, animar = true) {
  MODO = modo;
  sessionStorage.setItem("uride_modo", modo);
  const esConductor = modo === "conductor";

  rolLabel.textContent = esConductor ? "Conductor" : "Pasajero";
  rolToggle.classList.toggle("conductor", esConductor);
  optPasajero.classList.toggle("active", !esConductor);
  optConductor.classList.toggle("active", esConductor);

  if (esConductor) {
    modeIcon.textContent = "🚗";
    modeBannerTitle.textContent = "Modo Conductor activo";
    modeBannerSub.textContent =
      "Puedes publicar viajes y gestionar solicitudes.";
    modeBanner.classList.replace("pasajero", "conductor");
    sectionSolicitudes.classList.remove("hidden");
    navSolicitudes.style.display = "";
    labelSolicitudes.style.display = "";
    cargarSolicitudes();
  } else {
    modeIcon.textContent = "🧍";
    modeBannerTitle.textContent = "Modo Pasajero activo";
    modeBannerSub.textContent = "Puedes buscar y solicitar viajes disponibles.";
    modeBanner.classList.replace("conductor", "pasajero");
    sectionSolicitudes.classList.add("hidden");
    navSolicitudes.style.display = "none";
    labelSolicitudes.style.display = "none";
  }
  if (cardConductor) cardConductor.style.display = esConductor ? "" : "none";
  if (animar)
    toast(`Modo ${esConductor ? "conductor" : "pasajero"} activado.`, "info");
}

/* ── Viajes home ──────────────────────────────────────── */
async function cargarViajes(filtros = {}) {
  viajesGrid.innerHTML = `<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>`;
  try {
    const params = new URLSearchParams(filtros);
    const viajes = await apiGet(`/api/viajes?${params}`);
    renderViajes(viajesGrid, viajes);
  } catch {
    viajesGrid.innerHTML =
      '<p class="empty-state">No se pudieron cargar los viajes.</p>';
  }
}

function renderViajes(container, viajes) {
  if (!viajes?.length) {
    container.innerHTML =
      '<p class="empty-state">No hay viajes disponibles.</p>';
    return;
  }
  container.innerHTML = viajes
    .map((v) => {
      const cuposCls =
        v.cuposDisponibles === 0
          ? "none"
          : v.cuposDisponibles <= 1
            ? "few"
            : "";
      const nombre = v.conductor?.usuario
        ? `${v.conductor.usuario.nombre} ${v.conductor.usuario.apellido}`
        : v.conductorNombre || "Conductor";
      const inicial = (nombre[0] || "?").toUpperCase();
      const hora = `${v.horaSalida?.slice(0, 5) || "--:--"} → ${v.horaLlegada?.slice(0, 5) || "--:--"}`;
      const rep = v.conductorReputacion
        ? `<span class="vc-chip">⭐ ${v.conductorReputacion.promedio}</span>`
        : "";
      return `
    <article class="viaje-card" data-id="${v.id}">
      <div class="vc-header">
        <div class="vc-av">${inicial}</div>
        <div>
          <div class="vc-ruta">${v.origen} → ${v.destino}</div>
          <div class="vc-conductor">${nombre}</div>
        </div>
      </div>
      <div class="vc-chips">
        <span class="vc-chip">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${hora}
        </span>
        ${
          v.fecha
            ? `<span class="vc-chip">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${fmtFecha(v.fecha)}
        </span>`
            : ""
        }
        ${rep}
      </div>
      <div class="vc-footer">
        <span class="vc-cupos ${cuposCls}">
          ${v.cuposDisponibles === 0 ? "Sin cupos" : `${v.cuposDisponibles} asiento${v.cuposDisponibles !== 1 ? "s" : ""}`}
        </span>
      </div>
    </article>`;
    })
    .join("");

  container.querySelectorAll(".viaje-card").forEach((card) => {
    card.addEventListener("click", () => abrirDetalleViaje(card.dataset.id));
  });
}

/* ── Detalle viaje ────────────────────────────────────── */
async function abrirDetalleViaje(id) {
  viajeSelId = id;
  try {
    const v = await apiGet(`/api/viajes/${id}`);
    document.getElementById("detailRuta").textContent =
      `${v.origen} → ${v.destino}`;
    const conductorNombre = v.conductor?.usuario
      ? `${v.conductor.usuario.nombre} ${v.conductor.usuario.apellido}`
      : "—";
    const reglasHtml = v.reglas?.descripcion
      ? `<div class="detail-rules"><strong>📋 Reglas del viaje</strong><p>${v.reglas.descripcion}</p></div>`
      : "";
    const participantesHtml = v.participantes?.length
      ? `<div style="margin-top:.5rem"><strong style="font-size:.82rem;color:var(--text-sub);text-transform:uppercase;letter-spacing:.06em">Pasajeros confirmados (${v.participantes.length})</strong><div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.5rem">${v.participantes.map((p) => `<span class="pasajero-pill">${p.pasajero?.usuario?.nombre || "?"}</span>`).join("")}</div></div>`
      : "";
    document.getElementById("detailBody").innerHTML = `
      <div style="display:flex;flex-direction:column;gap:.6rem">
        <div class="detail-row"><strong>Conductor</strong><span>${conductorNombre}</span></div>
        <div class="detail-row"><strong>Vehículo</strong><span>${v.conductor?.vehiculo || "—"} · ${v.conductor?.color || ""}</span></div>
        <div class="detail-row"><strong>Placa</strong><span>${v.conductor?.placa || "—"}</span></div>
        <div class="detail-row"><strong>Fecha</strong><span>${fmtFecha(v.fecha)}</span></div>
        <div class="detail-row"><strong>Horario</strong><span>${v.horaSalida?.slice(0, 5)} → ${v.horaLlegada?.slice(0, 5)}</span></div>
        <div class="detail-row"><strong>Cupos disponibles</strong><span>${v.cuposDisponibles}</span></div>
        ${v.notas ? `<div class="detail-row"><strong>Notas</strong><span style="color:var(--text-sub)">${v.notas}</span></div>` : ""}
        ${reglasHtml}
        ${participantesHtml}
      </div>`;

    const esMiViaje = v.conductor?.usuario?.id === USER.id;
    const btnSol = document.getElementById("btnSolicitar");
    const btnRep = document.getElementById("btnReportarViaje");
    if (esMiViaje) {
      btnSol.style.display = "none";
      btnRep.classList.add("hidden");
    } else {
      btnSol.style.display = "";
      btnSol.disabled = v.cuposDisponibles === 0;
      btnSol.textContent =
        v.cuposDisponibles === 0 ? "Sin cupos" : "Solicitar cupo";
      btnRep.classList.remove("hidden");
      btnRep.dataset.conductorId = v.conductor?.usuario?.id || "";
    }
    modalViaje.classList.remove("hidden");
  } catch {
    toast("No se pudo cargar el detalle del viaje.", "error");
  }
}

document
  .getElementById("detailClose")
  .addEventListener("click", () => modalViaje.classList.add("hidden"));
document
  .getElementById("detailCancel")
  .addEventListener("click", () => modalViaje.classList.add("hidden"));

document.getElementById("btnSolicitar").addEventListener("click", async () => {
  if (!viajeSelId) return;
  try {
    await apiPost("/api/solicitudes", { viajeId: viajeSelId });
    toast("Solicitud enviada. Espera la respuesta del conductor.", "ok");
    modalViaje.classList.add("hidden");
    cargarViajes();
  } catch (err) {
    toast(err.message || "No se pudo enviar la solicitud.", "error");
  }
});

document.getElementById("btnReportarViaje").addEventListener("click", () => {
  const conductorId =
    document.getElementById("btnReportarViaje").dataset.conductorId;
  if (conductorId) abrirModalReporte(conductorId, viajeSelId);
});

/* ── Solicitudes (conductor) ──────────────────────────── */
async function cargarSolicitudes() {
  try {
    const data = await apiGet("/api/solicitudes/pendientes");
    const n = data.length;
    badgeSol.textContent = n;
    if (solBadge) {
      solBadge.textContent = n;
      solBadge.classList.toggle("hidden", n === 0);
    }
    renderSolicitudes(data, solicitudesList);
    renderSolicitudes(data, solicitudesListView);
  } catch {
    /* silencioso */
  }
}

function renderSolicitudes(items, container) {
  if (!container) return;
  if (!items?.length) {
    container.innerHTML =
      '<p class="empty-state">Sin solicitudes pendientes.</p>';
    return;
  }
  container.innerHTML = items
    .map((s) => {
      const u = s.pasajero?.usuario;
      const nombre = u ? `${u.nombre} ${u.apellido}` : "Pasajero";
      const inicial = (nombre[0] || "?").toUpperCase();
      const zona = u?.zona ? ` · ${u.zona}` : "";
      return `
    <div class="sol-card">
      <div class="sol-av">${inicial}</div>
      <div class="sol-info">
        <div class="sol-nombre">${nombre}${zona}</div>
        <div class="sol-ruta">${s.viaje?.origen} → ${s.viaje?.destino}</div>
        <div style="font-size:.76rem;color:var(--text-muted)">${fmtFecha(s.viaje?.fecha)}</div>
      </div>
      <div class="sol-actions">
        <button class="btn-sol-aceptar" data-id="${s.id}">Aceptar</button>
        <button class="btn-sol-rechazar" data-id="${s.id}">Rechazar</button>
      </div>
    </div>`;
    })
    .join("");

  container
    .querySelectorAll(".btn-sol-aceptar")
    .forEach((b) =>
      b.addEventListener("click", () =>
        gestionarSolicitud(b.dataset.id, "aceptar"),
      ),
    );
  container
    .querySelectorAll(".btn-sol-rechazar")
    .forEach((b) =>
      b.addEventListener("click", () =>
        gestionarSolicitud(b.dataset.id, "rechazar"),
      ),
    );
}

async function gestionarSolicitud(id, accion) {
  try {
    await apiPatch(`/api/solicitudes/${id}/${accion}`);
    toast(
      `Solicitud ${accion === "aceptar" ? "aceptada" : "rechazada"}.`,
      "ok",
    );
    cargarSolicitudes();
    cargarViajes();
  } catch (err) {
    toast(err.message || "Error al gestionar la solicitud.", "error");
  }
}

/* ── Crear viaje ──────────────────────────────────────── */
function abrirModalCrear() {
  if (MODO !== "conductor") {
    toast("Activa el modo Conductor para publicar viajes.", "error");
    return;
  }
  document.getElementById("cvFecha").min = new Date()
    .toISOString()
    .split("T")[0];
  modalCrear.classList.remove("hidden");
}
document
  .getElementById("navPublicar")
  ?.addEventListener("click", abrirModalCrear);
document
  .getElementById("qaPublicar")
  ?.addEventListener("click", abrirModalCrear);
document
  .getElementById("modalCrearClose")
  ?.addEventListener("click", () => modalCrear.classList.add("hidden"));
document
  .getElementById("modalCrearCancel")
  ?.addEventListener("click", () => modalCrear.classList.add("hidden"));

document
  .getElementById("formCrearViaje")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById("alertCrear");
    alertEl.className = "alert";
    const body = {
      origen: document.getElementById("cvOrigen").value.trim(),
      destino: document.getElementById("cvDestino").value.trim(),
      origenLat:
        _pick.origen.lat ||
        document.getElementById("cvOrigenLat").value ||
        null,
      origenLng:
        _pick.origen.lng ||
        document.getElementById("cvOrigenLng").value ||
        null,
      destinoLat:
        _pick.destino.lat ||
        document.getElementById("cvDestinoLat").value ||
        null,
      destinoLng:
        _pick.destino.lng ||
        document.getElementById("cvDestinoLng").value ||
        null,
      fecha: document.getElementById("cvFecha").value,
      horaSalida: document.getElementById("cvHoraSalida").value,
      horaLlegada: document.getElementById("cvHoraLlegada").value,
      cuposTotal: parseInt(document.getElementById("cvCupos").value),
      notas: document.getElementById("cvNotas").value.trim(),
      reglas: document.getElementById("cvReglas").value.trim() || null,
    };
    if (body.horaLlegada <= body.horaSalida) {
      alertEl.className = "alert show-error";
      alertEl.textContent = "La hora de llegada debe ser mayor a la de salida.";
      return;
    }
    try {
      await apiPost("/api/viajes", body);
      modalCrear.classList.add("hidden");
      toast("¡Viaje publicado correctamente!", "ok");
      _resetPickers();
      cargarViajes();
      cargarSolicitudes();
      document.getElementById("formCrearViaje").reset();
    } catch (err) {
      alertEl.className = "alert show-error";
      alertEl.textContent = err.message || "Error al publicar el viaje.";
    }
  });

/* ── Buscar ───────────────────────────────────────────── */
document
  .getElementById("btnBuscarViajes")
  .addEventListener("click", async () => {
    const filtros = {};
    const origen = document.getElementById("filtroOrigen").value.trim();
    const destino = document.getElementById("filtroDestino").value.trim();
    const fecha = document.getElementById("filtroFecha").value;
    if (origen) filtros.origen = origen;
    if (destino) filtros.destino = destino;
    if (fecha) filtros.fecha = fecha;
    const grid = document.getElementById("viajesGridBuscar");
    grid.innerHTML =
      '<div class="skeleton-card"></div><div class="skeleton-card"></div>';
    try {
      const viajes = await apiGet(
        `/api/viajes?${new URLSearchParams(filtros)}`,
      );
      renderViajes(grid, viajes);
    } catch {
      grid.innerHTML = '<p class="empty-state">Error al buscar viajes.</p>';
    }
  });

/* ── Mis Viajes ───────────────────────────────────────── */
async function cargarMisViajes() {
  try {
    const data = await apiGet("/api/viajes/mis-viajes");
    renderMisViajesPasajero(data.pasajero || []);
    renderMisViajesConductor(data.conductor || []);
  } catch {
    /* silencioso */
  }
}

function estadoBadge(estado) {
  const map = {
    publicado: "publicado",
    en_curso: "en_curso",
    finalizado: "finalizado",
    cancelado: "cancelado",
  };
  const labels = {
    publicado: "Publicado",
    en_curso: "En curso",
    finalizado: "Finalizado",
    cancelado: "Cancelado",
  };
  return `<span class="badge-estado ${map[estado] || ""}">${labels[estado] || estado}</span>`;
}

function renderMisViajesPasajero(participaciones) {
  const el = document.getElementById("tabComoPasajero");
  if (!participaciones.length) {
    el.innerHTML =
      '<p class="empty-state">No has participado en ningún viaje aún.</p>';
    return;
  }
  el.innerHTML = participaciones
    .map((p) => {
      const v = p.viaje || {};
      const conductorNombre = v.conductor?.usuario
        ? `${v.conductor.usuario.nombre} ${v.conductor.usuario.apellido}`
        : "Conductor";
      return `
    <div class="mi-viaje-card">
      <div class="mv-header">
        <div class="mv-ruta">${v.origen || "—"} → ${v.destino || "—"}</div>
        ${estadoBadge(v.estado)}
      </div>
      <div class="mv-meta">
        <span>📅 ${fmtFecha(v.fecha)}</span>
        <span>🕐 ${v.horaSalida?.slice(0, 5) || "--:--"}</span>
        <span>🚗 ${conductorNombre}</span>
      </div>
      ${
        v.estado === "finalizado"
          ? `
      <div class="mv-actions">
        <button class="btn-sm btn-accent btn-calificar" data-viaje="${v.id}" data-evaluado="${v.conductor?.usuario?.id}" data-nombre="${conductorNombre}">⭐ Calificar conductor</button>
        <button class="btn-sm btn-ghost-sm btn-reportar" data-viaje="${v.id}" data-reportado="${v.conductor?.usuario?.id}">⚠ Reportar</button>
      </div>`
          : ""
      }
      <div style="margin-top:.5rem">
        <button class="btnVerRutaMisViajes btn-map btn-map-ghost"
                data-id="${v.id}"
                data-mapid="mvMap_${v.id}"
                style="font-size:.78rem;padding:.35rem .7rem">
          🗺 Ver ruta
        </button>
      </div>
      <div id="mvMapWrap_${v.id}" style="display:none;padding:.4rem 0 0">
        <div class="map-container map-sm" id="mvMap_${v.id}"></div>
      </div>
    </div>`;
    })
    .join("");

  el.querySelectorAll(".btn-calificar").forEach((b) =>
    b.addEventListener("click", () =>
      abrirModalCalificar(
        b.dataset.viaje,
        b.dataset.evaluado,
        b.dataset.nombre,
      ),
    ),
  );
  el.querySelectorAll(".btn-reportar").forEach((b) =>
    b.addEventListener("click", () =>
      abrirModalReporte(b.dataset.reportado, b.dataset.viaje),
    ),
  );
}

function renderMisViajesConductor(viajes) {
  const el = document.getElementById("tabComoConductor");
  if (!viajes.length) {
    el.innerHTML =
      '<p class="empty-state">No has publicado ningún viaje aún.</p>';
    return;
  }
  el.innerHTML = viajes
    .map((v) => {
      const solPend = v.solicitudes?.length || 0;
      const pasLst = (v.participantes || [])
        .map((p) => {
          const u = p.pasajero?.usuario;
          return u
            ? `<span class="pasajero-pill">${u.nombre} ${u.apellido}</span>`
            : "";
        })
        .join("");
      return `
    <div class="mi-viaje-card">
      <div class="mv-header">
        <div class="mv-ruta">${v.origen} → ${v.destino}</div>
        ${estadoBadge(v.estado)}
      </div>
      <div class="mv-meta">
        <span>📅 ${fmtFecha(v.fecha)}</span>
        <span>🕐 ${v.horaSalida?.slice(0, 5)}</span>
        <span>💺 ${v.cuposDisponibles}/${v.cuposTotal} cupos</span>
        ${solPend ? `<span class="badge-sol-pend">${solPend} solicitud${solPend !== 1 ? "es" : ""}</span>` : ""}
      </div>
      ${pasLst ? `<div class="pasajeros-list">${pasLst}</div>` : ""}
      ${
        v.estado === "publicado"
          ? `
      <div class="mvActions">
        <button class="btnIniciarViaje" data-id="${v.id}">
          Iniciar viaje
        </button>

        <button class="btnCancelarViaje btnSmall btnSmallGhost" data-id="${v.id}">
          Cancelar viaje
        </button>
      </div>`
          : ""
      }
      ${
        v.estado === "en_curso"
          ? `
      <div class="mvActions">
        <button class="btnFinalizarViaje" data-id="${v.id}">
          Finalizar viaje
        </button>
      </div>`
          : ""
      }
      ${
        v.estado === "finalizado" && v.participantes?.length
          ? `
      <div class="mv-actions">
        ${(v.participantes || [])
          .map((p) => {
            const u = p.pasajero?.usuario;
            return u
              ? `<button class="btn-sm btn-accent btn-calificar" data-viaje="${v.id}" data-evaluado="${u.id}" data-nombre="${u.nombre} ${u.apellido}">⭐ Calificar ${u.nombre}</button>`
              : "";
          })
          .join("")}
      </div>`
          : ""
      }
      <div style="margin-top:.5rem">
        <button class="btnVerRutaMisViajes btn-map btn-map-ghost"
                data-id="${v.id}"
                data-mapid="mvMap_${v.id}"
                style="font-size:.78rem;padding:.35rem .7rem">
          🗺 Ver ruta
        </button>
      </div>
      <div id="mvMapWrap_${v.id}" style="display:none;padding:.4rem 0 0">
        <div class="map-container map-sm" id="mvMap_${v.id}"></div>
      </div>
    </div>`;
    })
    .join("");

  el.querySelectorAll(".btnIniciarViaje").forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        await apiPatch(`/api/viajes/${b.dataset.id}/iniciar`);
        pushNotif("Viaje iniciado.", "ok");
        cargarMisViajes();
      } catch (err) {
        pushNotif(err.message, "error");
      }
    }),
  );

  el.querySelectorAll(".btnFinalizarViaje").forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        await apiPatch(`/api/viajes/${b.dataset.id}/finalizar`);
        pushNotif("Viaje finalizado.", "ok");
        cargarMisViajes();
      } catch (err) {
        pushNotif(err.message, "error");
      }
    }),
  );

  el.querySelectorAll(".btn-cancelar-viaje").forEach((b) =>
    b.addEventListener("click", async () => {
      if (!confirm("¿Cancelar este viaje?")) return;
      try {
        await apiDel(`/api/viajes/${b.dataset.id}`);
        toast("Viaje cancelado.", "ok");
        cargarMisViajes();
        cargarViajes();
      } catch (err) {
        toast(err.message || "Error al cancelar.", "error");
      }
    }),
  );
  el.querySelectorAll(".btn-calificar").forEach((b) =>
    b.addEventListener("click", () =>
      abrirModalCalificar(
        b.dataset.viaje,
        b.dataset.evaluado,
        b.dataset.nombre,
      ),
    ),
  );
}

/* ── Calificar RF8 ────────────────────────────────────── */
function abrirModalCalificar(viajeId, evaluadoId, nombre) {
  if (!evaluadoId || evaluadoId === "undefined") {
    toast("No se puede calificar.", "error");
    return;
  }
  document.getElementById("calNombre").textContent = nombre;
  document.getElementById("calViajeId").value = viajeId;
  document.getElementById("calEvaluadoId").value = evaluadoId;
  document.getElementById("calPuntuacion").value = "";
  document.getElementById("calComentario").value = "";
  document.getElementById("alertCalif").className = "alert";
  document
    .querySelectorAll(".star-btn")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("modalCalificar").classList.remove("hidden");
}

document.querySelectorAll(".star-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const val = parseInt(btn.dataset.val);
    document.getElementById("calPuntuacion").value = val;
    document.querySelectorAll(".star-btn").forEach((s) => {
      s.classList.toggle("active", parseInt(s.dataset.val) <= val);
    });
  });
});

document
  .getElementById("formCalificar")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById("alertCalif");
    const viajeId = document.getElementById("calViajeId").value;
    const evaluadoId = document.getElementById("calEvaluadoId").value;
    const puntuacion = document.getElementById("calPuntuacion").value;
    const comentario = document.getElementById("calComentario").value.trim();

    if (!puntuacion) {
      alertEl.className = "alert show-error";
      alertEl.textContent = "Selecciona una puntuación.";
      return;
    }
    try {
      await apiPost("/api/calificaciones", {
        viajeId,
        evaluadoId,
        puntuacion: parseInt(puntuacion),
      });
      if (comentario) {
        await apiPost("/api/calificaciones/resenas", {
          viajeId,
          destinoId: evaluadoId,
          comentario,
        }).catch(() => {});
      }
      document.getElementById("modalCalificar").classList.add("hidden");
      toast("¡Calificación enviada!", "ok");
      cargarStats();
    } catch (err) {
      alertEl.className = "alert show-error";
      alertEl.textContent = err.message || "Error al calificar.";
    }
  });

document
  .getElementById("closeCalificar")
  .addEventListener("click", () =>
    document.getElementById("modalCalificar").classList.add("hidden"),
  );

/* ── Reportar RF10 ────────────────────────────────────── */
function abrirModalReporte(reportadoId, viajeId) {
  if (!reportadoId || reportadoId === "undefined") {
    toast("No se puede reportar.", "error");
    return;
  }
  document.getElementById("repReportadoId").value = reportadoId;
  document.getElementById("repViajeId").value = viajeId || "";
  document.getElementById("repMotivo").value = "";
  document.getElementById("alertReporte").className = "alert";
  document.getElementById("modalReporte").classList.remove("hidden");
}

document.getElementById("formReporte").addEventListener("submit", async (e) => {
  e.preventDefault();
  const alertEl = document.getElementById("alertReporte");
  const reportadoId = document.getElementById("repReportadoId").value;
  const viajeId = document.getElementById("repViajeId").value;
  const motivo = document.getElementById("repMotivo").value.trim();
  if (motivo.length < 10) {
    alertEl.className = "alert show-error";
    alertEl.textContent = "El motivo debe tener al menos 10 caracteres.";
    return;
  }
  try {
    await apiPost("/api/reportes", { reportadoId, viajeId, motivo });
    document.getElementById("modalReporte").classList.add("hidden");
    toast("Reporte enviado. El administrador lo revisará.", "ok");
  } catch (err) {
    alertEl.className = "alert show-error";
    alertEl.textContent = err.message || "Error al enviar el reporte.";
  }
});

document
  .getElementById("closeReporte")
  .addEventListener("click", () =>
    document.getElementById("modalReporte").classList.add("hidden"),
  );

/* ── Perfil ───────────────────────────────────────────── */
document.getElementById("formPerfil").addEventListener("submit", async (e) => {
  e.preventDefault();
  const alertEl = document.getElementById("alertPerfil");
  alertEl.className = "alert";
  const body = {
    nombre: document.getElementById("pfNombre").value.trim(),
    apellido: document.getElementById("pfApellido").value.trim(),
    carrera: document.getElementById("pfCarrera").value.trim(),
    zona: document.getElementById("pfZona").value.trim(),
    telefono: document.getElementById("pfTelefono").value.trim(),
  };
  if (!body.nombre || !body.apellido) {
    alertEl.className = "alert show-error";
    alertEl.textContent = "Nombre y apellido son obligatorios.";
    return;
  }
  try {
    await apiPatch(`/api/usuarios/${USER.id}`, body);
    Object.assign(USER, body);
    sessionStorage.setItem("uride_user", JSON.stringify(USER));
    rellenarUsuario();
    alertEl.className = "alert show-ok";
    alertEl.textContent = "¡Perfil actualizado correctamente!";
    setTimeout(() => {
      alertEl.className = "alert";
    }, 3000);
  } catch (err) {
    alertEl.className = "alert show-error";
    alertEl.textContent = err.message || "Error al actualizar el perfil.";
  }
});

async function cargarPerfilConductor() {
  try {
    const data = await apiGet(`/api/conductores/${USER.id}`);
    if (data) {
      document.getElementById("pfVehiculo").value = data.vehiculo || "";
      document.getElementById("pfColor").value = data.color || "";
      document.getElementById("pfPlaca").value = data.placa || "";
      document.getElementById("pfLicencia").value = data.licencia || "";
    }
  } catch {
    /* ok */
  }
}

document
  .getElementById("formConductor")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById("alertConductor");
    alertEl.className = "alert";
    const body = {
      vehiculo: document.getElementById("pfVehiculo").value.trim(),
      color: document.getElementById("pfColor").value.trim(),
      placa: document.getElementById("pfPlaca").value.trim().toUpperCase(),
      licencia: document.getElementById("pfLicencia").value.trim(),
    };
    if (!body.vehiculo || !body.placa || !body.licencia) {
      alertEl.className = "alert show-error";
      alertEl.textContent = "Vehículo, placa y licencia son obligatorios.";
      return;
    }
    try {
      await apiPost(`/api/conductores/${USER.id}`, body);
      alertEl.className = "alert show-ok";
      alertEl.textContent = "¡Datos del vehículo guardados!";
      setTimeout(() => {
        alertEl.className = "alert";
      }, 3000);
    } catch (err) {
      alertEl.className = "alert show-error";
      alertEl.textContent = err.message || "Error al guardar.";
    }
  });

/* ── Foto de perfil ───────────────────────────────────── */
document
  .getElementById("btnAvatarEdit")
  .addEventListener("click", () => inputFoto.click());
inputFoto.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    toast("La imagen no debe superar 2 MB.", "error");
    return;
  }
  const formData = new FormData();
  formData.append("foto", file);
  try {
    const r = await fetch(`/api/usuarios/${USER.id}/foto`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!r.ok) throw new Error();
    const data = await r.json();
    USER.foto = data.fotoUrl;
    sessionStorage.setItem("uride_user", JSON.stringify(USER));
    rellenarUsuario();
    toast("Foto de perfil actualizada.", "ok");
  } catch {
    toast("No se pudo subir la foto.", "error");
  }
});

/* ── Tabs ─────────────────────────────────────────────── */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.add("hidden"));
    tab.classList.add("active");
    const id = `tab${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}`;
    document.getElementById(id)?.classList.remove("hidden");
  });
});

/* ── Navegación ───────────────────────────────────────── */
document.querySelectorAll("[data-view]").forEach((el) => {
  el.addEventListener("click", (e) => {
    const view = el.dataset.view;
    if (view) {
      e.preventDefault();
      cambiarVista(view);
    }
  });
});

const viewTitles = {
  inicio: "Inicio",
  buscar: "Buscar viaje",
  misViajes: "Mis viajes",
  solicitudes: "Solicitudes",
  perfil: "Mi perfil",
};

function cambiarVista(nombre) {
  views.forEach((v) => v.classList.remove("active"));
  navItems.forEach((n) => n.classList.remove("active"));
  const viewId = "view" + nombre.charAt(0).toUpperCase() + nombre.slice(1);
  document.getElementById(viewId)?.classList.add("active");
  document
    .querySelector(`.nav-item[data-view="${nombre}"]`)
    ?.classList.add("active");
  if (topbarTitle) topbarTitle.textContent = viewTitles[nombre] || "";
  if (nombre === "misViajes") cargarMisViajes();
  if (nombre === "solicitudes" && MODO === "conductor") cargarSolicitudes();
}

/* ── Notificaciones ───────────────────────────────────── */
function pushNotif(msg, tipo = "info") {
  notifCount++;
  notifBadge.textContent = notifCount;
  notifBadge.classList.remove("hidden");
  const empty = notifList.querySelector(".notif-empty");
  if (empty) empty.remove();
  const li = document.createElement("li");
  li.className = `notif-item ${tipo}`;
  li.textContent = msg;
  notifList.prepend(li);
  toast(msg, tipo);
}

notifBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  notifPanel.classList.toggle("hidden");
});
notifClear.addEventListener("click", () => {
  notifList.innerHTML =
    '<li class="notif-empty">Sin notificaciones nuevas</li>';
  notifBadge.classList.add("hidden");
  notifCount = 0;
});
document.addEventListener("click", (e) => {
  if (!notifPanel.contains(e.target) && !notifBtn.contains(e.target))
    notifPanel.classList.add("hidden");
});

/* ── Toast ────────────────────────────────────────────── */
function toast(msg, tipo = "info") {
  const container = document.getElementById("toastContainer");
  const el = document.createElement("div");
  el.className = `toast ${tipo}`;
  el.innerHTML = `<span class="toast-dot"></span>${msg}`;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add("visible"));
  setTimeout(() => {
    el.classList.remove("visible");
    el.addEventListener("transitionend", () => el.remove(), { once: true });
  }, 3500);
}

/* ── Búsqueda rápida ──────────────────────────────────── */
let searchTimer = null;
document.getElementById("searchInput")?.addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const q = e.target.value.trim();
    if (q.length > 1) {
      cambiarVista("buscar");
      document.getElementById("filtroOrigen").value = q;
      document.getElementById("btnBuscarViajes").click();
    }
  }, 400);
});

/* ── Logout ───────────────────────────────────────────── */
document.getElementById("btnLogout").addEventListener("click", async () => {
  try {
    await apiPost("/api/auth/logout", {});
  } catch {
    /* ok */
  }
  sessionStorage.clear();
  window.location.href = "/login.html";
});

/* ── Helpers fetch ────────────────────────────────────── */
async function apiGet(url) {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error || `Error ${r.status}`);
  }
  return r.json();
}
async function apiPost(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error || `Error ${r.status}`);
  }
  return r.json();
}
async function apiPatch(url, body = {}) {
  const r = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error || `Error ${r.status}`);
  }
  return r.json();
}
async function apiDel(url) {
  const r = await fetch(url, { method: "DELETE", credentials: "include" });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error || `Error ${r.status}`);
  }
  return r.json();
}

function fmtFecha(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  const meses = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  return `${d} ${meses[parseInt(m) - 1]} ${y}`;
}

/* ══════════════════════════════════════════════════════════
   home_maps_patch_v2.js
   AÑADIR AL FINAL de public/js/home.js
   (reemplaza el home_maps_patch.js anterior si lo tenías)

   Depende de:
     - window.URideMaps  (/js/maps.js)
     - socket, USER, apiGet, apiPost, apiPatch  (home.js)
     - fmtFecha                                 (home.js)
     - toast / pushNotif                        (home.js)
     - cargarMisViajes, cargarViajes            (home.js)
   ══════════════════════════════════════════════════════════ */

/* ── Estado del módulo ─────────────────────────────── */
let _mapsReady = false;
let _viajeDetalle = null; // objeto viaje abierto en modal detalle
let _trackingViajeId = null; // viajeId activo en modal GPS conductor
let _viajeActualId = null; // viajeId mostrado en la tarjeta del home

/* ── Google Maps ready ─────────────────────────────── */
document.addEventListener("googleMapsReady", () => {
  _mapsReady = true;
  console.log("[Maps] Google Maps listo.");
  // Cargar viaje actual al detectar Maps
  _cargarViajeActual();

  // Activar Autocomplete en los campos de origen/destino desde el inicio
  URideMaps.bindInputToPickerMap(
    "cvOrigen",
    "mapaPickerOrigen",
    (lat, lng, address) => _setOrigenCoords(lat, lng, address),
  );
  URideMaps.bindInputToPickerMap(
    "cvDestino",
    "mapaPickerDestino",
    (lat, lng, address) => _setDestinoCoords(lat, lng, address),
  );
});

/* ══════════════════════════════════════════════════════
   1. MODAL CREAR VIAJE — selector de puntos en el mapa
   ══════════════════════════════════════════════════════ */

/* Estado del picker */
const _pick = {
  origen: { lat: null, lng: null, address: "" },
  destino: { lat: null, lng: null, address: "" },
};

function _setOrigenCoords(lat, lng, address) {
  _pick.origen = { lat, lng, address };
  // Llenar el input de texto automáticamente
  const inp = document.getElementById("cvOrigen");
  if (inp) inp.value = address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  // Guardar en hidden inputs
  const elLat = document.getElementById("cvOrigenLat");
  const elLng = document.getElementById("cvOrigenLng");
  if (elLat) elLat.value = lat;
  if (elLng) elLng.value = lng;
  // Indicador visual: punto verde en el input
  const status = document.getElementById("origenStatus");
  if (status) {
    status.textContent = "✓";
    status.className = "input-map-status confirmed";
  }
}

function _setDestinoCoords(lat, lng, address) {
  _pick.destino = { lat, lng, address };
  const inp = document.getElementById("cvDestino");
  if (inp) inp.value = address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const elLat = document.getElementById("cvDestinoLat");
  const elLng = document.getElementById("cvDestinoLng");
  if (elLat) elLat.value = lat;
  if (elLng) elLng.value = lng;
  const status = document.getElementById("destinoStatus");
  if (status) {
    status.textContent = "✓";
    status.className = "input-map-status confirmed";
  }
}

function _setupPickerOrigen() {
  if (!_mapsReady) {
    toast("Google Maps aún no ha cargado.", "error");
    return;
  }

  const wrap = document.getElementById("mapaPickerOrigenWrap");
  const isOpen = wrap.style.display !== "none";

  if (isOpen) {
    // Cerrar el mapa
    wrap.style.display = "none";
    const lbl = document.getElementById("btnPickOrigenLabel");
    if (lbl) lbl.textContent = "Seleccionar en el mapa";
    document.getElementById("btnPickOrigen")?.classList.remove("active");
    return;
  }

  wrap.style.display = "block";
  const lbl = document.getElementById("btnPickOrigenLabel");
  if (lbl) lbl.textContent = "Cerrar mapa ✕";
  document.getElementById("btnPickOrigen")?.classList.add("active");

  const initCoords = _pick.origen.lat
    ? { lat: _pick.origen.lat, lng: _pick.origen.lng }
    : null;

  URideMaps.openPickerMap(
    "mapaPickerOrigen",
    {
      color: "#6366f1",
      label: "A",
      title: "Punto de origen",
      initial: initCoords,
    },
    ({ lat, lng, address }) => {
      _setOrigenCoords(lat, lng, address);
    },
  );
}

function _setupPickerDestino() {
  if (!_mapsReady) {
    toast("Google Maps aún no ha cargado.", "error");
    return;
  }

  const wrap = document.getElementById("mapaPickerDestinoWrap");
  const isOpen = wrap.style.display !== "none";

  if (isOpen) {
    wrap.style.display = "none";
    const lbl = document.getElementById("btnPickDestinoLabel");
    if (lbl) lbl.textContent = "Seleccionar en el mapa";
    document.getElementById("btnPickDestino")?.classList.remove("active");
    return;
  }

  wrap.style.display = "block";
  const lbl = document.getElementById("btnPickDestinoLabel");
  if (lbl) lbl.textContent = "Cerrar mapa ✕";
  document.getElementById("btnPickDestino")?.classList.add("active");

  const initCoords = _pick.destino.lat
    ? { lat: _pick.destino.lat, lng: _pick.destino.lng }
    : null;

  URideMaps.openPickerMap(
    "mapaPickerDestino",
    {
      color: "#10b981",
      label: "B",
      title: "Punto de destino",
      initial: initCoords,
    },
    ({ lat, lng, address }) => {
      _setDestinoCoords(lat, lng, address);
    },
  );
}

/* ── Delegación de eventos en el modal crear viaje (picker de mapa) ──
   Usamos el modal como delegador para que los listeners sobrevivan
   cualquier manipulación interna del DOM.
   ──────────────────────────────────────────────────────────────────── */
document.getElementById("modalCrear")?.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  if (btn.id === "btnPickOrigen") {
    _setupPickerOrigen();
    return;
  }
  if (btn.id === "btnPickDestino") {
    _setupPickerDestino();
    return;
  }
});

/* Limpiar pickers al cerrar el modal */
function _resetPickers() {
  _pick.origen = { lat: null, lng: null, address: "" };
  _pick.destino = { lat: null, lng: null, address: "" };
  ["mapaPickerOrigenWrap", "mapaPickerDestinoWrap"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  URideMaps.closePickerMap("mapaPickerOrigen");
  URideMaps.closePickerMap("mapaPickerDestino");
  URideMaps.unbindInputFromPickerMap("cvOrigen");
  URideMaps.unbindInputFromPickerMap("cvDestino");
  // Limpiar indicadores de estado
  ["origenStatus", "destinoStatus"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = "";
      el.className = "input-map-status";
    }
  });
  // Restaurar labels de botones
  const lblO = document.getElementById("btnPickOrigenLabel");
  if (lblO) lblO.textContent = "Seleccionar en el mapa";
  const lblD = document.getElementById("btnPickDestinoLabel");
  if (lblD) lblD.textContent = "Seleccionar en el mapa";
  // Limpiar hidden inputs
  ["cvOrigenLat", "cvOrigenLng", "cvDestinoLat", "cvDestinoLng"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    },
  );
}

/* ══════════════════════════════════════════════════════
   2. TARJETA "VIAJE ACTUAL" en el Home
      Muestra si el usuario es pasajero confirmado en
      un viaje publicado o en_curso.
   ══════════════════════════════════════════════════════ */

async function _cargarViajeActual() {
  const section = document.getElementById("sectionViajeActual");
  if (!section) return;

  try {
    const { pasajero } = await apiGet("/api/viajes/mis-viajes");

    // Buscar el viaje más relevante: en_curso primero, luego publicado
    const participaciones = pasajero || [];
    const activo =
      participaciones.find((p) => p.viaje?.estado === "en_curso") ||
      participaciones.find((p) => p.viaje?.estado === "publicado");

    if (!activo) {
      section.classList.add("hidden");
      return;
    }

    const v = activo.viaje;
    _viajeActualId = v.id;
    section.classList.remove("hidden");

    // Badge
    const badge = document.getElementById("vacBadge");
    if (badge) {
      badge.textContent =
        v.estado === "en_curso" ? "🟢 En curso" : "🕐 Confirmado";
      badge.className = `vac-badge ${v.estado === "en_curso" ? "en-curso" : "confirmado"}`;
    }

    // Datos
    _setTxt("vacRuta", `${v.origen} → ${v.destino}`);
    _setTxt(
      "vacConductor",
      v.conductor?.usuario
        ? `${v.conductor.usuario.nombre} ${v.conductor.usuario.apellido}`
        : "—",
    );
    _setTxt(
      "vacVehiculo",
      v.conductor?.vehiculo
        ? `${v.conductor.vehiculo} · ${v.conductor.color || ""}`
        : "—",
    );
    _setTxt("vacFecha", fmtFecha(v.fecha));
    _setTxt(
      "vacHorario",
      `${v.horaSalida?.slice(0, 5)} → ${v.horaLlegada?.slice(0, 5)}`,
    );

    // Acciones
    const acc = document.getElementById("vacAcciones");
    if (acc) {
      acc.innerHTML = `
        <button class="btn-map btn-map-ghost" id="vacBtnVerDetalle">Ver detalle</button>
        ${
          v.estado === "en_curso" && v.conductor?.usuario?.id !== USER.id
            ? `<button class="btn-map btn-map-primary" id="vacBtnTracking">📍 Ver ubicación conductor</button>`
            : ""
        }`;

      document
        .getElementById("vacBtnVerDetalle")
        ?.addEventListener("click", () => abrirDetalleViaje(v.id));

      document
        .getElementById("vacBtnTracking")
        ?.addEventListener("click", () => _activarTrackingPasajero(v));
    }

    // Mapa con ruta
    if (_mapsReady) {
      setTimeout(() => _renderMapaViajeActual(v), 200);
    }
    // Si Maps llega después, el evento googleMapsReady ya llamó a esta función.
  } catch (e) {
    console.warn("[viajeActual]", e);
    document.getElementById("sectionViajeActual")?.classList.add("hidden");
  }
}

function _renderMapaViajeActual(v) {
  URideMaps.destroyMap("mapViajeActual");
  if (v.origenLat && v.destinoLat) {
    URideMaps.initMap("mapViajeActual");
    URideMaps.showCoordsOnMap(
      "mapViajeActual",
      { lat: parseFloat(v.origenLat), lng: parseFloat(v.origenLng) },
      { lat: parseFloat(v.destinoLat), lng: parseFloat(v.destinoLng) },
    );
  } else if (v.origen && v.destino) {
    URideMaps.initMap("mapViajeActual");
    URideMaps.showRouteOnMap("mapViajeActual", v.origen, v.destino);
  }

  // Si está en_curso, activar escucha de GPS del conductor
  if (v.estado === "en_curso") {
    const panel = document.getElementById("vacTrackingPanel");
    panel?.classList.remove("hidden");
    socket.emit("viaje:unirse", { viajeId: v.id });
    URideMaps.watchTracking("mapViajeActual", socket, v.id);
    socket.on(`ubicacion:${v.id}`, () => {
      _setTxt(
        "vacTrackingTs",
        `Última posición: ${new Date().toLocaleTimeString("es-EC")}`,
      );
      document.getElementById("vacTrackingDot")?.classList.remove("offline");
    });
  }
}

function _activarTrackingPasajero(v) {
  document.getElementById("vacTrackingPanel")?.classList.remove("hidden");
  socket.emit("viaje:unirse", { viajeId: v.id });
  if (_mapsReady) {
    if (
      !document.getElementById("mapViajeActual").classList.contains("map-ready")
    ) {
      _renderMapaViajeActual(v);
    }
    URideMaps.watchTracking("mapViajeActual", socket, v.id);
  }
  toast("Escuchando ubicación del conductor…", "ok");
}

/* Recargar viaje actual cuando cambian los datos */
const _origCargarMisViajes = window.cargarMisViajes;
if (typeof _origCargarMisViajes === "function") {
  window.cargarMisViajes = async function () {
    await _origCargarMisViajes();
    _cargarViajeActual();
  };
}

/* ══════════════════════════════════════════════════════
   3. MAPA EN "MIS VIAJES" — ver ruta en tarjetas
   ══════════════════════════════════════════════════════ */

/* Delegación de eventos en los contenedores de mis viajes */
["tabComoPasajero", "tabComoConductor"].forEach((tabId) => {
  document.getElementById(tabId)?.addEventListener("click", async (e) => {
    /* ── Botón "Ver ruta" ── */
    const btnRuta = e.target.closest(".btnVerRutaMisViajes");
    if (btnRuta) {
      const card = btnRuta.closest(".mi-viaje-card");
      const mapId = btnRuta.dataset.mapid;
      const viajeId = btnRuta.dataset.id;
      const mapWrap = document.getElementById(`mvMapWrap_${viajeId}`);
      if (!mapWrap) return;

      const visible = mapWrap.style.display !== "none";
      if (visible) {
        mapWrap.style.display = "none";
        btnRuta.textContent = "🗺 Ver ruta";
        URideMaps.destroyMap(mapId);
      } else {
        mapWrap.style.display = "block";
        btnRuta.textContent = "🗺 Ocultar ruta";
        if (!_mapsReady) {
          toast("Google Maps cargando…", "info");
          return;
        }

        // Obtener datos del viaje
        try {
          const v = await apiGet(`/api/viajes/${viajeId}`);
          setTimeout(() => {
            URideMaps.initMap(mapId);
            if (v.origenLat && v.destinoLat) {
              URideMaps.showCoordsOnMap(
                mapId,
                { lat: parseFloat(v.origenLat), lng: parseFloat(v.origenLng) },
                {
                  lat: parseFloat(v.destinoLat),
                  lng: parseFloat(v.destinoLng),
                },
              );
            } else {
              URideMaps.showRouteOnMap(mapId, v.origen, v.destino);
            }
          }, 150);
        } catch {
          toast("No se pudo cargar la ruta.", "error");
        }
      }
    }
  });
});

/* ══════════════════════════════════════════════════════
   4. MAPA EN MODAL DE DETALLE DE VIAJE
   ══════════════════════════════════════════════════════ */

/* Guardamos referencia al viaje del detalle actual */
const _origAbrirDetalle = window.abrirDetalleViaje;
if (typeof _origAbrirDetalle === "function") {
  window.abrirDetalleViaje = async function (id) {
    // Limpiar estado anterior
    _viajeDetalle = null;
    document.getElementById("mapaDetalleWrap").style.display = "none";
    document.getElementById("btnToggleMapaDetalle").textContent =
      "🗺 Ver ruta en mapa";
    document.getElementById("trackingPanelDetalle")?.classList.add("hidden");
    URideMaps.destroyMap("mapDetalleViaje");

    await _origAbrirDetalle(id);

    try {
      _viajeDetalle = await apiGet(`/api/viajes/${id}`);
    } catch (e) {
      console.warn("viajeDetalle:", e);
    }
  };
}

/* Botón toggle mapa en detalle */
document
  .getElementById("btnToggleMapaDetalle")
  ?.addEventListener("click", () => {
    const wrap = document.getElementById("mapaDetalleWrap");
    const open = wrap.style.display === "none";
    wrap.style.display = open ? "block" : "none";
    document.getElementById("btnToggleMapaDetalle").textContent = open
      ? "🗺 Ocultar mapa"
      : "🗺 Ver ruta en mapa";

    if (open && _mapsReady && _viajeDetalle) {
      setTimeout(() => {
        const v = _viajeDetalle;
        URideMaps.initMap("mapDetalleViaje");
        if (v.origenLat && v.destinoLat) {
          URideMaps.showCoordsOnMap(
            "mapDetalleViaje",
            { lat: parseFloat(v.origenLat), lng: parseFloat(v.origenLng) },
            { lat: parseFloat(v.destinoLat), lng: parseFloat(v.destinoLng) },
          );
        } else {
          URideMaps.showRouteOnMap("mapDetalleViaje", v.origen, v.destino);
        }
        // Tracking si está en_curso
        if (v.estado === "en_curso") {
          document
            .getElementById("trackingPanelDetalle")
            ?.classList.remove("hidden");
          socket.emit("viaje:unirse", { viajeId: v.id });
          URideMaps.watchTracking("mapDetalleViaje", socket, v.id);
          socket.on(`ubicacion:${v.id}`, () => {
            _setTxt(
              "trackingTimestamp",
              `Última posición: ${new Date().toLocaleTimeString("es-EC")}`,
            );
            document
              .getElementById("trackingDotDetalle")
              ?.classList.remove("offline");
          });
        }
      }, 150);
    } else if (!open) {
      if (_viajeDetalle)
        socket.emit("viaje:salir", { viajeId: _viajeDetalle.id });
      URideMaps.destroyMap("mapDetalleViaje");
    }
  });

/* Cerrar modal detalle → limpiar */
["detailClose", "detailCancel"].forEach((id) => {
  document.getElementById(id)?.addEventListener("click", () => {
    if (_viajeDetalle)
      socket.emit("viaje:salir", { viajeId: _viajeDetalle.id });
    URideMaps.destroyMap("mapDetalleViaje");
    document.getElementById("mapaDetalleWrap").style.display = "none";
    _viajeDetalle = null;
  });
});

/* ══════════════════════════════════════════════════════
   5. GPS TRACKING — Modal del conductor
   ══════════════════════════════════════════════════════ */

function abrirTrackingConductor(
  viajeId,
  origen,
  destino,
  origenCoords,
  destinoCoords,
) {
  _trackingViajeId = viajeId;
  const modal = document.getElementById("modalTracking");
  modal?.classList.remove("hidden");
  socket.emit("viaje:unirse", { viajeId });

  if (_mapsReady) {
    setTimeout(() => {
      URideMaps.initMap("mapEnCurso");
      if (origenCoords && destinoCoords) {
        URideMaps.showCoordsOnMap("mapEnCurso", origenCoords, destinoCoords);
      } else {
        URideMaps.showRouteOnMap("mapEnCurso", origen, destino);
      }
      URideMaps.startTracking("mapEnCurso", socket, viajeId);
      socket.on(`ubicacion:${viajeId}`, () => {
        _setTxt(
          "trackingTimestampConductor",
          `GPS actualizado: ${new Date().toLocaleTimeString("es-EC")}`,
        );
        document
          .getElementById("trackingDotConductor")
          ?.classList.remove("offline");
      });
    }, 200);
  } else {
    // GPS sin mapa visual
    URideMaps.startTracking(null, socket, viajeId);
  }
}

/* Interceptar "Iniciar viaje" con delegación en tabComoConductor */
document.getElementById("tabComoConductor")?.addEventListener(
  "click",
  async (e) => {
    const btn = e.target.closest(".btnIniciarViaje");
    if (!btn) return;
    const viajeId = btn.dataset.id;
    if (!viajeId) return;
    try {
      await apiPatch(`/api/viajes/${viajeId}/iniciar`);
      pushNotif("Viaje iniciado. Activando GPS…", "ok");
      const v = await apiGet(`/api/viajes/${viajeId}`);
      const origCoords = v.origenLat
        ? { lat: parseFloat(v.origenLat), lng: parseFloat(v.origenLng) }
        : null;
      const destCoords = v.destinoLat
        ? { lat: parseFloat(v.destinoLat), lng: parseFloat(v.destinoLng) }
        : null;
      abrirTrackingConductor(
        viajeId,
        v.origen,
        v.destino,
        origCoords,
        destCoords,
      );
      if (typeof cargarMisViajes === "function") cargarMisViajes();
    } catch (err) {
      pushNotif(err.message || "Error al iniciar viaje.", "error");
    }
  },
  true,
); // capture para tener prioridad

/* Botón minimizar y cierre del modal de tracking */
document
  .getElementById("btnCerrarTracking")
  ?.addEventListener("click", () =>
    document.getElementById("modalTracking")?.classList.add("hidden"),
  );
document
  .getElementById("closeTracking")
  ?.addEventListener("click", () =>
    document.getElementById("modalTracking")?.classList.add("hidden"),
  );

/* Botón finalizar desde el modal de tracking */
document
  .getElementById("btnFinalizarDesdeTracking")
  ?.addEventListener("click", async () => {
    if (!_trackingViajeId) return;
    try {
      await apiPatch(`/api/viajes/${_trackingViajeId}/finalizar`);
      URideMaps.stopTracking();
      socket.emit("viaje:salir", { viajeId: _trackingViajeId });
      URideMaps.destroyMap("mapEnCurso");
      document.getElementById("modalTracking")?.classList.add("hidden");
      pushNotif("¡Viaje finalizado!", "ok");
      _trackingViajeId = null;
      if (typeof cargarMisViajes === "function") cargarMisViajes();
    } catch (err) {
      pushNotif(err.message || "Error al finalizar.", "error");
    }
  });

/* Retomar tracking si hay viaje en_curso al recargar */
async function _checkViajeEnCurso() {
  try {
    const { conductor } = await apiGet("/api/viajes/mis-viajes");
    const enCurso = (conductor || []).find((v) => v.estado === "en_curso");
    if (!enCurso) return;

    const banner = document.createElement("div");
    banner.className = "tracking-panel";
    banner.style.cssText = "margin:0 0 1rem 0;cursor:pointer;";
    banner.innerHTML = `
      <div class="tracking-dot"></div>
      <div class="tracking-label">
        <strong>Tienes un viaje en curso</strong>
        <small>${enCurso.origen} → ${enCurso.destino} · Toca para retomar GPS</small>
      </div>`;
    banner.addEventListener("click", () => {
      banner.remove();
      const oc = enCurso.origenLat
        ? {
            lat: parseFloat(enCurso.origenLat),
            lng: parseFloat(enCurso.origenLng),
          }
        : null;
      const dc = enCurso.destinoLat
        ? {
            lat: parseFloat(enCurso.destinoLat),
            lng: parseFloat(enCurso.destinoLng),
          }
        : null;
      abrirTrackingConductor(
        enCurso.id,
        enCurso.origen,
        enCurso.destino,
        oc,
        dc,
      );
    });
    document.querySelector(".content")?.prepend(banner);
  } catch (_) {}
}
window.addEventListener("load", () => setTimeout(_checkViajeEnCurso, 1800));

/* ══════════════════════════════════════════════════════
   6. PATCH renderViajeConductor — agregar botón "Ver ruta"
      en "Mis viajes → Como conductor"
   ══════════════════════════════════════════════════════ */

/* Sobreescribir la función que renderiza tarjetas del conductor.
   En home.js esta función está dentro de cargarMisViajes(),
   así que la reemplazamos completa. */

const _origRenderConductorList = window._renderMisViajesConductor;

/**
 * Versión parcheada del renderizado de viajes como conductor.
 * Se llama desde cargarMisViajes() — necesitas exponer esa función
 * o bien esta función se conecta vía el evento de delegación.
 *
 * ALTERNATIVA DIRECTA: aplica este parche buscando en home.js
 * el bloque que genera el HTML de ".mi-viaje-card" para el conductor
 * y agrega el siguiente fragmento justo ANTES del cierre de </div>:
 *
 *   <div class="mvActions" style="margin-top:.4rem">
 *     <button class="btnVerRutaMisViajes btn-map btn-map-ghost"
 *             data-id="${v.id}"
 *             data-mapid="mvMap_${v.id}">
 *       🗺 Ver ruta
 *     </button>
 *   </div>
 *   <div id="mvMapWrap_${v.id}" style="display:none;padding:.5rem">
 *     <div class="map-container map-sm" id="mvMap_${v.id}"></div>
 *   </div>
 *
 * Y en el lado del PASAJERO, exactamente igual pero con:
 *   data-id="${v.viaje?.id || v.id}"
 *   data-mapid="mvMap_${v.viaje?.id || v.id}"
 *   id="mvMapWrap_${v.viaje?.id || v.id}"
 *   id="mvMap_${v.viaje?.id || v.id}"
 */

/* ══════════════════════════════════════════════════════
   UTIL interna
   ══════════════════════════════════════════════════════ */
function _setTxt(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? "—";
}
