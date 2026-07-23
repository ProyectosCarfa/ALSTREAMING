/**
 * ============================================================
 * ALSTREAMING
 * login.js
 * Login con usuario / teléfono / correo
 * MySQL XAMPP - BLOQUEO DE ACCESO SI YA HAY SESIÓN
 * ============================================================
 */

const API_URL = "/Alex/backend/api/";

let loading = false;
let defaultButton = "";

document.addEventListener("DOMContentLoaded", () => {
    // ============================================
    // 🔥 VERIFICAR SI YA EXISTE SESIÓN ACTIVA
    // 🔥 SI HAY SESIÓN, REDIRIGIR INMEDIATAMENTE
    // 🔥 ESTO BLOQUEA EL ACCESO AL LOGIN
    // ============================================
    const sesionActiva = verificarSesionLocal();
    
    if (sesionActiva) {
        console.log("⛔ Sesión activa detectada. Redirigiendo fuera del login...");
        console.log("👤 Usuario:", sesionActiva.username, "| Rol:", sesionActiva.role);
        
        // Redirigir inmediatamente según el rol
        if (sesionActiva.role === "admin") {
            window.location.replace("/Alex/frontend/pages/admin/administrador.html");
        } else {
            window.location.replace("/Alex/index.html");
        }
        return; // DETENER TODO, no cargar el formulario
    }

    // Solo si NO hay sesión, cargar el formulario
    const form = document.getElementById("loginForm");
    const identifierInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const btnLogin = document.getElementById("btnLogin");

    if (!form || !identifierInput || !passwordInput || !btnLogin) {
        console.error("Elementos login incompletos");
        return;
    }

    defaultButton = btnLogin.innerHTML;
    identifierInput.focus();

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (loading) return;

        const identifier = identifierInput.value.trim();
        const password = passwordInput.value.trim();

        if (!identifier) {
            notify("Ingrese usuario, teléfono o correo.", "warning");
            identifierInput.focus();
            return;
        }

        if (!password) {
            notify("Ingrese su contraseña.", "warning");
            passwordInput.focus();
            return;
        }

        if (password.length < 8) {
            notify("La contraseña debe tener mínimo 8 caracteres.", "warning");
            passwordInput.focus();
            return;
        }

        loading = true;
        bloquear(true, btnLogin, identifierInput, passwordInput);

        try {
            const response = await fetch(API_URL + "login.php", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    identifier,
                    password
                })
            });

            const text = await response.text();
            let result;

            try {
                result = JSON.parse(text);
            } catch (error) {
                console.error("RESPUESTA PHP:", text);
                notify("El servidor devolvió una respuesta inválida.", "error");
                loading = false;
                bloquear(false, btnLogin, identifierInput, passwordInput);
                return;
            }

            if (!response.ok || !result.success) {
                notify(result.message || "Datos incorrectos.", "error");
                passwordInput.value = "";
                loading = false;
                bloquear(false, btnLogin, identifierInput, passwordInput);
                return;
            }

            // ============================================
            // 🔥 GUARDAR SESIÓN EN LOCALSTORAGE
            // ============================================
            guardarSesionLocal({
                id: result.user?.id,
                username: result.user?.username,
                email: result.user?.email || "",
                role: result.user?.role,
                phone: result.user?.phone || "",
                lastLogin: new Date().toISOString()
            });

            notify("Bienvenido " + (result.user?.username || "usuario"), "success");

            // Redirigir después de login exitoso
            setTimeout(() => {
                if (result.user?.role === "admin") {
                    window.location.replace("/Alex/frontend/pages/admin/administrador.html");
                } else {
                    window.location.replace("/Alex/index.html");
                }
            }, 1000);

        } catch (error) {
            console.error("FETCH ERROR:", error);
            notify("No se pudo conectar con el servidor.", "error");
            loading = false;
            bloquear(false, btnLogin, identifierInput, passwordInput);
        }
    });
});

// ============================================
// FUNCIÓN: GUARDAR SESIÓN EN LOCALSTORAGE
// ============================================
function guardarSesionLocal(userData) {
    try {
        const sesionData = {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            phone: userData.phone,
            lastLogin: userData.lastLogin,
            timestamp: Date.now(),
            expira: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
        };

        localStorage.setItem("alstreaming_session", JSON.stringify(sesionData));
        console.log("✅ Sesión guardada:", sesionData.username);
    } catch (error) {
        console.error("❌ Error al guardar sesión:", error);
    }
}

// ============================================
// FUNCIÓN: VERIFICAR SESIÓN EXISTENTE
// ============================================
function verificarSesionLocal() {
    try {
        const sesionData = localStorage.getItem("alstreaming_session");

        if (!sesionData) {
            return null;
        }

        const session = JSON.parse(sesionData);

        // Verificar expiración (24 horas)
        if (Date.now() > session.expira) {
            console.warn("⚠️ Sesión expirada, eliminando...");
            localStorage.removeItem("alstreaming_session");
            return null;
        }

        return session;
    } catch (error) {
        console.error("❌ Error al verificar sesión:", error);
        localStorage.removeItem("alstreaming_session");
        return null;
    }
}

// ============================================
// FUNCIÓN: BLOQUEAR FORMULARIO
// ============================================
function bloquear(valor, btnLogin, identifierInput, passwordInput) {
    identifierInput.disabled = valor;
    passwordInput.disabled = valor;
    btnLogin.disabled = valor;

    if (valor) {
        btnLogin.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Ingresando...
        `;
    } else {
        btnLogin.innerHTML = defaultButton;
    }
}

// ============================================
// FUNCIÓN: NOTIFICACIONES
// ============================================
function notify(mensaje, tipo = "info") {
    const container = document.getElementById("notificationContainer");

    if (!container) {
        console.error("No existe notificationContainer");
        return;
    }

    const icons = {
        success: "fa-circle-check",
        error: "fa-circle-xmark",
        warning: "fa-triangle-exclamation",
        info: "fa-circle-info"
    };

    const div = document.createElement("div");
    div.className = "notification " + tipo;
    div.innerHTML = `
        <div class="notification-icon">
            <i class="fa-solid ${icons[tipo] || icons.info}"></i>
        </div>
        <div class="notification-text">
            ${mensaje}
        </div>
        <button class="notification-close">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    container.appendChild(div);

    const close = div.querySelector(".notification-close");
    if (close) {
        close.onclick = () => div.remove();
    }

    setTimeout(() => {
        if (div) div.remove();
    }, 4000);
}