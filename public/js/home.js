/* ============================================================
   U-Ride — home.js  (camelCase)
   Lógica de la página principal post-login
   ============================================================ */

/* ── 1. Verificar sesión ───────────────────────────────── */
const userRaw = sessionStorage.getItem("uride_user");
if (!userRaw) window.location.href = "/login.html";
const USER = JSON.parse(userRaw);

/* ── 2. Socket.IO ──────────────────────────────────────── */
const socket = io({ withCredentials: true });

socket.on("connect", () => socket.emit("unirse", USER.id));

socket.on("solicitud:aceptada", (data) => {
  pushNotif(data.mensaje, "ok");
  cargarViajes();
});
socket.on("solicitud:rechazada", (data) => pushNotif(data.mensaje, "error"));
socket.on("error:socket", (data) => pushNotif(data.mensaje, "error"));

/* ── 3. Referencias DOM ────────────────────────────────── */
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const navItems = document.querySelectorAll(".navItem[data-view]");
const views = document.querySelectorAll(".view");

const greetingMsg = document.getElementById("greetingMsg");
const userNameEl = document.getElementById("userName");
const userRoleEl = document.getElementById("userRole");
const userAvatarEl = document.getElementById("userAvatar");
const statViajes = document.getElementById("statViajes");
const statRep = document.getElementById("statRep");

const viajesGrid = document.getElementById("viajesGrid");
const sectionSolicitudes = document.getElementById("sectionSolicitudes");
const solicitudesList = document.getElementById("solicitudesList");
const badgeSol = document.getElementById("badgeSol");

// Botón de rol en topbar
const rolSwitchBtn = document.getElementById("rolSwitchBtn");
const rolSwitchLabel = document.getElementById("rolSwitchLabel");
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
const btnLogout = document.getElementById("btnLogout");

// Modo activo
const modeBanner = document.getElementById("modeBanner");
const modeBannerTitle = document.getElementById("modeBannerTitle");
const modeBannerSub = document.getElementById("modeBannerSub");
const modeBannerIcon = document.getElementById("modeBannerIcon");

// Perfil
const perfilAvatar = document.getElementById("perfilAvatar");
const inputFoto = document.getElementById("inputFoto");

// Tarjeta conductor en perfil
const cardConductor = document.getElementById("cardConductor");

/* ── 4. Estado ─────────────────────────────────────────── */
let MODO = sessionStorage.getItem("uride_modo") || "pasajero";
let viajeSelId = null;

/* ── 5. Init ───────────────────────────────────────────── */
(async function init() {
  rellenarUsuario();
  mostrarSaludo();
  aplicarModo(MODO, false); // sin animar en la carga inicial
  await Promise.all([cargarStats(), cargarViajes()]);
  cargarPerfilConductor();
})();

/* ── 6. Usuario ────────────────────────────────────────── */
function rellenarUsuario() {
  userNameEl.textContent = `${USER.nombre} ${USER.apellido}`;
  userRoleEl.textContent =
    USER.rol === "administrador" ? "Administrador" : "Estudiante";

  const inicial = USER.nombre?.[0]?.toUpperCase() || "?";
  if (USER.foto) {
    userAvatarEl.innerHTML = `<img src="${USER.foto}" alt="foto"/>`;
    perfilAvatar.innerHTML = `<img src="${USER.foto}" alt="foto"/>`;
  } else {
    userAvatarEl.textContent = inicial;
    perfilAvatar.textContent = inicial;
  }

  document.getElementById("pfNombre").value = USER.nombre || "";
  document.getElementById("pfApellido").value = USER.apellido || "";
  document.getElementById("pfCorreo").value = USER.correo || "";
  document.getElementById("pfCarrera").value = USER.carrera || "";
  document.getElementById("pfZona").value = USER.zona || "";
  document.getElementById("pfTelefono").value = USER.telefono || "";
}

function mostrarSaludo() {
  const h = new Date().getHours();
  const saludo =
    h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  greetingMsg.textContent = `${saludo}, ${USER.nombre} 👋`;
}

/* ── 7. Stats ──────────────────────────────────────────── */
async function cargarStats() {
  try {
    const r = await apiGet("/api/usuarios/stats");
    statViajes.textContent = r.totalViajes ?? "0";
    statRep.textContent = r.promedio ? `${r.promedio}⭐` : "—";
  } catch {
    /* silencioso */
  }
}

/* ── 8. Cambio de ROL (topbar) ─────────────────────────── */
rolSwitchBtn.addEventListener("click", (e) => {
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
  if (!rolSwitchBtn.contains(e.target)) rolDropdown.classList.add("hidden");
});

function aplicarModo(modo, animar = true) {
  MODO = modo;
  sessionStorage.setItem("uride_modo", modo);

  const esConductor = modo === "conductor";

  // Botón en topbar
  rolSwitchLabel.textContent = esConductor ? "Conductor" : "Pasajero";
  rolSwitchBtn.classList.toggle("modoConductor", esConductor);
  rolSwitchBtn.classList.toggle("modoPasajero", !esConductor);
  rolSwitchBtn.querySelector(".iconPasajero").style.display = esConductor
    ? "none"
    : "inline";
  rolSwitchBtn.querySelector(".iconConductor").style.display = esConductor
    ? "inline"
    : "none";

  // Opciones dropdown
  optPasajero.classList.toggle("active", !esConductor);
  optConductor.classList.toggle("active", esConductor);

  // Banner en la vista inicio
  if (esConductor) {
    modeBannerIcon.textContent = "🚗";
    modeBannerTitle.textContent = "Modo Conductor activo";
    modeBannerSub.textContent =
      "Puedes publicar viajes y gestionar solicitudes.";
    modeBanner.classList.add("modoConductorBanner");
    modeBanner.classList.remove("modoPaseroBanner");
  } else {
    modeBannerIcon.textContent = "🧍";
    modeBannerTitle.textContent = "Modo Pasajero activo";
    modeBannerSub.textContent = "Puedes buscar y solicitar viajes disponibles.";
    modeBanner.classList.add("modoPaseroBanner");
    modeBanner.classList.remove("modoConductorBanner");
  }

  // Sección de solicitudes
  sectionSolicitudes.style.display = esConductor ? "block" : "none";

  // Mostrar u ocultar tarjeta de conductor en perfil
  if (cardConductor)
    cardConductor.style.display = esConductor ? "block" : "none";

  if (esConductor) {
    cargarSolicitudes();
  }

  if (animar)
    pushNotif(
      `Modo ${esConductor ? "conductor" : "pasajero"} activado.`,
      "info",
    );
}

/* ── 9. Viajes disponibles ─────────────────────────────── */
async function cargarViajes(filtros = {}) {
  viajesGrid.innerHTML = `
    <div class="skeletonCard"></div>
    <div class="skeletonCard"></div>
    <div class="skeletonCard"></div>`;
  try {
    const params = new URLSearchParams(filtros);
    const viajes = await apiGet(`/api/viajes?${params}`);
    renderViajes(viajesGrid, viajes);
  } catch {
    viajesGrid.innerHTML =
      '<p style="color:var(--textMuted);padding:1rem">No se pudieron cargar los viajes.</p>';
  }
}

function renderViajes(container, viajes) {
  if (!viajes?.length) {
    container.innerHTML =
      '<p style="color:var(--textMuted);padding:1rem">No hay viajes disponibles.</p>';
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
      const inicial = (v.conductorNombre?.[0] || "?").toUpperCase();
      return `
    <article class="viajeCard" data-id="${v.id}">
      <div class="vcRuta">
        <span>${v.origen}</span>
        <span class="vcArrow">→</span>
        <span>${v.destino}</span>
      </div>
      <div class="vcMeta">
        <span class="vcChip">📅 ${formatearFecha(v.fecha)}</span>
        <span class="vcChip">🕐 ${v.horaSalida?.slice(0, 5)}</span>
      </div>
      <div class="vcFooter">
        <div class="vcConductor">
          <div class="vcAv">${inicial}</div>
          ${v.conductorNombre || "Conductor"}
        </div>
        <span class="vcCupos ${cuposCls}">
          ${v.cuposDisponibles === 0 ? "Sin cupos" : `${v.cuposDisponibles} cupo${v.cuposDisponibles !== 1 ? "s" : ""}`}
        </span>
      </div>
    </article>`;
    })
    .join("");

  container.querySelectorAll(".viajeCard").forEach((card) => {
    card.addEventListener("click", () => abrirDetalleViaje(card.dataset.id));
  });
}

/* ── 10. Detalle de viaje ──────────────────────────────── */
async function abrirDetalleViaje(id) {
  viajeSelId = id;
  try {
    const v = await apiGet(`/api/viajes/${id}`);
    document.getElementById("detailRuta").textContent =
      `${v.origen} → ${v.destino}`;
    document.getElementById("detailBody").innerHTML = `
      <div style="display:flex;flex-direction:column;gap:.75rem;font-size:.9rem;">
        <div><strong>Conductor:</strong> ${v.conductor?.usuario?.nombre || "—"} ${v.conductor?.usuario?.apellido || ""}</div>
        <div><strong>Vehículo:</strong> ${v.conductor?.vehiculo || "—"} · ${v.conductor?.color || ""}</div>
        <div><strong>Placa:</strong> ${v.conductor?.placa || "—"}</div>
        <div><strong>Fecha:</strong> ${formatearFecha(v.fecha)}</div>
        <div><strong>Salida:</strong> ${v.horaSalida?.slice(0, 5)} &nbsp;·&nbsp; <strong>Llegada:</strong> ${v.horaLlegada?.slice(0, 5)}</div>
        <div><strong>Cupos disponibles:</strong> ${v.cuposDisponibles}</div>
        ${v.notas ? `<div><strong>Notas:</strong><br/><span style="color:var(--textSecondary)">${v.notas}</span></div>` : ""}
      </div>`;

    const btnSol = document.getElementById("btnSolicitar");
    btnSol.disabled = v.cuposDisponibles === 0;
    btnSol.textContent =
      v.cuposDisponibles === 0 ? "Sin cupos" : "Solicitar cupo";
    modalViaje.classList.remove("hidden");
  } catch {
    pushNotif("No se pudo cargar el detalle del viaje.", "error");
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
    pushNotif("Solicitud enviada. Espera la respuesta del conductor.", "ok");
    modalViaje.classList.add("hidden");
    cargarViajes();
  } catch (err) {
    pushNotif(err.message || "No se pudo enviar la solicitud.", "error");
  }
});

/* ── 11. Solicitudes (conductor) ───────────────────────── */
async function cargarSolicitudes() {
  try {
    const data = await apiGet("/api/solicitudes/pendientes");
    badgeSol.textContent = data.length;
    renderSolicitudes(data);
  } catch {
    /* silencioso */
  }
}

function renderSolicitudes(items) {
  if (!items?.length) {
    solicitudesList.innerHTML =
      '<p style="color:var(--textMuted);font-size:.875rem;padding:.5rem 0">Sin solicitudes pendientes.</p>';
    return;
  }
  solicitudesList.innerHTML = items
    .map((s) => {
      const inicial = (s.pasajero?.nombre?.[0] || "?").toUpperCase();
      return `
    <div class="solCard" data-solId="${s.id}">
      <div class="solAv">${inicial}</div>
      <div class="solInfo">
        <div class="solNombre">${s.pasajero?.nombre || ""} ${s.pasajero?.apellido || ""}</div>
        <div class="solRuta">${s.viaje?.origen} → ${s.viaje?.destino}</div>
      </div>
      <div class="solActions">
        <button class="btnAceptar"  data-id="${s.id}">Aceptar</button>
        <button class="btnRechazar" data-id="${s.id}">Rechazar</button>
      </div>
    </div>`;
    })
    .join("");

  solicitudesList
    .querySelectorAll(".btnAceptar")
    .forEach((b) =>
      b.addEventListener("click", () =>
        gestionarSolicitud(b.dataset.id, "aceptar"),
      ),
    );
  solicitudesList
    .querySelectorAll(".btnRechazar")
    .forEach((b) =>
      b.addEventListener("click", () =>
        gestionarSolicitud(b.dataset.id, "rechazar"),
      ),
    );
}

async function gestionarSolicitud(id, accion) {
  try {
    await apiPatch(`/api/solicitudes/${id}/${accion}`);
    socket.emit(`solicitud:${accion}`, {
      solicitudId: id,
      conductorId: USER.id,
    });
    pushNotif(
      `Solicitud ${accion === "aceptar" ? "aceptada" : "rechazada"} correctamente.`,
      "ok",
    );
    cargarSolicitudes();
    cargarViajes();
  } catch (err) {
    pushNotif(err.message || "Error al gestionar la solicitud.", "error");
  }
}

/* ── 12. Crear viaje ───────────────────────────────────── */
function abrirModalCrear() {
  // Solo conductores pueden publicar viajes
  if (MODO !== "conductor") {
    pushNotif("Activa el modo Conductor para publicar viajes.", "error");
    return;
  }
  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("cvFecha").min = hoy;
  modalCrear.classList.remove("hidden");
}

document.getElementById("navCrear")?.addEventListener("click", (e) => {
  e.preventDefault();
  abrirModalCrear();
});
document.getElementById("qaCrear")?.addEventListener("click", abrirModalCrear);
document
  .getElementById("modalClose")
  ?.addEventListener("click", () => modalCrear.classList.add("hidden"));
document
  .getElementById("modalCancel")
  ?.addEventListener("click", () => modalCrear.classList.add("hidden"));

document
  .getElementById("formCrearViaje")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const alertCrear = document.getElementById("alertCrear");
    alertCrear.className = "alert";

    const body = {
      origen: document.getElementById("cvOrigen").value.trim(),
      destino: document.getElementById("cvDestino").value.trim(),
      fecha: document.getElementById("cvFecha").value,
      horaSalida: document.getElementById("cvHoraSalida").value,
      horaLlegada: document.getElementById("cvHoraLlegada").value,
      cuposTotal: parseInt(document.getElementById("cvCupos").value),
      notas: document.getElementById("cvNotas").value.trim(),
    };

    if (body.horaLlegada <= body.horaSalida) {
      alertCrear.className = "alert show-error";
      alertCrear.textContent =
        "La hora de llegada debe ser mayor a la de salida.";
      return;
    }

    try {
      await apiPost("/api/viajes", body);
      modalCrear.classList.add("hidden");
      pushNotif("¡Viaje publicado correctamente!", "ok");
      cargarViajes();
      cargarSolicitudes();
      document.getElementById("formCrearViaje").reset();
    } catch (err) {
      alertCrear.className = "alert show-error";
      alertCrear.textContent = err.message || "Error al publicar el viaje.";
    }
  });

/* ── 13. Buscar viajes (vista buscar) ──────────────────── */
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
      '<div class="skeletonCard"></div><div class="skeletonCard"></div>';
    try {
      const viajes = await apiGet(
        `/api/viajes?${new URLSearchParams(filtros)}`,
      );
      renderViajes(grid, viajes);
    } catch {
      grid.innerHTML =
        '<p style="color:var(--textMuted)">Error al buscar viajes.</p>';
    }
  });

/* ── 14. Perfil — datos personales ─────────────────────── */
document.getElementById("formPerfil").addEventListener("submit", async (e) => {
  e.preventDefault();
  const alertP = document.getElementById("alertPerfil");
  alertP.className = "alert";

  const body = {
    nombre: document.getElementById("pfNombre").value.trim(),
    apellido: document.getElementById("pfApellido").value.trim(),
    carrera: document.getElementById("pfCarrera").value.trim(),
    zona: document.getElementById("pfZona").value.trim(),
    telefono: document.getElementById("pfTelefono").value.trim(),
  };

  // Validaciones básicas
  if (!body.nombre || !body.apellido) {
    alertP.className = "alert show-error";
    alertP.textContent = "Nombre y apellido son obligatorios.";
    return;
  }

  try {
    const updated = await apiPatch(`/api/usuarios/${USER.id}`, body);
    Object.assign(USER, body);
    sessionStorage.setItem("uride_user", JSON.stringify(USER));
    rellenarUsuario();
    alertP.className = "alert show-ok";
    alertP.textContent = "¡Perfil actualizado correctamente!";
    // Limpiar alerta después de 3s
    setTimeout(() => {
      alertP.className = "alert";
    }, 3000);
  } catch (err) {
    alertP.className = "alert show-error";
    alertP.textContent = err.message || "Error al actualizar el perfil.";
  }
});

/* ── 15. Perfil — datos de conductor ───────────────────── */
async function cargarPerfilConductor() {
  try {
    const data = await apiGet(`/api/conductores/${USER.id}`);
    if (data) {
      document.getElementById("pfVehiculo").value = data.vehiculo || "";
      document.getElementById("pfColor").value = data.color || "";
      document.getElementById("pfPlaca").value = data.placa || "";
      document.getElementById("pfLicencia").value = data.licencia || "";
      document.getElementById("pfLicenciaVence").value =
        data.licenciaVence || "";
      // Guardar en USER para el modal de detalle
      USER.conductor = data;
    }
  } catch {
    /* Si no tiene perfil de conductor, es normal */
  }
}

document
  .getElementById("formConductor")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const alertC = document.getElementById("alertConductor");
    alertC.className = "alert";

    const body = {
      vehiculo: document.getElementById("pfVehiculo").value.trim(),
      color: document.getElementById("pfColor").value.trim(),
      placa: document.getElementById("pfPlaca").value.trim().toUpperCase(),
      licencia: document.getElementById("pfLicencia").value.trim(),
      licenciaVence: document.getElementById("pfLicenciaVence").value,
    };

    if (!body.vehiculo || !body.placa || !body.licencia) {
      alertC.className = "alert show-error";
      alertC.textContent =
        "Vehículo, placa y número de licencia son obligatorios.";
      return;
    }

    // Verificar que la licencia no esté vencida
    if (body.licenciaVence && new Date(body.licenciaVence) < new Date()) {
      alertC.className = "alert show-error";
      alertC.textContent = "Tu licencia está vencida. Por favor renuévala.";
      return;
    }

    try {
      await apiPost(`/api/conductores/${USER.id}`, body);
      USER.conductor = body;
      sessionStorage.setItem("uride_user", JSON.stringify(USER));
      alertC.className = "alert show-ok";
      alertC.textContent = "¡Datos del vehículo guardados correctamente!";
      setTimeout(() => {
        alertC.className = "alert";
      }, 3000);
    } catch (err) {
      alertC.className = "alert show-error";
      alertC.textContent =
        err.message || "Error al guardar los datos del vehículo.";
    }
  });

/* ── 16. Foto de perfil ────────────────────────────────── */
document
  .getElementById("btnAvatarEdit")
  .addEventListener("click", () => inputFoto.click());

inputFoto.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validar tamaño máximo 2MB
  if (file.size > 2 * 1024 * 1024) {
    pushNotif("La imagen no debe superar los 2 MB.", "error");
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
    pushNotif("Foto de perfil actualizada.", "ok");
  } catch {
    pushNotif("No se pudo subir la foto.", "error");
  }
});

/* ── 17. Tabs mis viajes ───────────────────────────────── */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".tabContent")
      .forEach((c) => c.classList.add("hidden"));
    tab.classList.add("active");
    const target = document.getElementById(
      `tab${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}`,
    );
    target?.classList.remove("hidden");
  });
});

/* ── 18. Navegación entre vistas ───────────────────────── */
navItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    cambiarVista(item.dataset.view);
    sidebar.classList.remove("open");
  });
});

document.querySelectorAll("[data-view]").forEach((el) => {
  el.addEventListener("click", (e) => {
    const view = el.dataset.view;
    if (view) {
      e.preventDefault();
      cambiarVista(view);
    }
  });
});

function cambiarVista(nombre) {
  views.forEach((v) => v.classList.remove("active"));
  navItems.forEach((n) => n.classList.remove("active"));

  // Las vistas ahora tienen id en camelCase: viewInicio, viewBuscar, etc.
  const viewId = `view${nombre.charAt(0).toUpperCase() + nombre.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`;
  const targetView = document.getElementById(viewId);
  const targetNav = document.querySelector(`.navItem[data-view="${nombre}"]`);

  targetView?.classList.add("active");
  targetNav?.classList.add("active");

  if (nombre === "buscar") {
    const g = document.getElementById("viajesGridBuscar");
    if (!g.children.length) cargarViajesEnGrid(g);
  }
}

async function cargarViajesEnGrid(grid) {
  try {
    const v = await apiGet("/api/viajes");
    renderViajes(grid, v);
  } catch {
    grid.innerHTML =
      '<p style="color:var(--textMuted)">Error al cargar viajes.</p>';
  }
}

/* ── 19. Sidebar mobile ────────────────────────────────── */
sidebarToggle.addEventListener("click", () => sidebar.classList.toggle("open"));
document.addEventListener("click", (e) => {
  if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});

/* ── 20. Notificaciones (push interno) ─────────────────── */
let notifCount = 0;

function pushNotif(msg, tipo = "info") {
  notifCount++;
  notifBadge.textContent = notifCount;
  notifBadge.classList.remove("hidden");

  const empty = notifList.querySelector(".notifEmpty");
  if (empty) empty.remove();

  const li = document.createElement("li");
  li.className = `notifItem ${tipo}`;
  li.textContent = msg;
  notifList.prepend(li);

  // Toast visual
  mostrarToast(msg, tipo);
}

notifBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  notifPanel.classList.toggle("hidden");
});
notifClear.addEventListener("click", () => {
  notifList.innerHTML = '<li class="notifEmpty">Sin notificaciones nuevas</li>';
  notifBadge.classList.add("hidden");
  notifCount = 0;
});
document.addEventListener("click", (e) => {
  if (!notifPanel.contains(e.target) && !notifBtn.contains(e.target)) {
    notifPanel.classList.add("hidden");
  }
});

/* ── 21. Toast ─────────────────────────────────────────── */
function mostrarToast(msg, tipo = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.textContent = msg;
  container.appendChild(toast);
  // Forzar reflow para animación
  requestAnimationFrame(() => toast.classList.add("toastVisible"));
  setTimeout(() => {
    toast.classList.remove("toastVisible");
    toast.addEventListener("transitionend", () => toast.remove(), {
      once: true,
    });
  }, 3200);
}

/* ── 22. Logout ────────────────────────────────────────── */
btnLogout.addEventListener("click", async () => {
  try {
    await apiPost("/api/auth/logout", {});
  } catch {
    /* ok */
  }
  sessionStorage.clear();
  window.location.href = "/login.html";
});

/* ── 23. Búsqueda rápida en topbar ─────────────────────── */
let searchTimer = null;
document.getElementById("searchInput").addEventListener("input", (e) => {
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

/* ── 24. Helpers fetch ─────────────────────────────────── */
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

async function apiPatch(url, body) {
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

/* ── 25. Helper fecha ──────────────────────────────────── */
function formatearFecha(iso) {
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
