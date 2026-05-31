/* ============================================================
   U-Ride — admin.js   (RF11 — Panel Administrador)
   ============================================================ */

const userRaw = sessionStorage.getItem("uride_user");
if (!userRaw) { window.location.href = "/login.html"; }
const USER = JSON.parse(userRaw);
if (USER.rol !== "administrador") { window.location.href = "/home.html"; }

let accionPendiente = null; // { tipo, reporteId, estudianteId }

/* ── Init ── */
(async function init() {
  await Promise.all([cargarStats(), cargarReportes()]);
})();

/* ── Tabs ── */
document.querySelectorAll(".adminTab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".adminTab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".adminPanel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`panel${capitalize(btn.dataset.tab)}`).classList.add("active");
    if (btn.dataset.tab === "usuarios") cargarUsuarios();
  });
});

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

/* ── Stats ── */
async function cargarStats() {
  try {
    const reportes = await apiGet("/api/admin/reportes?limite=1000");
    const pendientes = Array.isArray(reportes) ? reportes.filter(r => r.estado === "pendiente") : [];
    document.getElementById("totalReportes").textContent = Array.isArray(reportes) ? reportes.length : "—";
    document.getElementById("reportesPendientes").textContent = pendientes.length;
  } catch { /* silencioso */ }
}

/* ── Reportes ── */
async function cargarReportes() {
  const el = document.getElementById("listaReportes");
  const estado = document.getElementById("filtroEstadoReporte").value;
  el.innerHTML = '<div class="loadingPill">Cargando reportes…</div>';
  try {
    const params = new URLSearchParams();
    if (estado) params.set("estado", estado);
    const data = await apiGet(`/api/admin/reportes?${params}`);
    renderReportes(Array.isArray(data) ? data : data.reportes || []);
  } catch (err) {
    el.innerHTML = `<div class="loadingPill" style="color:var(--error)">Error: ${err.message}</div>`;
  }
}

function renderReportes(reportes) {
  const el = document.getElementById("listaReportes");
  if (!reportes.length) {
    el.innerHTML = '<div class="loadingPill">No hay reportes que mostrar.</div>';
    return;
  }
  el.innerHTML = reportes.map(r => {
    const reportante = r.reportante ? `${r.reportante.nombre} ${r.reportante.apellido}` : "—";
    const reportado  = r.reportado  ? `${r.reportado.nombre}  ${r.reportado.apellido}`  : "—";
    const fecha = r.createdAt ? new Date(r.createdAt).toLocaleDateString("es-EC") : "—";
    const suspendido = r.reportado?.suspendido;
    return `
    <div class="reporteCard">
      <div class="reporteHeader">
        <div class="reporteInfo">
          <div class="reporteTitle">
            <strong>${reportante}</strong> reportó a <strong>${reportado}</strong>
            ${suspendido ? '<span class="suspendidoBadge">Suspendido</span>' : ""}
          </div>
          <div class="reporteMeta">📅 ${fecha} · Viaje: ${r.viajeId ? r.viajeId.slice(0,8)+"…" : "—"}</div>
        </div>
        <span class="badgeReporte ${r.estado || 'pendiente'}">${(r.estado || "pendiente").charAt(0).toUpperCase() + (r.estado || "pendiente").slice(1)}</span>
      </div>
      <div class="reporteMotivo">${r.motivo || "Sin motivo especificado."}</div>
      <div class="reporteActions">
        <button class="btnSmall btnAdvertir"  data-id="${r.id}" data-reportado="${r.reportadoId}">⚠️ Advertir</button>
        <button class="btnSmall btnSuspender" data-id="${r.id}" data-reportado="${r.reportadoId}">🚫 Suspender</button>
        <button class="btnSmall btnResolver"  data-id="${r.id}" data-reportado="${r.reportadoId}">✅ Resolver</button>
      </div>
    </div>`;
  }).join("");

  el.querySelectorAll(".btnAdvertir").forEach(b =>
    b.addEventListener("click", () => abrirModalAccion("advertir", b.dataset.id, b.dataset.reportado)));
  el.querySelectorAll(".btnSuspender").forEach(b =>
    b.addEventListener("click", () => abrirModalAccion("suspender", b.dataset.id, b.dataset.reportado)));
  el.querySelectorAll(".btnResolver").forEach(b =>
    b.addEventListener("click", () => ejecutarAccion("resolver", b.dataset.id, b.dataset.reportado, "")));
}

/* ── Usuarios ── */
let todosLosUsuarios = [];

async function cargarUsuarios() {
  const el = document.getElementById("listaUsuarios");
  el.innerHTML = '<div class="loadingPill">Cargando usuarios…</div>';
  try {
    const data = await apiGet("/api/admin/usuarios");
    todosLosUsuarios = Array.isArray(data) ? data : [];
    renderUsuarios(todosLosUsuarios);
  } catch (err) {
    el.innerHTML = `<div class="loadingPill" style="color:var(--error)">Error: ${err.message}</div>`;
  }
}

function renderUsuarios(usuarios) {
  const el = document.getElementById("listaUsuarios");
  if (!usuarios.length) { el.innerHTML = '<div class="loadingPill">No hay usuarios.</div>'; return; }
  el.innerHTML = usuarios.map(u => {
    const inicial = (u.nombre?.[0] || "?").toUpperCase();
    return `
    <div class="usuarioCard">
      <div class="usuarioAv">${inicial}</div>
      <div class="usuarioInfo">
        <div class="usuarioNombre">${u.nombre} ${u.apellido} ${u.suspendido ? '<span class="suspendidoBadge">Suspendido</span>' : ""}</div>
        <div class="usuarioMeta">${u.correo} · ${u.carrera || "Sin carrera"} · ${u.zona || "Sin zona"}</div>
      </div>
      <div class="usuarioActions">
        ${u.suspendido
          ? `<button class="btnSmall btnResolver" data-uid="${u.id}">Levantar suspensión</button>`
          : `<button class="btnSmall btnSuspender" data-uid="${u.id}">Suspender</button>`}
      </div>
    </div>`;
  }).join("");

  el.querySelectorAll(".btnSuspender").forEach(b =>
    b.addEventListener("click", () => abrirModalAccion("suspender", null, b.dataset.uid)));
  el.querySelectorAll(".btnResolver").forEach(b =>
    b.addEventListener("click", () => ejecutarLevantarSuspension(b.dataset.uid)));
}

// Búsqueda usuarios
document.getElementById("buscarUsuario").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  const filtrados = todosLosUsuarios.filter(u =>
    `${u.nombre} ${u.apellido} ${u.correo}`.toLowerCase().includes(q));
  renderUsuarios(filtrados);
});

/* ── Modal acción ── */
function abrirModalAccion(tipo, reporteId, estudianteId) {
  accionPendiente = { tipo, reporteId, estudianteId };
  const titulos = { advertir: "Advertir usuario", suspender: "Suspender usuario" };
  const descs   = {
    advertir:  "Se enviará una advertencia formal a este usuario.",
    suspender: "El usuario no podrá acceder al sistema durante el período de suspensión.",
  };
  document.getElementById("modalAccionTitle").textContent = titulos[tipo] || "Acción";
  document.getElementById("modalAccionDesc").textContent  = descs[tipo]  || "";
  document.getElementById("accionMensaje").value = "";
  document.getElementById("alertAccion").className = "alert";
  document.getElementById("btnConfirmarAccion").className = tipo === "suspender"
    ? "btnDanger" : "btnPrimarySm";
  document.getElementById("btnConfirmarAccion").textContent = tipo === "suspender" ? "Suspender" : "Advertir";
  document.getElementById("modalAccion").classList.remove("hidden");
}

document.getElementById("btnConfirmarAccion").addEventListener("click", async () => {
  if (!accionPendiente) return;
  const { tipo, reporteId, estudianteId } = accionPendiente;
  const mensaje = document.getElementById("accionMensaje").value.trim();
  await ejecutarAccion(tipo, reporteId, estudianteId, mensaje);
});

document.getElementById("closeAccion").addEventListener("click", () =>
  document.getElementById("modalAccion").classList.add("hidden"));

async function ejecutarAccion(tipo, reporteId, estudianteId, mensaje) {
  const alertA = document.getElementById("alertAccion");
  try {
    if (tipo === "advertir") {
      await apiPost("/api/admin/advertir", { estudianteId, reporteId, mensaje });
      pushNotif("Advertencia enviada.", "ok");
    } else if (tipo === "suspender") {
      await apiPost("/api/admin/suspender", { estudianteId, reporteId, mensaje });
      pushNotif("Usuario suspendido.", "ok");
    } else if (tipo === "resolver") {
      await apiPatch(`/api/admin/reportes/${reporteId}/resolver`);
      pushNotif("Reporte marcado como resuelto.", "ok");
    }
    document.getElementById("modalAccion").classList.add("hidden");
    accionPendiente = null;
    cargarReportes();
    cargarStats();
  } catch (err) {
    if (alertA) {
      alertA.className = "alert show-error";
      alertA.textContent = err.message || "Error al realizar la acción.";
    } else {
      pushNotif(err.message || "Error.", "error");
    }
  }
}

async function ejecutarLevantarSuspension(estudianteId) {
  if (!confirm("¿Levantar la suspensión de este usuario?")) return;
  try {
    await apiPost(`/api/admin/levantar-suspension/${estudianteId}`, {});
    pushNotif("Suspensión levantada.", "ok");
    cargarUsuarios();
    cargarStats();
  } catch (err) {
    pushNotif(err.message || "Error.", "error");
  }
}

/* ── Toolbar events ── */
document.getElementById("filtroEstadoReporte").addEventListener("change", cargarReportes);
document.getElementById("btnRecargarReportes").addEventListener("click", cargarReportes);

/* ── Logout ── */
document.getElementById("btnLogout").addEventListener("click", async () => {
  try { await apiPost("/api/auth/logout", {}); } catch { }
  sessionStorage.clear();
  window.location.href = "/login.html";
});

/* ── Toast ── */
function pushNotif(msg, tipo = "info") { mostrarToast(msg, tipo); }
function mostrarToast(msg, tipo) {
  const c = document.getElementById("toastContainer");
  const t = document.createElement("div");
  t.className = `toast toast-${tipo}`;
  t.textContent = msg;
  c.appendChild(t);
  requestAnimationFrame(() => t.classList.add("toastVisible"));
  setTimeout(() => { t.classList.remove("toastVisible"); t.addEventListener("transitionend", () => t.remove(), { once: true }); }, 3500);
}

/* ── Fetch helpers ── */
async function apiGet(url) {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || `Error ${r.status}`); }
  return r.json();
}
async function apiPost(url, body) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || `Error ${r.status}`); }
  return r.json();
}
async function apiPatch(url, body = {}) {
  const r = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || `Error ${r.status}`); }
  return r.json();
}
