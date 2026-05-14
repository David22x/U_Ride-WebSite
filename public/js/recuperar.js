/* ============================================================
   U-Ride — recuperar.js
   Flujo de 4 pasos:
     1. Ingresar correo → backend envía OTP
     2. Ingresar OTP de 6 dígitos → backend valida
     3. Ingresar nueva contraseña → backend actualiza
     4. Pantalla de éxito → redirige a login
   ============================================================ */

/* ── Elementos del DOM ─────────────────────────────────── */
const stepCorreo = document.getElementById("stepCorreo");
const stepCodigo = document.getElementById("stepCodigo");
const stepNuevaPass = document.getElementById("stepNuevaPass");
const stepExito = document.getElementById("stepExito");

// Paso 1
const formCorreo = document.getElementById("formCorreo");
const inputCorreo = document.getElementById("correo");
const alertCorreo = document.getElementById("alertCorreo");
const btnEnviar = document.getElementById("btnEnviar");

// Paso 2
const correoDisplay = document.getElementById("correoDisplay");
const otpInputs = Array.from(document.querySelectorAll(".otpInput"));
const alertCodigo = document.getElementById("alertCodigo");
const btnVerificar = document.getElementById("btnVerificar");
const timerText = document.getElementById("timerText");
const countdown = document.getElementById("countdown");
const btnReenviar = document.getElementById("btnReenviar");
const btnCambiarCorreo = document.getElementById("btnCambiarCorreo");

// Paso 3
const formNuevaPass = document.getElementById("formNuevaPass");
const nuevaPassInput = document.getElementById("nuevaPass");
const confirmarInput = document.getElementById("confirmarPass");
const alertNuevaPass = document.getElementById("alertNuevaPass");
const btnCambiar = document.getElementById("btnCambiar");

// Medidor de fortaleza
const bars = [1, 2, 3, 4].map((n) => document.getElementById(`bar${n}`));
const passLabel = document.getElementById("passLabel");

let correoGuardado = "";
let codigoValidado = ""; // código ya verificado, se envía en paso 3
let timerInterval = null;

/* ── Helpers ───────────────────────────────────────────── */
function irAPaso(paso) {
  [stepCorreo, stepCodigo, stepNuevaPass, stepExito].forEach((p) =>
    p.classList.add("hidden"),
  );
  paso.classList.remove("hidden");
}

function showAlert(el, msg, tipo = "error") {
  el.textContent = msg;
  el.className = `alert show alert-${tipo === "ok" ? "ok" : "error"}`;
}

function hideAlert(el) {
  el.className = "alert";
  el.textContent = "";
}

function setLoading(btn, loading) {
  btn.querySelector(".btnText").style.display = loading ? "none" : "";
  btn.querySelector(".btnSpinner").hidden = !loading;
  btn.disabled = loading;
}

function setFieldError(inputEl, errId, msg) {
  const err = document.getElementById(errId);
  if (msg) {
    inputEl?.classList.add("error");
    inputEl?.classList.remove("valid");
    if (err) err.textContent = msg;
  } else {
    inputEl?.classList.remove("error");
    inputEl?.classList.add("valid");
    if (err) err.textContent = "";
  }
}

/* ── Mostrar / ocultar contraseña ──────────────────────── */
document.querySelectorAll(".togglePass").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    input.type = input.type === "password" ? "text" : "password";
  });
});

/* ── Medidor de fortaleza ───────────────────────────────── */
function evaluarPass(val) {
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  return score;
}

nuevaPassInput?.addEventListener("input", () => {
  const score = evaluarPass(nuevaPassInput.value);
  const labels = ["", "Débil", "Regular", "Buena", "Fuerte"];
  const clases = ["", "weak", "medium", "strong", "strong"];

  bars.forEach((b, i) => {
    b.className = `bar ${i < score ? clases[score] : ""}`;
  });

  passLabel.textContent = nuevaPassInput.value
    ? labels[score]
    : "Ingresa una contraseña";

  // Limpiar error al escribir
  hideAlert(alertNuevaPass);
  setFieldError(nuevaPassInput, "errNuevaPass", "");
});

confirmarInput?.addEventListener("input", () => {
  setFieldError(confirmarInput, "errConfirmar", "");
});

/* ════════════════════════════════════════════════════════
   PASO 1 — Enviar código al correo
   ════════════════════════════════════════════════════════ */
formCorreo.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert(alertCorreo);

  const correo = inputCorreo.value.trim().toLowerCase();

  // Validación básica en cliente
  if (!correo) {
    setFieldError(inputCorreo, "errCorreo", "Ingresa tu correo.");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    setFieldError(inputCorreo, "errCorreo", "Correo inválido.");
    return;
  }
  setFieldError(inputCorreo, "errCorreo", "");

  setLoading(btnEnviar, true);

  try {
    const res = await fetch("/api/auth/recuperar-contrasena", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo }),
    });

    // Siempre mostramos el paso 2 aunque el correo no exista
    // (no revelar si existe o no — seguridad)
    correoGuardado = correo;
    correoDisplay.textContent = correo;
    irAPaso(stepCodigo);
    otpInputs[0]?.focus();
    iniciarTimer(15 * 60);

    // Si hubo error real (ej: rate limit) lo mostramos
    if (!res.ok && res.status !== 404) {
      const json = await res.json().catch(() => ({}));
      showAlert(
        alertCodigo,
        json.error || "Error al enviar el código.",
        "error",
      );
    }
  } catch {
    showAlert(alertCorreo, "Sin conexión. Verifica tu internet.", "error");
  } finally {
    setLoading(btnEnviar, false);
  }
});

/* ════════════════════════════════════════════════════════
   PASO 2 — Comportamiento OTP
   ════════════════════════════════════════════════════════ */
otpInputs.forEach((inp, i) => {
  // Solo números
  inp.addEventListener("keydown", (e) => {
    if (
      !/^[0-9]$/.test(e.key) &&
      !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"].includes(
        e.key,
      ) &&
      !(e.ctrlKey || e.metaKey)
    ) {
      e.preventDefault();
    }
  });

  inp.addEventListener("input", () => {
    const val = inp.value.replace(/\D/g, "");
    inp.value = val.slice(-1);

    if (val) {
      inp.classList.add("filled");
      inp.classList.remove("error");
      if (i < otpInputs.length - 1) otpInputs[i + 1].focus();
    } else {
      inp.classList.remove("filled");
    }

    // Auto-verificar cuando todos estén llenos
    if (otpInputs.every((o) => o.value)) {
      setTimeout(() => verificarCodigo(), 300);
    }
  });

  inp.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !inp.value && i > 0) {
      otpInputs[i - 1].value = "";
      otpInputs[i - 1].classList.remove("filled");
      otpInputs[i - 1].focus();
    }
  });

  // Pegar código completo
  inp.addEventListener("paste", (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    pasted.split("").forEach((ch, j) => {
      if (otpInputs[j]) {
        otpInputs[j].value = ch;
        otpInputs[j].classList.add("filled");
      }
    });
    const next = Math.min(pasted.length, otpInputs.length - 1);
    otpInputs[next].focus();
    if (pasted.length === 6) setTimeout(() => verificarCodigo(), 300);
  });
});

function getOtpValue() {
  return otpInputs.map((i) => i.value).join("");
}

function resetOtp(withError = false) {
  otpInputs.forEach((o) => {
    o.value = "";
    o.classList.remove("filled");
    if (withError) o.classList.add("error");
    else o.classList.remove("error");
  });
  otpInputs[0].focus();
}

/* ── Verificar código ──────────────────────────────────── */
async function verificarCodigo() {
  const codigo = getOtpValue();
  if (codigo.length < 6) {
    showAlert(alertCodigo, "Ingresa los 6 dígitos del código.", "error");
    return;
  }

  hideAlert(alertCodigo);
  setLoading(btnVerificar, true);

  try {
    const res = await fetch("/api/auth/verificar-codigo-recuperacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: correoGuardado, codigo }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      showAlert(
        alertCodigo,
        json.error || "Código incorrecto o expirado.",
        "error",
      );
      resetOtp(true);
      return;
    }

    // Guardamos el código para enviarlo en el paso 3
    codigoValidado = codigo;
    clearInterval(timerInterval);
    irAPaso(stepNuevaPass);
    nuevaPassInput.focus();
  } catch {
    showAlert(alertCodigo, "Sin conexión. Verifica tu internet.", "error");
  } finally {
    setLoading(btnVerificar, false);
  }
}

btnVerificar.addEventListener("click", verificarCodigo);

/* ── Timer de reenvío ──────────────────────────────────── */
function iniciarTimer(segundos) {
  clearInterval(timerInterval);
  timerText.hidden = false;
  btnReenviar.classList.add("hidden");

  let restantes = segundos;

  function actualizar() {
    const m = Math.floor(restantes / 60)
      .toString()
      .padStart(2, "0");
    const s = (restantes % 60).toString().padStart(2, "0");
    countdown.textContent = `${m}:${s}`;
    if (restantes <= 0) {
      clearInterval(timerInterval);
      timerText.hidden = true;
      btnReenviar.classList.remove("hidden");
    }
    restantes--;
  }

  actualizar();
  timerInterval = setInterval(actualizar, 1000);
}

/* ── Reenviar código ───────────────────────────────────── */
btnReenviar.addEventListener("click", async () => {
  btnReenviar.disabled = true;
  hideAlert(alertCodigo);

  try {
    const res = await fetch("/api/auth/recuperar-contrasena", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: correoGuardado }),
    });

    resetOtp();
    showAlert(alertCodigo, "¡Código reenviado! Revisa tu bandeja.", "ok");
    iniciarTimer(15 * 60);

    if (!res.ok && res.status !== 404) {
      const json = await res.json().catch(() => ({}));
      showAlert(alertCodigo, json.error || "Error al reenviar.", "error");
    }
  } catch {
    showAlert(alertCodigo, "Sin conexión. Intenta de nuevo.", "error");
  } finally {
    btnReenviar.disabled = false;
  }
});

/* ── Volver a cambiar correo ───────────────────────────── */
btnCambiarCorreo.addEventListener("click", () => {
  clearInterval(timerInterval);
  resetOtp();
  hideAlert(alertCodigo);
  irAPaso(stepCorreo);
  inputCorreo.focus();
});

/* ════════════════════════════════════════════════════════
   PASO 3 — Nueva contraseña
   ════════════════════════════════════════════════════════ */
formNuevaPass.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert(alertNuevaPass);

  const nuevaPass = nuevaPassInput.value;
  const confirmar = confirmarInput.value;
  let valid = true;

  // Validar fortaleza
  if (nuevaPass.length < 8) {
    setFieldError(nuevaPassInput, "errNuevaPass", "Mínimo 8 caracteres.");
    valid = false;
  } else if (evaluarPass(nuevaPass) < 2) {
    setFieldError(
      nuevaPassInput,
      "errNuevaPass",
      "La contraseña es demasiado débil.",
    );
    valid = false;
  } else {
    setFieldError(nuevaPassInput, "errNuevaPass", "");
  }

  // Validar coincidencia
  if (nuevaPass !== confirmar) {
    setFieldError(
      confirmarInput,
      "errConfirmar",
      "Las contraseñas no coinciden.",
    );
    valid = false;
  } else if (confirmar) {
    setFieldError(confirmarInput, "errConfirmar", "");
  }

  if (!valid) return;

  setLoading(btnCambiar, true);

  try {
    const res = await fetch("/api/auth/cambiar-contrasena", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        correo: correoGuardado,
        codigo: codigoValidado,
        nuevaContrasena: nuevaPass,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      showAlert(
        alertNuevaPass,
        json.error || "Error al cambiar la contraseña.",
        "error",
      );
      return;
    }

    irAPaso(stepExito);
  } catch {
    showAlert(alertNuevaPass, "Sin conexión. Verifica tu internet.", "error");
  } finally {
    setLoading(btnCambiar, false);
  }
});
