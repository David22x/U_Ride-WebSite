/* ============================================================
    U-Ride — home.js   (versión completa — RF1–RF11)
   ============================================================ */

  const userRaw = sessionStorage.getItem("uride_user");
  if (!userRaw) { window.location.href = "/login.html"; }
  const USER = JSON.parse(userRaw);

  // Redirigir admin a su panel
  if (USER.rol === "administrador") { window.location.href = "/admin.html"; }

  const socket = io({ withCredentials: true });
  socket.on("connect", () => socket.emit("unirse", USER.id));
  socket.on("solicitud:aceptada", (data) => { pushNotif(data.mensaje || "¡Tu solicitud fue aceptada!", "ok"); cargarViajes(); });
  socket.on("solicitud:rechazada", (data) => pushNotif(data.mensaje || "Tu solicitud fue rechazada.", "error"));
  socket.on("error:socket", (data) => pushNotif(data.mensaje, "error"));

  /* DOM */
  const views          = document.querySelectorAll(".view");
  const navItems       = document.querySelectorAll(".navItem[data-view]");
  const greetingMsg    = document.getElementById("greetingMsg");
  const userNameEl     = document.getElementById("userName");
  const userRoleEl     = document.getElementById("userRole");
  const userAvatarEl   = document.getElementById("userAvatar");
  const statViajes     = document.getElementById("statViajes");
  const statRep        = document.getElementById("statRep");
  const viajesGrid     = document.getElementById("viajesGrid");
  const sectionSolicitudes = document.getElementById("sectionSolicitudes");
  const solicitudesList    = document.getElementById("solicitudesList");
  const badgeSol           = document.getElementById("badgeSol");
  const rolSwitchBtn   = document.getElementById("rolSwitchBtn");
  const rolSwitchLabel = document.getElementById("rolSwitchLabel");
  const rolDropdown    = document.getElementById("rolDropdown");
  const optPasajero    = document.getElementById("optPasajero");
  const optConductor   = document.getElementById("optConductor");
  const notifBtn       = document.getElementById("notifBtn");
  const notifPanel     = document.getElementById("notifPanel");
  const notifBadge     = document.getElementById("notifBadge");
  const notifList      = document.getElementById("notifList");
  const notifClear     = document.getElementById("notifClear");
  const modalCrear     = document.getElementById("modalCrear");
  const modalViaje     = document.getElementById("modalViaje");
  const btnLogout      = document.getElementById("btnLogout");
  const modeBanner     = document.getElementById("modeBanner");
  const modeBannerTitle= document.getElementById("modeBannerTitle");
  const modeBannerSub  = document.getElementById("modeBannerSub");
  const modeBannerIcon = document.getElementById("modeBannerIcon");
  const perfilAvatar   = document.getElementById("perfilAvatar");
  const inputFoto      = document.getElementById("inputFoto");
  const cardConductor  = document.getElementById("cardConductor");

  let MODO = sessionStorage.getItem("uride_modo") || "pasajero";
  let viajeSelId = null;

  /* ── INIT ── */
  (async function init() {
    rellenarUsuario();
    mostrarSaludo();
    aplicarModo(MODO, false);
    await Promise.all([cargarStats(), cargarViajes()]);
    cargarPerfilConductor();
    cargarMisViajes();
  })();

  function rellenarUsuario() {
    userNameEl.textContent = `${USER.nombre} ${USER.apellido}`;
    userRoleEl.textContent = USER.rol === "administrador" ? "Administrador" : "Estudiante";
    const inicial = USER.nombre?.[0]?.toUpperCase() || "?";
    if (USER.foto) {
      userAvatarEl.innerHTML = `<img src="${USER.foto}" alt="foto" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`;
      if(perfilAvatar) perfilAvatar.innerHTML = `<img src="${USER.foto}" alt="foto" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`;
    } else {
      userAvatarEl.textContent = inicial;
      if(perfilAvatar) perfilAvatar.textContent = inicial;
    }
    const pfNombre = document.getElementById("pfNombre");
    if (pfNombre) {
      pfNombre.value   = USER.nombre   || "";
      document.getElementById("pfApellido").value = USER.apellido || "";
      document.getElementById("pfCorreo").value   = USER.correo   || "";
      document.getElementById("pfCarrera").value  = USER.carrera  || "";
      document.getElementById("pfZona").value     = USER.zona     || "";
      document.getElementById("pfTelefono").value = USER.telefono || "";
    }
  }

  function mostrarSaludo() {
    const h = new Date().getHours();
    const saludo = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
    greetingMsg.textContent = `${saludo}, ${USER.nombre} 👋`;
  }

  async function cargarStats() {
    try {
      const r = await apiGet("/api/usuarios/stats");
      statViajes.textContent = r.totalViajes ?? "0";
      statRep.textContent    = r.promedio ? `${r.promedio}⭐` : "—";
    } catch { /* silencioso */ }
  }

  /* ── Toggle de rol ── */
  rolSwitchBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    rolDropdown.classList.toggle("hidden");
  });
  optPasajero.addEventListener("click",  () => { aplicarModo("pasajero");  rolDropdown.classList.add("hidden"); });
  optConductor.addEventListener("click", () => { aplicarModo("conductor"); rolDropdown.classList.add("hidden"); });
  document.addEventListener("click", (e) => {
    if (!rolSwitchBtn.contains(e.target)) rolDropdown.classList.add("hidden");
  });

  function aplicarModo(modo, animar = true) {
    MODO = modo;
    sessionStorage.setItem("uride_modo", modo);
    const esConductor = modo === "conductor";

    rolSwitchLabel.textContent = esConductor ? "Conductor" : "Pasajero";
    rolSwitchBtn.classList.toggle("modoConductor", esConductor);
    rolSwitchBtn.classList.toggle("modoPasajero",  !esConductor);

    const iconP = rolSwitchBtn.querySelector(".iconPasajero");
    const iconC = rolSwitchBtn.querySelector(".iconConductor");
    if (iconP) iconP.style.display = esConductor ? "none" : "inline";
    if (iconC) iconC.style.display = esConductor ? "inline" : "none";

    optPasajero.classList.toggle("active",  !esConductor);
    optConductor.classList.toggle("active",  esConductor);

    if (esConductor) {
      modeBannerIcon.textContent  = "🚗";
      modeBannerTitle.textContent = "Modo Conductor activo";
      modeBannerSub.textContent   = "Puedes publicar viajes y gestionar solicitudes.";
      modeBanner.classList.add("modoConductorBanner");
      modeBanner.classList.remove("modePaseroBanner");
    } else {
      modeBannerIcon.textContent  = "🧍";
      modeBannerTitle.textContent = "Modo Pasajero activo";
      modeBannerSub.textContent   = "Puedes buscar y solicitar viajes disponibles.";
      modeBanner.classList.add("modePaseroBanner");
      modeBanner.classList.remove("modoConductorBanner");
    }

    sectionSolicitudes.style.display = esConductor ? "block" : "none";
    if (cardConductor) cardConductor.style.display = esConductor ? "block" : "none";
    if (esConductor) cargarSolicitudes();
    if (animar) pushNotif(`Modo ${esConductor ? "conductor" : "pasajero"} activado.`, "info");
  }

  /* ── Viajes home ── */
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
      viajesGrid.innerHTML = '<p style="color:rgba(10,14,26,.5);padding:1rem">No se pudieron cargar los viajes.</p>';
    }
  }

  function renderViajes(container, viajes) {
    if (!viajes?.length) {
      container.innerHTML = '<p style="color:rgba(10,14,26,.5);padding:1rem">No hay viajes disponibles.</p>';
      return;
    }
    container.innerHTML = viajes.map((v) => {
      const cuposCls = v.cuposDisponibles === 0 ? "none" : v.cuposDisponibles <= 1 ? "few" : "";
      const nombre = v.conductor?.usuario
        ? `${v.conductor.usuario.nombre} ${v.conductor.usuario.apellido}`
        : (v.conductorNombre || "Conductor");
      const inicial  = (nombre[0] || "?").toUpperCase();
      const hora = `${v.horaSalida?.slice(0,5) || "--:--"} → ${v.horaLlegada?.slice(0,5) || "--:--"}`;
      const rep = v.conductorReputacion ? `<span class="vcChip">⭐ ${v.conductorReputacion.promedio}</span>` : "";
      return `
      <article class="viajeCard" data-id="${v.id}">
        <div class="vcHeader">
          <div class="vcAv">${inicial}</div>
          <div class="vcHeaderInfo">
            <div class="vcRuta">${v.origen} → ${v.destino}</div>
            <div class="vcConductorName">${nombre}</div>
          </div>
        </div>
        <div class="vcMeta">
          <span class="vcChip">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${hora}
          </span>
          ${v.fecha ? `<span class="vcChip">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${formatearFecha(v.fecha)}
          </span>` : ""}
          ${rep}
        </div>
        <div class="vcFooter">
          <span class="vcCupos ${cuposCls}">
            ${v.cuposDisponibles === 0 ? "Sin cupos" : `${v.cuposDisponibles} asiento${v.cuposDisponibles !== 1 ? "s" : ""}`}
          </span>
        </div>
      </article>`;
    }).join("");

    container.querySelectorAll(".viajeCard").forEach((card) => {
      card.addEventListener("click", () => abrirDetalleViaje(card.dataset.id));
    });
  }

  /* ── Detalle viaje ── */
  async function abrirDetalleViaje(id) {
    viajeSelId = id;
    try {
      const v = await apiGet(`/api/viajes/${id}`);
      document.getElementById("detailRuta").textContent = `${v.origen} → ${v.destino}`;
      const conductorNombre = v.conductor?.usuario
        ? `${v.conductor.usuario.nombre} ${v.conductor.usuario.apellido}`
        : "—";
      const reglasHtml = v.reglas?.descripcion
        ? `<div class="detailRules"><strong>📋 Reglas del viaje:</strong><p>${v.reglas.descripcion}</p></div>`
        : "";
      const participantesHtml = v.participantes?.length
        ? `<div><strong>Pasajeros confirmados (${v.participantes.length}):</strong><div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.4rem">${v.participantes.map(p => `<span class="participantePill">${p.pasajero?.usuario?.nombre || "?"}</span>`).join("")}</div></div>`
        : "";

      document.getElementById("detailBody").innerHTML = `
        <div style="display:flex;flex-direction:column;gap:.85rem;font-size:.9rem;">
          <div><strong>Conductor:</strong> ${conductorNombre}</div>
          <div><strong>Vehículo:</strong> ${v.conductor?.vehiculo || "—"} · ${v.conductor?.color || ""}</div>
          <div><strong>Placa:</strong> ${v.conductor?.placa || "—"}</div>
          <div><strong>Fecha:</strong> ${formatearFecha(v.fecha)}</div>
          <div><strong>Salida:</strong> ${v.horaSalida?.slice(0,5)} &nbsp;·&nbsp; <strong>Llegada:</strong> ${v.horaLlegada?.slice(0,5)}</div>
          <div><strong>Cupos disponibles:</strong> ${v.cuposDisponibles}</div>
          ${v.notas ? `<div><strong>Notas:</strong><br/><span style="color:var(--textSecondary)">${v.notas}</span></div>` : ""}
          ${reglasHtml}
          ${participantesHtml}
        </div>`;

      const esMiViaje = v.conductor?.usuario?.id === USER.id;
      const btnSol = document.getElementById("btnSolicitar");
      const btnReportar = document.getElementById("btnReportarViaje");

      if (esMiViaje) {
        btnSol.style.display = "none";
        if (btnReportar) btnReportar.style.display = "none";
      } else {
        btnSol.style.display = "";
        btnSol.disabled = v.cuposDisponibles === 0;
        btnSol.textContent = v.cuposDisponibles === 0 ? "Sin cupos" : "Solicitar cupo";
        if (btnReportar) {
          btnReportar.style.display = "";
          btnReportar.dataset.conductorId = v.conductor?.usuario?.id || "";
        }
      }

      modalViaje.classList.remove("hidden");
    } catch {
      pushNotif("No se pudo cargar el detalle del viaje.", "error");
    }
  }

  document.getElementById("detailClose").addEventListener("click",  () => modalViaje.classList.add("hidden"));
  document.getElementById("detailCancel").addEventListener("click", () => modalViaje.classList.add("hidden"));

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

  // Botón reportar desde detalle viaje
  const btnReportarViaje = document.getElementById("btnReportarViaje");
  if (btnReportarViaje) {
    btnReportarViaje.addEventListener("click", () => {
      const conductorId = btnReportarViaje.dataset.conductorId;
      if (conductorId) abrirModalReporte(conductorId, viajeSelId);
    });
  }

  /* ── Solicitudes (conductor) ── */
  async function cargarSolicitudes() {
    try {
      const data = await apiGet("/api/solicitudes/pendientes");
      badgeSol.textContent = data.length;
      renderSolicitudes(data);
    } catch { /* silencioso */ }
  }

  function renderSolicitudes(items) {
    if (!items?.length) {
      solicitudesList.innerHTML = '<p style="color:rgba(10,14,26,.45);font-size:.875rem;padding:.5rem 0">Sin solicitudes pendientes.</p>';
      return;
    }
    solicitudesList.innerHTML = items.map((s) => {
      const u = s.pasajero?.usuario;
      const nombre = u ? `${u.nombre} ${u.apellido}` : "Pasajero";
      const inicial = (nombre[0] || "?").toUpperCase();
      const zona = u?.zona ? ` · ${u.zona}` : "";
      return `
      <div class="solCard" data-solId="${s.id}">
        <div class="solAv">${inicial}</div>
        <div class="solInfo">
          <div class="solNombre">${nombre}${zona}</div>
          <div class="solRuta">${s.viaje?.origen} → ${s.viaje?.destino}</div>
          <div class="solFecha" style="font-size:.78rem;color:var(--textMuted)">${formatearFecha(s.viaje?.fecha)}</div>
        </div>
        <div class="solActions">
          <button class="btnAceptar"  data-id="${s.id}">Aceptar</button>
          <button class="btnRechazar" data-id="${s.id}">Rechazar</button>
        </div>
      </div>`;
    }).join("");

    solicitudesList.querySelectorAll(".btnAceptar").forEach((b) =>
      b.addEventListener("click", () => gestionarSolicitud(b.dataset.id, "aceptar")));
    solicitudesList.querySelectorAll(".btnRechazar").forEach((b) =>
      b.addEventListener("click", () => gestionarSolicitud(b.dataset.id, "rechazar")));
  }

  async function gestionarSolicitud(id, accion) {
    try {
      await apiPatch(`/api/solicitudes/${id}/${accion}`);
      pushNotif(`Solicitud ${accion === "aceptar" ? "aceptada" : "rechazada"} correctamente.`, "ok");
      cargarSolicitudes();
      cargarViajes();
    } catch (err) {
      pushNotif(err.message || "Error al gestionar la solicitud.", "error");
    }
  }

  /* ── Crear viaje ── */
  function abrirModalCrear() {
    if (MODO !== "conductor") { pushNotif("Activa el modo Conductor para publicar viajes.", "error"); return; }
    const hoy = new Date().toISOString().split("T")[0];
    document.getElementById("cvFecha").min = hoy;
    modalCrear.classList.remove("hidden");
  }

  document.getElementById("navCrear")?.addEventListener("click", (e) => { e.preventDefault(); abrirModalCrear(); });
  document.getElementById("qaCrear")?.addEventListener("click", abrirModalCrear);
  document.getElementById("modalClose")?.addEventListener("click",  () => modalCrear.classList.add("hidden"));
  document.getElementById("modalCancel")?.addEventListener("click", () => modalCrear.classList.add("hidden"));

  document.getElementById("formCrearViaje").addEventListener("submit", async (e) => {
    e.preventDefault();
    const alertCrear = document.getElementById("alertCrear");
    alertCrear.className = "alert";
    const body = {
      origen:      document.getElementById("cvOrigen").value.trim(),
      destino:     document.getElementById("cvDestino").value.trim(),
      fecha:       document.getElementById("cvFecha").value,
      horaSalida:  document.getElementById("cvHoraSalida").value,
      horaLlegada: document.getElementById("cvHoraLlegada").value,
      cuposTotal:  parseInt(document.getElementById("cvCupos").value),
      notas:       document.getElementById("cvNotas").value.trim(),
      reglas:      document.getElementById("cvReglas")?.value.trim() || null,
    };
    if (body.horaLlegada <= body.horaSalida) {
      alertCrear.className = "alert show-error";
      alertCrear.textContent = "La hora de llegada debe ser mayor a la de salida.";
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

  /* ── Buscar ── */
  document.getElementById("btnBuscarViajes").addEventListener("click", async () => {
    const filtros = {};
    const origen  = document.getElementById("filtroOrigen").value.trim();
    const destino = document.getElementById("filtroDestino").value.trim();
    const fecha   = document.getElementById("filtroFecha").value;
    if (origen)  filtros.origen  = origen;
    if (destino) filtros.destino = destino;
    if (fecha)   filtros.fecha   = fecha;
    const grid = document.getElementById("viajesGridBuscar");
    grid.innerHTML = '<div class="skeletonCard"></div><div class="skeletonCard"></div>';
    try {
      const viajes = await apiGet(`/api/viajes?${new URLSearchParams(filtros)}`);
      renderViajes(grid, viajes);
    } catch {
      grid.innerHTML = '<p style="color:rgba(10,14,26,.45)">Error al buscar viajes.</p>';
    }
  });

  /* ── Mis Viajes ── */
  async function cargarMisViajes() {
    try {
      const data = await apiGet("/api/viajes/mis-viajes");
      renderMisViajesPasajero(data.pasajero || []);
      renderMisViajesConductor(data.conductor || []);
    } catch { /* silencioso */ }
  }

  function estadoBadge(estado) {
    const map = {
      publicado:  { cls: "badgeEstado publicado",  txt: "Publicado" },
      en_curso:   { cls: "badgeEstado en_curso",   txt: "En curso" },
      finalizado: { cls: "badgeEstado finalizado", txt: "Finalizado" },
      cancelado:  { cls: "badgeEstado cancelado",  txt: "Cancelado" },
    };
    const b = map[estado] || { cls: "badgeEstado", txt: estado };
    return `<span class="${b.cls}">${b.txt}</span>`;
  }

  function renderMisViajesPasajero(participaciones) {
    const el = document.getElementById("tabComoPasajero");
    if (!participaciones.length) {
      el.innerHTML = '<p style="color:var(--textMuted);padding:1rem 0">No has participado en ningún viaje aún.</p>';
      return;
    }
    el.innerHTML = participaciones.map((p) => {
      const v = p.viaje || {};
      const conductorNombre = v.conductor?.usuario
        ? `${v.conductor.usuario.nombre} ${v.conductor.usuario.apellido}`
        : "Conductor";
      return `
      <div class="miViajeCard">
        <div class="mvHeader">
          <div class="mvRuta">${v.origen || "—"} → ${v.destino || "—"}</div>
          ${estadoBadge(v.estado)}
        </div>
        <div class="mvMeta">
          <span>📅 ${formatearFecha(v.fecha)}</span>
          <span>🕐 ${v.horaSalida?.slice(0,5) || "--:--"}</span>
          <span>🚗 ${conductorNombre}</span>
        </div>
        ${v.estado === "finalizado" ? `
        <div class="mvActions">
          <button class="btnCalificar btnSmall" data-viaje="${v.id}" data-evaluado="${v.conductor?.usuario?.id}" data-nombre="${conductorNombre}">⭐ Calificar conductor</button>
          <button class="btnReportar btnSmall btnSmallGhost" data-viaje="${v.id}" data-reportado="${v.conductor?.usuario?.id}">⚠️ Reportar</button>
        </div>` : ""}
      </div>`;
    }).join("");

    el.querySelectorAll(".btnCalificar").forEach(b =>
      b.addEventListener("click", () => abrirModalCalificar(b.dataset.viaje, b.dataset.evaluado, b.dataset.nombre)));
    el.querySelectorAll(".btnReportar").forEach(b =>
      b.addEventListener("click", () => abrirModalReporte(b.dataset.reportado, b.dataset.viaje)));
  }

  function renderMisViajesConductor(viajes) {
    const el = document.getElementById("tabComoConductor");
    if (!viajes.length) {
      el.innerHTML = '<p style="color:var(--textMuted);padding:1rem 0">No has publicado ningún viaje aún.</p>';
      return;
    }
    el.innerHTML = viajes.map((v) => {
      const solPendientes = v.solicitudes?.length || 0;
      const pasajerosList = v.participantes?.map(p => {
        const u = p.pasajero?.usuario;
        return u ? `<span class="participantePill">${u.nombre} ${u.apellido}</span>` : "";
      }).join("") || "";

      return `
      <div class="miViajeCard">
        <div class="mvHeader">
          <div class="mvRuta">${v.origen} → ${v.destino}</div>
          ${estadoBadge(v.estado)}
        </div>
        <div class="mvMeta">
          <span>📅 ${formatearFecha(v.fecha)}</span>
          <span>🕐 ${v.horaSalida?.slice(0,5)}</span>
          <span>💺 ${v.cuposDisponibles}/${v.cuposTotal} cupos</span>
          ${solPendientes ? `<span class="badgeSolPend">${solPendientes} solicitud${solPendientes !== 1 ? "es" : ""} pendiente${solPendientes !== 1 ? "s" : ""}</span>` : ""}
        </div>
        ${pasajerosList ? `<div class="pasajerosList">${pasajerosList}</div>` : ""}
        ${v.estado === "publicado" ? `
        <div class="mvActions">
          <button class="btnCancelarViaje btnSmall btnSmallGhost" data-id="${v.id}">Cancelar viaje</button>
        </div>` : ""}
        ${v.estado === "finalizado" && v.participantes?.length ? `
        <div class="mvActions">
          ${v.participantes.map(p => {
            const u = p.pasajero?.usuario;
            return u ? `<button class="btnCalificar btnSmall" data-viaje="${v.id}" data-evaluado="${u.id}" data-nombre="${u.nombre} ${u.apellido}">⭐ Calificar ${u.nombre}</button>` : "";
          }).join("")}
        </div>` : ""}
      </div>`;
    }).join("");

    el.querySelectorAll(".btnCancelarViaje").forEach(b =>
      b.addEventListener("click", async () => {
        if (!confirm("¿Cancelar este viaje?")) return;
        try {
          await apiDel(`/api/viajes/${b.dataset.id}`);
          pushNotif("Viaje cancelado.", "ok");
          cargarMisViajes();
          cargarViajes();
        } catch (err) { pushNotif(err.message || "Error al cancelar.", "error"); }
      }));

    el.querySelectorAll(".btnCalificar").forEach(b =>
      b.addEventListener("click", () => abrirModalCalificar(b.dataset.viaje, b.dataset.evaluado, b.dataset.nombre)));
  }

  /* ── Modal Calificar (RF8) ── */
  function abrirModalCalificar(viajeId, evaluadoId, nombre) {
    if (!evaluadoId || evaluadoId === "undefined") { pushNotif("No se puede calificar a este usuario.", "error"); return; }
    const modal = document.getElementById("modalCalificar");
    document.getElementById("calNombre").textContent = nombre;
    document.getElementById("calViajeId").value    = viajeId;
    document.getElementById("calEvaluadoId").value = evaluadoId;
    document.getElementById("calPuntuacion").value  = "";
    document.getElementById("calComentario").value  = "";
    document.getElementById("alertCalif").className = "alert";
    // Reset star UI
    document.querySelectorAll(".starBtn").forEach(s => s.classList.remove("active"));
    modal.classList.remove("hidden");
  }

  // Estrellas interactivas
  document.querySelectorAll(".starBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = parseInt(btn.dataset.val);
      document.getElementById("calPuntuacion").value = val;
      document.querySelectorAll(".starBtn").forEach(s => {
        s.classList.toggle("active", parseInt(s.dataset.val) <= val);
      });
    });
  });

  document.getElementById("formCalificar")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const alertC = document.getElementById("alertCalif");
    const viajeId    = document.getElementById("calViajeId").value;
    const evaluadoId = document.getElementById("calEvaluadoId").value;
    const puntuacion = document.getElementById("calPuntuacion").value;
    const comentario = document.getElementById("calComentario").value.trim();

    if (!puntuacion) {
      alertC.className = "alert show-error";
      alertC.textContent = "Selecciona una puntuación.";
      return;
    }
    try {
      await apiPost("/api/calificaciones", { viajeId, evaluadoId, puntuacion: parseInt(puntuacion) });
      if (comentario) {
        await apiPost("/api/calificaciones/resenas", { viajeId, destinoId: evaluadoId, comentario }).catch(() => {});
      }
      document.getElementById("modalCalificar").classList.add("hidden");
      pushNotif("¡Calificación enviada!", "ok");
      cargarStats();
    } catch (err) {
      alertC.className = "alert show-error";
      alertC.textContent = err.message || "Error al calificar.";
    }
  });

  document.getElementById("closeCalificar")?.addEventListener("click", () =>
    document.getElementById("modalCalificar").classList.add("hidden"));

  /* ── Modal Reportar (RF10) ── */
  function abrirModalReporte(reportadoId, viajeId) {
    if (!reportadoId || reportadoId === "undefined") { pushNotif("No se puede reportar.", "error"); return; }
    const modal = document.getElementById("modalReporte");
    document.getElementById("repReportadoId").value = reportadoId;
    document.getElementById("repViajeId").value     = viajeId || "";
    document.getElementById("repMotivo").value      = "";
    document.getElementById("alertReporte").className = "alert";
    modal.classList.remove("hidden");
  }

  document.getElementById("formReporte")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const alertR     = document.getElementById("alertReporte");
    const reportadoId = document.getElementById("repReportadoId").value;
    const viajeId     = document.getElementById("repViajeId").value;
    const motivo      = document.getElementById("repMotivo").value.trim();

    if (motivo.length < 10) {
      alertR.className = "alert show-error";
      alertR.textContent = "El motivo debe tener al menos 10 caracteres.";
      return;
    }
    try {
      await apiPost("/api/reportes", { reportadoId, viajeId, motivo });
      document.getElementById("modalReporte").classList.add("hidden");
      pushNotif("Reporte enviado. El administrador lo revisará.", "ok");
    } catch (err) {
      alertR.className = "alert show-error";
      alertR.textContent = err.message || "Error al enviar el reporte.";
    }
  });

  document.getElementById("closeReporte")?.addEventListener("click", () =>
    document.getElementById("modalReporte").classList.add("hidden"));

  /* ── Perfil personal ── */
  document.getElementById("formPerfil").addEventListener("submit", async (e) => {
    e.preventDefault();
    const alertP = document.getElementById("alertPerfil");
    alertP.className = "alert";
    const body = {
      nombre:   document.getElementById("pfNombre").value.trim(),
      apellido: document.getElementById("pfApellido").value.trim(),
      carrera:  document.getElementById("pfCarrera").value.trim(),
      zona:     document.getElementById("pfZona").value.trim(),
      telefono: document.getElementById("pfTelefono").value.trim(),
    };
    if (!body.nombre || !body.apellido) {
      alertP.className = "alert show-error";
      alertP.textContent = "Nombre y apellido son obligatorios.";
      return;
    }
    try {
      await apiPatch(`/api/usuarios/${USER.id}`, body);
      Object.assign(USER, body);
      sessionStorage.setItem("uride_user", JSON.stringify(USER));
      rellenarUsuario();
      alertP.className = "alert show-ok";
      alertP.textContent = "¡Perfil actualizado correctamente!";
      setTimeout(() => { alertP.className = "alert"; }, 3000);
    } catch (err) {
      alertP.className = "alert show-error";
      alertP.textContent = err.message || "Error al actualizar el perfil.";
    }
  });

  /* ── Perfil conductor ── */
  async function cargarPerfilConductor() {
    try {
      const data = await apiGet(`/api/conductores/${USER.id}`);
      if (data) {
        document.getElementById("pfVehiculo").value      = data.vehiculo      || "";
        document.getElementById("pfColor").value         = data.color         || "";
        document.getElementById("pfPlaca").value         = data.placa         || "";
        document.getElementById("pfLicencia").value      = data.licencia      || "";
        document.getElementById("pfLicenciaVence").value = data.licenciaVence || "";
        USER.conductor = data;
      }
    } catch { /* ok */ }
  }

  document.getElementById("formConductor").addEventListener("submit", async (e) => {
    e.preventDefault();
    const alertC = document.getElementById("alertConductor");
    alertC.className = "alert";
    const body = {
      vehiculo:      document.getElementById("pfVehiculo").value.trim(),
      color:         document.getElementById("pfColor").value.trim(),
      placa:         document.getElementById("pfPlaca").value.trim().toUpperCase(),
      licencia:      document.getElementById("pfLicencia").value.trim(),
      licenciaVence: document.getElementById("pfLicenciaVence").value,
    };
    if (!body.vehiculo || !body.placa || !body.licencia) {
      alertC.className = "alert show-error";
      alertC.textContent = "Vehículo, placa y número de licencia son obligatorios.";
      return;
    }
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
      setTimeout(() => { alertC.className = "alert"; }, 3000);
    } catch (err) {
      alertC.className = "alert show-error";
      alertC.textContent = err.message || "Error al guardar los datos del vehículo.";
    }
  });

  /* ── Foto de perfil ── */
  document.getElementById("btnAvatarEdit").addEventListener("click", () => inputFoto.click());

  inputFoto.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { pushNotif("La imagen no debe superar los 2 MB.", "error"); return; }
    const formData = new FormData();
    formData.append("foto", file);
    try {
      const r = await fetch(`/api/usuarios/${USER.id}/foto`, { method: "POST", credentials: "include", body: formData });
      if (!r.ok) throw new Error();
      const data = await r.json();
      USER.foto = data.fotoUrl;
      sessionStorage.setItem("uride_user", JSON.stringify(USER));
      rellenarUsuario();
      pushNotif("Foto de perfil actualizada.", "ok");
    } catch { pushNotif("No se pudo subir la foto.", "error"); }
  });

  /* ── Tabs mis viajes ── */
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tabContent").forEach((c) => c.classList.add("hidden"));
      tab.classList.add("active");
      const id = `tab${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}`;
      document.getElementById(id)?.classList.remove("hidden");
    });
  });

  /* ── Navegación ── */
  document.querySelectorAll("[data-view]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const view = el.dataset.view;
      if (view) { e.preventDefault(); cambiarVista(view); }
    });
  });

  function cambiarVista(nombre) {
    views.forEach((v) => v.classList.remove("active"));
    navItems.forEach((n) => n.classList.remove("active"));
    const viewId = `view${nombre.charAt(0).toUpperCase() + nombre.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`;
    document.getElementById(viewId)?.classList.add("active");
    document.querySelector(`.navItem[data-view="${nombre}"]`)?.classList.add("active");
    if (nombre === "buscar") {
      const g = document.getElementById("viajesGridBuscar");
      if (!g.children.length) cargarViajes().then(v => renderViajes(g, v)).catch(() => {});
    }
    if (nombre === "misViajes") cargarMisViajes();
  }

  /* ── Notificaciones ── */
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
    mostrarToast(msg, tipo);
  }

  notifBtn?.addEventListener("click", (e) => { e.stopPropagation(); notifPanel.classList.toggle("hidden"); });
  notifClear.addEventListener("click", () => {
    notifList.innerHTML = '<li class="notifEmpty">Sin notificaciones nuevas</li>';
    notifBadge.classList.add("hidden");
    notifCount = 0;
  });
  document.addEventListener("click", (e) => {
    if (!notifPanel.contains(e.target) && !notifBtn?.contains(e.target)) notifPanel.classList.add("hidden");
  });

  /* ── Toast ── */
  function mostrarToast(msg, tipo = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast toast-${tipo}`;
    toast.textContent = msg;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("toastVisible"));
    setTimeout(() => {
      toast.classList.remove("toastVisible");
      toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    }, 3200);
  }

  /* ── Logout ── */
  btnLogout?.addEventListener("click", async () => {
    try { await apiPost("/api/auth/logout", {}); } catch { /* ok */ }
    sessionStorage.clear();
    window.location.href = "/login.html";
  });

  /* ── Búsqueda rápida ── */
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

  /* ── Helpers fetch ── */
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
  async function apiDel(url) {
    const r = await fetch(url, { method: "DELETE", credentials: "include" });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || `Error ${r.status}`); }
    return r.json();
  }

  function formatearFecha(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
    return `${d} ${meses[parseInt(m) - 1]} ${y}`;
  }
