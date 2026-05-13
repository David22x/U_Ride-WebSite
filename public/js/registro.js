const DOMAIN = "uta.edu.ec";

/* ── Elementos del DOM ─────────────────────────────────── */
const stepRegistro = document.getElementById("step-registro");
const stepVerificacion = document.getElementById("step-verificacion");
const stepExito = document.getElementById("step-exito");

const formRegistro = document.getElementById("form-registro");
const btnRegistro = document.getElementById("btn-registro");
const alertReg = document.getElementById("alert-registro");

const correoDisplay = document.getElementById("correo-display");
const otpInputs = Array.from(document.querySelectorAll(".otp-input"));
const btnVerificar = document.getElementById("btn-verificar");
const alertVerif = document.getElementById("alert-verificacion");

const timerText = document.getElementById("timer-text");
const countdown = document.getElementById("countdown");
const btnReenv = document.getElementById("btn-reenviar");
const btnCambiar = document.getElementById("btn-cambiar-correo");

let correoGuardado = "";
let timerInterval = null;

/* ── Utilidades ────────────────────────────────────────── */

function showAlert(el, msg, tipo = "error") {
  el.textContent = msg;
  el.className = `alert show alert-${tipo === "ok" ? "ok" : "error"}`;
}

function hideAlert(el) {
  el.className = "alert";
  el.textContent = "";
}

function setLoading(btn, loading) {
  const txt = btn.querySelector(".btn-text");
  const spn = btn.querySelector(".btn-spinner");
  btn.disabled = loading;
  txt.style.display = loading ? "none" : "";
  spn.hidden = !loading;
}

function setFieldError(inputId, errId, msg) {
  const inp = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (msg) {
    inp?.classList.add("error");
    inp?.classList.remove("valid");
    if (err) err.textContent = msg;
  } else {
    inp?.classList.remove("error");
    inp?.classList.add("valid");
    if (err) err.textContent = "";
  }
}

function clearErrors() {
  document
    .querySelectorAll(".field-error")
    .forEach((e) => (e.textContent = ""));
  document.querySelectorAll("input, select").forEach((e) => {
    e.classList.remove("error", "valid");
  });
}

function irAPaso(step) {
  stepRegistro.classList.add("hidden");
  stepVerificacion.classList.add("hidden");
  stepExito.classList.add("hidden");
  step.classList.remove("hidden");
  step.querySelector("h2")?.focus?.();
}

/* ── Mostrar / ocultar contraseña ──────────────────────── */
document.querySelectorAll(".toggle-pass").forEach((btn) => {
  btn.addEventListener("click", () => {
    const inp = document.getElementById(btn.dataset.target);
    inp.type = inp.type === "password" ? "text" : "password";
  });
});

/* ── Medidor de fortaleza ───────────────────────────────── */
const passInput = document.getElementById("contrasena");
const passLabel = document.getElementById("pass-label");
const bars = [1, 2, 3, 4].map((n) => document.getElementById(`bar-${n}`));

function evaluarPass(val) {
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  return score;
}

passInput?.addEventListener("input", () => {
  const score = evaluarPass(passInput.value);
  const labels = ["", "Débil", "Regular", "Buena", "Fuerte"];
  const clases = ["", "weak", "medium", "strong", "strong"];
  bars.forEach((b, i) => {
    b.className = `bar ${i < score ? clases[score] : ""}`;
  });
  passLabel.textContent = passInput.value
    ? labels[score]
    : "Ingresa una contraseña";
});

/* ── Validación del formulario de registro ─────────────── */
function validarRegistro(data) {
  let ok = true;

  if (!data.nombre.trim()) {
    setFieldError("nombre", "err-nombre", "El nombre es requerido.");
    ok = false;
  } else {
    setFieldError("nombre", "err-nombre", "");
  }

  if (!data.apellido.trim()) {
    setFieldError("apellido", "err-apellido", "El apellido es requerido.");
    ok = false;
  } else {
    setFieldError("apellido", "err-apellido", "");
  }

  const correoOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo);
  if (!correoOk) {
    setFieldError("correo", "err-correo", "Ingresa un correo válido.");
    ok = false;
  } else if (!data.correo.endsWith(`@${DOMAIN}`)) {
    setFieldError(
      "correo",
      "err-correo",
      `Solo se permiten correos @${DOMAIN}`,
    );
    ok = false;
  } else {
    setFieldError("correo", "err-correo", "");
  }

  if (!data.carrera) {
    setFieldError("carrera", "err-carrera", "Selecciona tu carrera.");
    ok = false;
  } else {
    setFieldError("carrera", "err-carrera", "");
  }

  const passScore = evaluarPass(data.contrasena);
  if (data.contrasena.length < 8) {
    setFieldError("contrasena", "err-contrasena", "Mínimo 8 caracteres.");
    ok = false;
  } else if (passScore < 2) {
    setFieldError(
      "contrasena",
      "err-contrasena",
      "La contraseña es demasiado débil.",
    );
    ok = false;
  } else {
    setFieldError("contrasena", "err-contrasena", "");
  }

  if (data.contrasena !== data.confirmar) {
    setFieldError(
      "confirmar",
      "err-confirmar",
      "Las contraseñas no coinciden.",
    );
    ok = false;
  } else if (data.contrasena) {
    setFieldError("confirmar", "err-confirmar", "");
  }

  return ok;
}

/* ── PASO 1: Envío del formulario de registro ──────────── */
formRegistro?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();
  hideAlert(alertReg);

  const data = {
    nombre: document.getElementById("nombre").value,
    apellido: document.getElementById("apellido").value,
    correo: document.getElementById("correo").value.trim().toLowerCase(),
    carrera: document.getElementById("carrera").value,
    zona: document.getElementById("zona").value.trim(),
    contrasena: document.getElementById("contrasena").value,
    confirmar: document.getElementById("confirmar").value,
  };

  if (!validarRegistro(data)) return;

  setLoading(btnRegistro, true);

  try {
    const res = await fetch("/api/auth/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo,
        carrera: data.carrera,
        zona: data.zona,
        contrasena: data.contrasena,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      showAlert(
        alertReg,
        json.error || "Error al crear la cuenta. Intenta de nuevo.",
      );
      return;
    }

    // Pasar al paso de verificación
    correoGuardado = data.correo;
    correoDisplay.textContent = data.correo;
    irAPaso(stepVerificacion);
    otpInputs[0]?.focus();
    iniciarTimer(15 * 60); // 15 minutos
  } catch {
    showAlert(
      alertReg,
      "Sin conexión. Verifica tu internet e intenta de nuevo.",
    );
  } finally {
    setLoading(btnRegistro, false);
  }
});

/* ── OTP: comportamiento de los inputs ─────────────────── */
otpInputs.forEach((inp, i) => {
  inp.addEventListener("keydown", (e) => {
    // Solo números y teclas de control
    if (
      !/^[0-9]$/.test(e.key) &&
      !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "v"].includes(
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
      // Avanzar al siguiente
      if (i < otpInputs.length - 1) otpInputs[i + 1].focus();
    } else {
      inp.classList.remove("filled");
    }

    // Auto-verificar si todos están llenos
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
  });
  if (!withError) otpInputs.forEach((o) => o.classList.remove("error"));
  otpInputs[0].focus();
}

/* ── PASO 2: Verificar código ──────────────────────────── */
async function verificarCodigo() {
  const codigo = getOtpValue();
  if (codigo.length < 6) {
    showAlert(alertVerif, "Ingresa los 6 dígitos del código.");
    return;
  }

  hideAlert(alertVerif);
  setLoading(btnVerificar, true);

  try {
    const res = await fetch("/api/auth/verificar-codigo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: correoGuardado, codigo }),
    });

    const json = await res.json();

    if (!res.ok) {
      showAlert(
        alertVerif,
        json.error || "Código incorrecto. Intenta de nuevo.",
      );
      resetOtp(true);
      return;
    }

    // Detener timer y pasar a éxito
    clearInterval(timerInterval);
    irAPaso(stepExito);
  } catch {
    showAlert(alertVerif, "Sin conexión. Verifica tu internet.");
  } finally {
    setLoading(btnVerificar, false);
  }
}

btnVerificar?.addEventListener("click", verificarCodigo);

/* ── Timer de reenvío ──────────────────────────────────── */
function iniciarTimer(segundos) {
  clearInterval(timerInterval);
  timerText.hidden = false;
  btnReenv.classList.add("hidden");

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
      btnReenv.classList.remove("hidden");
    }
    restantes--;
  }

  actualizar();
  timerInterval = setInterval(actualizar, 1000);
}

/* ── Reenviar código ───────────────────────────────────── */
btnReenv?.addEventListener("click", async () => {
  btnReenv.disabled = true;
  hideAlert(alertVerif);

  try {
    const res = await fetch("/api/auth/reenviar-codigo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: correoGuardado }),
    });

    const json = await res.json();

    if (!res.ok) {
      showAlert(alertVerif, json.error || "No se pudo reenviar el código.");
      btnReenv.disabled = false;
      return;
    }

    resetOtp();
    showAlert(
      alertVerif,
      "¡Código reenviado! Revisa tu bandeja de entrada.",
      "ok",
    );
    iniciarTimer(15 * 60);
  } catch {
    showAlert(alertVerif, "Sin conexión. Intenta de nuevo.");
    btnReenv.disabled = false;
  }
});

/* ── Volver a cambiar correo ───────────────────────────── */
btnCambiar?.addEventListener("click", () => {
  clearInterval(timerInterval);
  resetOtp();
  hideAlert(alertVerif);
  irAPaso(stepRegistro);
});
