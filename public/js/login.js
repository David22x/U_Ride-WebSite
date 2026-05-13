/* ============================================================
   U-Ride — login.js
   Inicio de sesión simple: correo + contraseña, sin OTP
   ============================================================ */

const formLogin = document.getElementById("form-login");
const btnLogin = document.getElementById("btn-login");
const alertLogin = document.getElementById("alert-login");

/* ── Mostrar / ocultar contraseña ──────────────────────── */
document.querySelectorAll(".toggle-pass").forEach((btn) => {
  btn.addEventListener("click", () => {
    const inp = document.getElementById(btn.dataset.target);
    inp.type = inp.type === "password" ? "text" : "password";
  });
});

/* ── Utilidades ────────────────────────────────────────── */
function showAlert(msg, tipo = "error") {
  alertLogin.textContent = msg;
  alertLogin.className = `alert show alert-${tipo === "ok" ? "ok" : "error"}`;
}

function hideAlert() {
  alertLogin.className = "alert";
  alertLogin.textContent = "";
}

function setLoading(loading) {
  const txt = btnLogin.querySelector(".btn-text");
  const spn = btnLogin.querySelector(".btn-spinner");
  btnLogin.disabled = loading;
  txt.style.display = loading ? "none" : "";
  spn.hidden = !loading;
}

function setFieldError(inputId, errId, msg) {
  const inp = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (msg) {
    inp?.classList.add("error");
    if (err) err.textContent = msg;
  } else {
    inp?.classList.remove("error");
    if (err) err.textContent = "";
  }
}

/* ── Validación básica en el cliente ───────────────────── */
function validarLogin(correo, contrasena) {
  let ok = true;

  const correoOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
  if (!correo) {
    setFieldError("correo", "err-correo", "Ingresa tu correo.");
    ok = false;
  } else if (!correoOk) {
    setFieldError("correo", "err-correo", "Correo inválido.");
    ok = false;
  } else {
    setFieldError("correo", "err-correo", "");
  }

  if (!contrasena) {
    setFieldError("contrasena", "err-contrasena", "Ingresa tu contraseña.");
    ok = false;
  } else {
    setFieldError("contrasena", "err-contrasena", "");
  }

  return ok;
}

/* ── Submit del login ──────────────────────────────────── */
formLogin?.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert();

  const correo = document.getElementById("correo").value.trim().toLowerCase();
  const contrasena = document.getElementById("contrasena").value;

  if (!validarLogin(correo, contrasena)) return;

  setLoading(true);

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // incluye la cookie httpOnly
      body: JSON.stringify({ correo, contrasena }),
    });

    const json = await res.json();

    if (!res.ok) {
      // Mensaje genérico para no revelar si el correo existe
      const msg =
        res.status === 401
          ? "Correo o contraseña incorrectos."
          : json.error || "Error al iniciar sesión.";
      showAlert(msg);
      return;
    }

    // Guardar datos básicos del usuario en sessionStorage
    sessionStorage.setItem("uride_user", JSON.stringify(json.usuario));

    // Redirigir según rol
    if (json.usuario.rol === "administrador") {
      window.location.href = "/admin.html";
    } else {
      window.location.href = "/viajes.html";
    }
  } catch {
    showAlert("Sin conexión. Verifica tu internet e intenta de nuevo.");
  } finally {
    setLoading(false);
  }
});

/* ── Limpiar error al escribir ─────────────────────────── */
document.getElementById("correo")?.addEventListener("input", () => {
  setFieldError("correo", "err-correo", "");
  hideAlert();
});

document.getElementById("contrasena")?.addEventListener("input", () => {
  setFieldError("contrasena", "err-contrasena", "");
  hideAlert();
});
