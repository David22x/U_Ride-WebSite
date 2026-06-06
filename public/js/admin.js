/* ============================================================
   U-Ride — admin.js  (RF11 — Panel Administrador · nuevo diseño)
   ============================================================ */

const userRaw = sessionStorage.getItem("uride_user");
if (!userRaw) { window.location.href = "/login.html"; }
const USER = JSON.parse(userRaw);
if (USER.rol !== "administrador") { window.location.href = "/home.html"; }

let accionPendiente = null; // { tipo, reporteId, estudianteId }

/* ── Init ─────────────────────────────────────────────── */
(async function init() {
  rellenarAdmin();
  await Promise.all([cargarStats(), cargarReportes()]);
})();

function rellenarAdmin() {
  const nombre = `${USER.nombre || ""} ${USER.apellido || ""}`.trim();
  const el = document.getElementById("adminName");
  const av = document.getElementById("adminAvatar");
  if (el) el.textContent = nombre || "Admin";
  if (av) av.textContent = (USER.nombre?.[0] || "A").toUpperCase();
}

/* ── Tabs sidebar ─────────────────────────────────────── */
document.querySelectorAll(".nav-item[data-tab]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item[data-tab]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activarTab(btn.dataset.tab);
  });
});

/* ── Tabs content ─────────────────────────────────────── */
document.querySelectorAll(".tab[data-tab]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab[data-tab]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activarTab(btn.dataset.tab);
  });
});

function activarTab(tab) {
  document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
  document.getElementById(`panel${capitalize(tab)}`)?.classList.add("active");
  if (tab === "usuarios") cargarUsuarios();
  if (tab === "reportes") cargarReportes();
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

/* ── Stats ────────────────────────────────────────────── */
async function cargarStats() {
  try {
    const [reportesData, usuariosData] = await Promise.all([
      apiGet("/api/admin/reportes?limite=1000").catch(() => []),
      apiGet("/api/admin/usuarios").catch(() => []),
    ]);
    const reportes = Array.isArray(reportesData) ? reportesData : (reportesData.reportes || []);
    const usuarios = Array.isArray(usuariosData) ? usuariosData : [];

    const pendientes  = reportes.filter(r => r.estado === "pendiente");
    const suspendidos = usuarios.filter(u => u.estado === "suspendido" || u.suspendido);

    document.getElementById("totalReportes").textContent      = reportes.length;
    document.getElementById("reportesPendientes").textContent = pendientes.length;
    document.getElementById("usuariosSuspendidos").textContent = suspendidos.length;
    document.getElementById("totalUsuarios").textContent      = usuarios.length;

    const navBadge = document.getElementById("navBadgeReportes");
    if (navBadge) {
      navBadge.textContent = pendientes.length;
      navBadge.classList.toggle("hidden", pendientes.length === 0);
    }
  } catch { /* silencioso */ }
}

/* ── Reportes ─────────────────────────────────────────── */
async function cargarReportes() {
  const el = document.getElementById("listaReportes");
  const estado = document.getElementById("filtroEstadoReporte").value;
  el.innerHTML = '<div class="loading-pill">Cargando reportes…</div>';
  try {
    const params = new URLSearchParams();
    if (estado) params.set("estado", estado);
    const data = await apiGet(`/api/admin/reportes?${params}`);
    renderReportes(Array.isArray(data) ? data : data.reportes || []);
  } catch (err) {
    el.innerHTML = `<div class="loading-pill" style="color:var(--red)">Error: ${err.message}</div>`;
  }
}

function renderReportes(reportes) {
  const el = document.getElementById("listaReportes");
  if (!reportes.length) {
    el.innerHTML = '<div class="loading-pill">No hay reportes que mostrar.</div>';
    return;
  }
  el.innerHTML = reportes.map(r => {
    const reportante = r.reportante ? `${r.reportante.nombre} ${r.reportante.apellido}` : "—";
    const reportado  = r.reportado  ? `${r.reportado.nombre} ${r.reportado.apellido}`   : "—";
    const fecha = r.created_at ? new Date(r.created_at).toLocaleDateString("es-EC") : "—";
    const estadoColors = {
      pendiente: 'style="background:var(--amber-dim);color:var(--amber);border:1px solid rgba(245,158,11,.25)"',
      revisado:  'style="background:var(--blue-dim);color:var(--blue);border:1px solid rgba(59,130,246,.25)"',
      cerrado:   'style="background:var(--surface3);color:var(--text-muted)"',
    };
    return `
    <div class="reporte-card">
      <div class="reporte-header">
        <div>
          <div class="reporte-partes"><strong>${reportante}</strong> reportó a <strong>${reportado}</strong></div>
          <div style="font-size:.76rem;color:var(--text-muted);margin-top:2px">📅 ${fecha} · ID viaje: ${r.viajeId?.slice(0,8) || "—"}…</div>
        </div>
        <span class="badge-estado" ${estadoColors[r.estado] || ''}>${capitalize(r.estado || "pendiente")}</span>
      </div>
      <div class="reporte-motivo">${r.motivo || "Sin motivo especificado."}</div>
      <div class="reporte-actions">
        <button class="btn-sm btn-ghost-sm btn-advertir" data-id="${r.id}" data-reportado="${r.reportadoId}">⚠ Advertir</button>
        <button class="btn-sm btn-danger-sm btn-suspender" data-id="${r.id}" data-reportado="${r.reportadoId}">🚫 Suspender</button>
        ${r.estado === "pendiente" ? `<button class="btn-sm btn-accent btn-resolver" data-id="${r.id}">✓ Resolver</button>` : ""}
      </div>
    </div>`;
  }).join("");

  el.querySelectorAll(".btn-advertir").forEach(b =>
    b.addEventListener("click", () => abrirModalAccion("advertir", b.dataset.id, b.dataset.reportado)));
  el.querySelectorAll(".btn-suspender").forEach(b =>
    b.addEventListener("click", () => abrirModalAccion("suspender", b.dataset.id, b.dataset.reportado)));
  el.querySelectorAll(".btn-resolver").forEach(b =>
    b.addEventListener("click", () => ejecutarAccion("resolver", b.dataset.id, null, "")));
}

/* ── Usuarios ─────────────────────────────────────────── */
let todosLosUsuarios = [];

async function cargarUsuarios() {
  const el = document.getElementById("listaUsuarios");
  el.innerHTML = '<div class="loading-pill">Cargando usuarios…</div>';
  try {
    const data = await apiGet("/api/admin/usuarios");
    todosLosUsuarios = Array.isArray(data) ? data : [];
    renderUsuarios(todosLosUsuarios);
  } catch (err) {
    el.innerHTML = `<div class="loading-pill" style="color:var(--red)">Error: ${err.message}</div>`;
  }
}

function renderUsuarios(usuarios) {
  const el = document.getElementById("listaUsuarios");
  if (!usuarios.length) {
    el.innerHTML = '<div class="loading-pill">No hay usuarios.</div>';
    return;
  }
  el.innerHTML = usuarios.map(u => {
    const inicial = (u.nombre?.[0] || "?").toUpperCase();
    const suspendido = u.estado === "suspendido" || u.suspendido;
    return `
    <div class="usuario-card">
      <div class="usuario-av">${inicial}</div>
      <div class="usuario-info">
        <div class="usuario-nombre">
          ${u.nombre} ${u.apellido}
          ${suspendido ? '<span class="badge-estado cancelado" style="font-size:.7rem;padding:.2rem .5rem;margin-left:.4rem">Suspendido</span>' : ""}
          ${u.advertencias > 0 ? `<span style="font-size:.73rem;color:var(--amber);margin-left:.3rem">⚠ ${u.advertencias} advertencia${u.advertencias !== 1 ? "s" : ""}</span>` : ""}
        </div>
        <div class="usuario-meta">${u.correo} · ${u.carrera || "Sin carrera"} · ${u.zona || "Sin zona"}</div>
      </div>
      <div class="usuario-actions">
        ${suspendido
          ? `<button class="btn-sm btn-accent btn-levantar" data-uid="${u.id}">Levantar</button>`
          : `<button class="btn-sm btn-ghost-sm btn-adv-usuario" data-uid="${u.id}">Advertir</button>
             <button class="btn-sm btn-danger-sm btn-susp-usuario" data-uid="${u.id}">Suspender</button>`}
      </div>
    </div>`;
  }).join("");

  el.querySelectorAll(".btn-levantar").forEach(b =>
    b.addEventListener("click", () => ejecutarLevantarSuspension(b.dataset.uid)));
  el.querySelectorAll(".btn-adv-usuario").forEach(b =>
    b.addEventListener("click", () => abrirModalAccion("advertir", null, b.dataset.uid)));
  el.querySelectorAll(".btn-susp-usuario").forEach(b =>
    b.addEventListener("click", () => abrirModalAccion("suspender", null, b.dataset.uid)));
}

document.getElementById("buscarUsuario").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  renderUsuarios(todosLosUsuarios.filter(u =>
    `${u.nombre} ${u.apellido} ${u.correo}`.toLowerCase().includes(q)));
});

/* ── Modal acción ─────────────────────────────────────── */
function abrirModalAccion(tipo, reporteId, estudianteId) {
  accionPendiente = { tipo, reporteId, estudianteId };
  const titulos = { advertir: "Advertir usuario", suspender: "Suspender usuario" };
  const descs   = {
    advertir:  "Se registrará una advertencia formal. Con 3 advertencias el usuario es suspendido automáticamente.",
    suspender: "El usuario no podrá acceder al sistema durante el período indicado.",
  };
  document.getElementById("modalAccionTitle").textContent = titulos[tipo] || "Acción";
  document.getElementById("modalAccionDesc").textContent  = descs[tipo]  || "";
  document.getElementById("accionMensaje").value = "";
  document.getElementById("alertAccion").className = "alert";

  const diasEl = document.getElementById("suspensionDias");
  if (diasEl) diasEl.classList.toggle("hidden", tipo !== "suspender");

  const btnConf = document.getElementById("btnConfirmarAccion");
  btnConf.className = tipo === "suspender" ? "btn-modal-danger" : "btn-modal-primary";
  btnConf.textContent = tipo === "suspender" ? "Suspender" : "Advertir";

  document.getElementById("modalAccion").classList.remove("hidden");
}

document.getElementById("btnConfirmarAccion").addEventListener("click", async () => {
  if (!accionPendiente) return;
  const { tipo, reporteId, estudianteId } = accionPendiente;
  const descripcion = document.getElementById("accionMensaje").value.trim();
  const duracionDias = tipo === "suspender"
    ? parseInt(document.getElementById("accionDias")?.value || "7")
    : undefined;
  await ejecutarAccion(tipo, reporteId, estudianteId, descripcion, duracionDias);
});

document.getElementById("closeAccion").addEventListener("click", () =>
  document.getElementById("modalAccion").classList.add("hidden"));

async function ejecutarAccion(tipo, reporteId, estudianteId, descripcion, duracionDias) {
  const alertEl = document.getElementById("alertAccion");
  try {
    if (tipo === "advertir") {
      await apiPost("/api/admin/advertir", { estudianteId, reporteId, descripcion });
      toast("Advertencia registrada.", "ok");
    } else if (tipo === "suspender") {
      await apiPost("/api/admin/suspender", { estudianteId, reporteId, descripcion, duracionDias });
      toast("Usuario suspendido.", "ok");
    } else if (tipo === "resolver") {
      await apiPatch(`/api/admin/reportes/${reporteId}/resolver`);
      toast("Reporte marcado como resuelto.", "ok");
    }
    document.getElementById("modalAccion").classList.add("hidden");
    accionPendiente = null;
    cargarReportes();
    cargarStats();
  } catch (err) {
    if (alertEl) {
      alertEl.className = "alert show-error";
      alertEl.textContent = err.message || "Error al realizar la acción.";
    } else {
      toast(err.message || "Error.", "error");
    }
  }
}

async function ejecutarLevantarSuspension(estudianteId) {
  if (!confirm("¿Levantar la suspensión de este usuario?")) return;
  try {
    await apiPost(`/api/admin/levantar-suspension/${estudianteId}`, {});
    toast("Suspensión levantada.", "ok");
    cargarUsuarios();
    cargarStats();
  } catch (err) { toast(err.message || "Error.", "error"); }
}

/* ── Toolbar ──────────────────────────────────────────── */
document.getElementById("filtroEstadoReporte").addEventListener("change", cargarReportes);
document.getElementById("btnRecargarReportes").addEventListener("click", cargarReportes);

/* ── Logout ───────────────────────────────────────────── */
document.getElementById("btnLogout").addEventListener("click", async () => {
  try { await apiPost("/api/auth/logout", {}); } catch { }
  sessionStorage.clear();
  window.location.href = "/login.html";
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

/* ── Fetch helpers ────────────────────────────────────── */
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
