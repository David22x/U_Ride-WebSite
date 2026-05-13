/* ============================================================
   U-Ride — home.js
   Lógica de la página principal post-login
   ============================================================ */

/* ── 1. Verificar sesión ───────────────────────────────── */
const user_raw = sessionStorage.getItem("uride_user");
if (!user_raw) {
  window.location.href = "/login.html";
}
const USER = JSON.parse(user_raw);

/* ── 2. Socket.IO ──────────────────────────────────────── */
const socket = io({ withCredentials: true });

socket.on("connect", () => {
  socket.emit("unirse", USER.id);
});

/* Notificación en tiempo real: solicitud aceptada */
socket.on("solicitud:aceptada", (data) => {
  push_notif(data.mensaje, "ok");
  cargar_viajes();
});

/* Notificación en tiempo real: solicitud rechazada */
socket.on("solicitud:rechazada", (data) => {
  push_notif(data.mensaje, "error");
});

/* Error de socket */
socket.on("error:socket", (data) => {
  push_notif(data.mensaje, "error");
});

/* ── 3. Referencias DOM ────────────────────────────────── */
const sidebar = document.getElementById("sidebar");
const sidebar_toggle = document.getElementById("sidebar-toggle");
const nav_items = document.querySelectorAll(".nav-item[data-view]");
const views = document.querySelectorAll(".view");

const greeting_msg = document.getElementById("greeting-msg");
const user_name_el = document.getElementById("user-name");
const user_role_el = document.getElementById("user-role");
const user_avatar_el = document.getElementById("user-avatar");
const stat_viajes = document.getElementById("stat-viajes");
const stat_rep = document.getElementById("stat-rep");

const viajes_grid = document.getElementById("viajes-grid");
const section_solicitudes = document.getElementById("section-solicitudes");
const solicitudes_list = document.getElementById("solicitudes-list");
const badge_sol = document.getElementById("badge-sol");

const btn_pasajero = document.getElementById("btn-pasajero");
const btn_conductor = document.getElementById("btn-conductor");

const notif_btn = document.getElementById("notif-btn");
const notif_panel = document.getElementById("notif-panel");
const notif_badge = document.getElementById("notif-badge");
const notif_list = document.getElementById("notif-list");
const notif_clear = document.getElementById("notif-clear");

const modal_crear = document.getElementById("modal-crear");
const modal_viaje = document.getElementById("modal-viaje");

const btn_logout = document.getElementById("btn-logout");

let MODO = "pasajero"; // 'pasajero' | 'conductor'
let viaje_sel_id = null; // viaje seleccionado en el modal detalle

/* ── 4. Init ───────────────────────────────────────────── */
(async function init() {
  rellenar_usuario();
  mostrar_saludo();
  await Promise.all([cargar_stats(), cargar_viajes()]);
})();

/* ── 5. Usuario ────────────────────────────────────────── */
function rellenar_usuario() {
  user_name_el.textContent = `${USER.nombre} ${USER.apellido}`;
  user_role_el.textContent =
    USER.rol === "administrador" ? "Administrador" : "Estudiante";

  const inicial = USER.nombre?.[0]?.toUpperCase() || "?";
  if (USER.foto) {
    user_avatar_el.innerHTML = `<img src="${USER.foto}" alt="foto"/>`;
  } else {
    user_avatar_el.textContent = inicial;
  }

  // Perfil
  document.getElementById("perfil-avatar").textContent = inicial;
  document.getElementById("pf-nombre").value = USER.nombre || "";
  document.getElementById("pf-apellido").value = USER.apellido || "";
  document.getElementById("pf-correo").value = USER.correo || "";
}

function mostrar_saludo() {
  const h = new Date().getHours();
  const saludo =
    h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  greeting_msg.textContent = `${saludo}, ${USER.nombre} 👋`;
}

/* ── 6. Stats ──────────────────────────────────────────── */
async function cargar_stats() {
  try {
    const r = await api_get("/api/usuarios/stats");
    stat_viajes.textContent = r.total_viajes ?? "0";
    stat_rep.textContent = r.promedio ? `${r.promedio}⭐` : "—";
  } catch {
    /* silencioso */
  }
}

/* ── 7. Viajes disponibles ─────────────────────────────── */
async function cargar_viajes(filtros = {}) {
  viajes_grid.innerHTML = `
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>
    <div class="skeleton-card"></div>`;

  try {
    const params = new URLSearchParams(filtros);
    const viajes = await api_get(`/api/viajes?${params}`);
    render_viajes(viajes_grid, viajes);
  } catch {
    viajes_grid.innerHTML =
      '<p style="color:var(--text-muted);padding:1rem">No se pudieron cargar los viajes.</p>';
  }
}

function render_viajes(container, viajes) {
  if (!viajes?.length) {
    container.innerHTML =
      '<p style="color:var(--text-muted);padding:1rem">No hay viajes disponibles.</p>';
    return;
  }

  container.innerHTML = viajes
    .map((v) => {
      const cupos_cls =
        v.cupos_disponibles === 0
          ? "none"
          : v.cupos_disponibles <= 1
            ? "few"
            : "";
      const inicial = (v.conductor_nombre?.[0] || "?").toUpperCase();

      return `
    <article class="viaje-card" data-id="${v.id}">
      <div class="vc-ruta">
        <span>${v.origen}</span>
        <span class="vc-arrow">→</span>
        <span>${v.destino}</span>
      </div>
      <div class="vc-meta">
        <span class="vc-chip">📅 ${formatear_fecha(v.fecha)}</span>
        <span class="vc-chip">🕐 ${v.hora_salida?.slice(0, 5)}</span>
      </div>
      <div class="vc-footer">
        <div class="vc-conductor">
          <div class="vc-av">${inicial}</div>
          ${v.conductor_nombre || "Conductor"}
        </div>
        <span class="vc-cupos ${cupos_cls}">
          ${v.cupos_disponibles === 0 ? "Sin cupos" : `${v.cupos_disponibles} cupo${v.cupos_disponibles !== 1 ? "s" : ""}`}
        </span>
      </div>
    </article>`;
    })
    .join("");

  container.querySelectorAll(".viaje-card").forEach((card) => {
    card.addEventListener("click", () => abrir_detalle_viaje(card.dataset.id));
  });
}

/* ── 8. Detalle de viaje ───────────────────────────────── */
async function abrir_detalle_viaje(id) {
  viaje_sel_id = id;
  try {
    const v = await api_get(`/api/viajes/${id}`);
    document.getElementById("detail-ruta").textContent =
      `${v.origen} → ${v.destino}`;
    document.getElementById("detail-body").innerHTML = `
      <div style="display:flex;flex-direction:column;gap:.75rem;font-size:.9rem;">
        <div><strong>Conductor:</strong> ${v.conductor?.usuario?.nombre || "—"} ${v.conductor?.usuario?.apellido || ""}</div>
        <div><strong>Fecha:</strong> ${formatear_fecha(v.fecha)}</div>
        <div><strong>Salida:</strong> ${v.hora_salida?.slice(0, 5)} &nbsp;·&nbsp; <strong>Llegada:</strong> ${v.hora_llegada?.slice(0, 5)}</div>
        <div><strong>Cupos disponibles:</strong> ${v.cupos_disponibles}</div>
        ${v.notas ? `<div><strong>Notas:</strong><br/><span style="color:var(--text-secondary)">${v.notas}</span></div>` : ""}
        ${v.reglas ? `<div><strong>Reglas:</strong><br/><span style="color:var(--text-secondary)">${v.reglas.descripcion}</span></div>` : ""}
      </div>`;

    const btn_sol = document.getElementById("btn-solicitar");
    btn_sol.disabled = v.cupos_disponibles === 0;
    btn_sol.textContent =
      v.cupos_disponibles === 0 ? "Sin cupos" : "Solicitar cupo";

    modal_viaje.classList.remove("hidden");
  } catch {
    push_notif("No se pudo cargar el detalle del viaje.", "error");
  }
}

document
  .getElementById("detail-close")
  .addEventListener("click", () => modal_viaje.classList.add("hidden"));
document
  .getElementById("detail-cancel")
  .addEventListener("click", () => modal_viaje.classList.add("hidden"));

document.getElementById("btn-solicitar").addEventListener("click", async () => {
  if (!viaje_sel_id) return;
  try {
    await api_post("/api/solicitudes", { viaje_id: viaje_sel_id });
    push_notif("Solicitud enviada. Espera la respuesta del conductor.", "ok");
    modal_viaje.classList.add("hidden");
    cargar_viajes();
  } catch (err) {
    push_notif(err.message || "No se pudo enviar la solicitud.", "error");
  }
});

/* ── 9. Modo conductor / pasajero ──────────────────────── */
btn_pasajero.addEventListener("click", () => cambiar_modo("pasajero"));
btn_conductor.addEventListener("click", () => cambiar_modo("conductor"));

function cambiar_modo(modo) {
  MODO = modo;
  btn_pasajero.classList.toggle("active", modo === "pasajero");
  btn_conductor.classList.toggle("active", modo === "conductor");

  if (modo === "conductor") {
    section_solicitudes.style.display = "block";
    cargar_solicitudes();
  } else {
    section_solicitudes.style.display = "none";
  }
}

async function cargar_solicitudes() {
  try {
    const data = await api_get("/api/solicitudes/pendientes");
    badge_sol.textContent = data.length;
    render_solicitudes(data);
  } catch {
    /* silencioso */
  }
}

function render_solicitudes(items) {
  if (!items?.length) {
    solicitudes_list.innerHTML =
      '<p style="color:var(--text-muted);font-size:.875rem;padding:.5rem 0">Sin solicitudes pendientes.</p>';
    return;
  }

  solicitudes_list.innerHTML = items
    .map((s) => {
      const inicial = (s.pasajero?.nombre?.[0] || "?").toUpperCase();
      return `
    <div class="sol-card" data-sol-id="${s.id}">
      <div class="sol-av">${inicial}</div>
      <div class="sol-info">
        <div class="sol-nombre">${s.pasajero?.nombre || ""} ${s.pasajero?.apellido || ""}</div>
        <div class="sol-ruta">${s.viaje?.origen} → ${s.viaje?.destino}</div>
      </div>
      <div class="sol-actions">
        <button class="btn-aceptar"  data-id="${s.id}">Aceptar</button>
        <button class="btn-rechazar" data-id="${s.id}">Rechazar</button>
      </div>
    </div>`;
    })
    .join("");

  solicitudes_list.querySelectorAll(".btn-aceptar").forEach((b) => {
    b.addEventListener("click", () =>
      gestionar_solicitud(b.dataset.id, "aceptar"),
    );
  });
  solicitudes_list.querySelectorAll(".btn-rechazar").forEach((b) => {
    b.addEventListener("click", () =>
      gestionar_solicitud(b.dataset.id, "rechazar"),
    );
  });
}

async function gestionar_solicitud(id, accion) {
  try {
    await api_patch(`/api/solicitudes/${id}/${accion}`);
    // Notificar por socket al pasajero
    socket.emit(`solicitud:${accion}`, {
      solicitud_id: id,
      conductor_id: USER.id,
    });
    push_notif(
      `Solicitud ${accion === "aceptar" ? "aceptada" : "rechazada"} correctamente.`,
      "ok",
    );
    cargar_solicitudes();
    cargar_viajes();
  } catch (err) {
    push_notif(err.message || "Error al gestionar la solicitud.", "error");
  }
}

/* ── 10. Crear viaje ───────────────────────────────────── */
function abrir_modal_crear() {
  // Poner fecha mínima = hoy
  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("cv-fecha").min = hoy;
  modal_crear.classList.remove("hidden");
}

document.getElementById("nav-crear")?.addEventListener("click", (e) => {
  e.preventDefault();
  abrir_modal_crear();
});
document
  .getElementById("qa-crear")
  ?.addEventListener("click", abrir_modal_crear);
document
  .getElementById("modal-close")
  ?.addEventListener("click", () => modal_crear.classList.add("hidden"));
document
  .getElementById("modal-cancel")
  ?.addEventListener("click", () => modal_crear.classList.add("hidden"));

document
  .getElementById("form-crear-viaje")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const alert_crear = document.getElementById("alert-crear");
    alert_crear.className = "alert";

    const body = {
      origen: document.getElementById("cv-origen").value.trim(),
      destino: document.getElementById("cv-destino").value.trim(),
      fecha: document.getElementById("cv-fecha").value,
      hora_salida: document.getElementById("cv-hora-salida").value,
      hora_llegada: document.getElementById("cv-hora-llegada").value,
      cupos_total: parseInt(document.getElementById("cv-cupos").value),
      notas: document.getElementById("cv-notas").value.trim(),
    };

    if (body.hora_llegada <= body.hora_salida) {
      alert_crear.className = "alert show-error";
      alert_crear.textContent =
        "La hora de llegada debe ser mayor a la de salida.";
      return;
    }

    try {
      await api_post("/api/viajes", body);
      modal_crear.classList.add("hidden");
      push_notif("¡Viaje publicado correctamente!", "ok");
      cargar_viajes();
      if (MODO === "conductor") cargar_solicitudes();
      document.getElementById("form-crear-viaje").reset();
    } catch (err) {
      alert_crear.className = "alert show-error";
      alert_crear.textContent = err.message || "Error al publicar el viaje.";
    }
  });

/* ── 11. Buscar viajes (vista buscar) ──────────────────── */
document
  .getElementById("btn-buscar-viajes")
  .addEventListener("click", async () => {
    const filtros = {};
    const origen = document.getElementById("filtro-origen").value.trim();
    const destino = document.getElementById("filtro-destino").value.trim();
    const fecha = document.getElementById("filtro-fecha").value;
    if (origen) filtros.origen = origen;
    if (destino) filtros.destino = destino;
    if (fecha) filtros.fecha = fecha;

    const grid = document.getElementById("viajes-grid-buscar");
    grid.innerHTML =
      '<div class="skeleton-card"></div><div class="skeleton-card"></div>';
    try {
      const viajes = await api_get(
        `/api/viajes?${new URLSearchParams(filtros)}`,
      );
      render_viajes(grid, viajes);
    } catch {
      grid.innerHTML =
        '<p style="color:var(--text-muted)">Error al buscar viajes.</p>';
    }
  });

/* ── 12. Perfil ────────────────────────────────────────── */
document.getElementById("form-perfil").addEventListener("submit", async (e) => {
  e.preventDefault();
  const alert_p = document.getElementById("alert-perfil");
  alert_p.className = "alert";

  try {
    const body = {
      nombre: document.getElementById("pf-nombre").value.trim(),
      apellido: document.getElementById("pf-apellido").value.trim(),
      carrera: document.getElementById("pf-carrera").value.trim(),
      zona: document.getElementById("pf-zona").value.trim(),
      telefono: document.getElementById("pf-telefono").value.trim(),
    };

    await api_patch(`/api/usuarios/${USER.id}`, body);
    Object.assign(USER, body);
    sessionStorage.setItem("uride_user", JSON.stringify(USER));
    rellenar_usuario();
    alert_p.className = "alert show-ok";
    alert_p.textContent = "Perfil actualizado correctamente.";
  } catch (err) {
    alert_p.className = "alert show-error";
    alert_p.textContent = err.message || "Error al actualizar el perfil.";
  }
});

/* ── 13. Navegación entre vistas ───────────────────────── */
nav_items.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    cambiar_vista(item.dataset.view);
    // En mobile cerrar sidebar
    sidebar.classList.remove("open");
  });
});

// Acciones rápidas
document.querySelectorAll("[data-view]").forEach((el) => {
  el.addEventListener("click", (e) => {
    const view = el.dataset.view;
    if (view) {
      e.preventDefault();
      cambiar_vista(view);
    }
  });
});

function cambiar_vista(nombre) {
  views.forEach((v) => v.classList.remove("active"));
  nav_items.forEach((n) => n.classList.remove("active"));

  const target_view = document.getElementById(`view-${nombre}`);
  const target_nav = document.querySelector(`.nav-item[data-view="${nombre}"]`);

  target_view?.classList.add("active");
  target_nav?.classList.add("active");

  // Cargar datos de la vista
  if (nombre === "buscar") {
    const g = document.getElementById("viajes-grid-buscar");
    if (!g.children.length) {
      cargar_viajes_en_grid(g);
    }
  }
}

async function cargar_viajes_en_grid(grid) {
  try {
    const v = await api_get("/api/viajes");
    render_viajes(grid, v);
  } catch {
    grid.innerHTML =
      '<p style="color:var(--text-muted)">Error al cargar viajes.</p>';
  }
}

/* ── 14. Sidebar mobile ────────────────────────────────── */
sidebar_toggle.addEventListener("click", () =>
  sidebar.classList.toggle("open"),
);
document.addEventListener("click", (e) => {
  if (!sidebar.contains(e.target) && !sidebar_toggle.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});

/* ── 15. Notificaciones ────────────────────────────────── */
let notif_count = 0;

function push_notif(msg, tipo = "info") {
  notif_count++;
  notif_badge.textContent = notif_count;
  notif_badge.classList.remove("hidden");

  const empty = notif_list.querySelector(".notif-empty");
  if (empty) empty.remove();

  const li = document.createElement("li");
  li.className = `notif-item ${tipo}`;
  li.textContent = msg;
  notif_list.prepend(li);
}

notif_btn.addEventListener("click", (e) => {
  e.stopPropagation();
  notif_panel.classList.toggle("hidden");
});

notif_clear.addEventListener("click", () => {
  notif_list.innerHTML =
    '<li class="notif-empty">Sin notificaciones nuevas</li>';
  notif_badge.classList.add("hidden");
  notif_count = 0;
});

document.addEventListener("click", (e) => {
  if (!notif_panel.contains(e.target) && !notif_btn.contains(e.target)) {
    notif_panel.classList.add("hidden");
  }
});

/* ── 16. Logout ────────────────────────────────────────── */
btn_logout.addEventListener("click", async () => {
  try {
    await api_post("/api/auth/logout", {});
  } catch {
    /* ok */
  }
  sessionStorage.clear();
  window.location.href = "/login.html";
});

/* ── 17. Búsqueda rápida en topbar ─────────────────────── */
let search_timer = null;
document.getElementById("search-input").addEventListener("input", (e) => {
  clearTimeout(search_timer);
  search_timer = setTimeout(() => {
    const q = e.target.value.trim();
    if (q.length > 1) {
      cambiar_vista("buscar");
      document.getElementById("filtro-origen").value = q;
      document.getElementById("btn-buscar-viajes").click();
    }
  }, 400);
});

/* ── 18. Helpers fetch ─────────────────────────────────── */
async function api_get(url) {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) {
    const json = await r.json().catch(() => ({}));
    throw new Error(json.error || `Error ${r.status}`);
  }
  return r.json();
}

async function api_post(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const json = await r.json().catch(() => ({}));
    throw new Error(json.error || `Error ${r.status}`);
  }
  return r.json();
}

async function api_patch(url, body) {
  const r = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const json = await r.json().catch(() => ({}));
    throw new Error(json.error || `Error ${r.status}`);
  }
  return r.json();
}

/* ── 19. Helpers fecha ─────────────────────────────────── */
function formatear_fecha(iso) {
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
